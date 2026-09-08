import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { formatWeight, formatCurrency } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/collections
 * Lists collections according to requesting user role and permissions
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, [
      "field_officer",
      "admin",
      "super_admin",
      "operations",
      "accounts",
      "driver",
      "supplier",
    ]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");

    let query: Record<string, any> = {};

    // Enforce data isolation per role
    if (user!.role === "supplier") {
      query.supplierId = user!.userId;
    } else if (user!.role === "driver") {
      query.$or = [{ driverId: user!.userId }, { status: "ready_for_collection" }];
    } else if (user!.role === "field_officer") {
      const mineOnly = searchParams.get("mine") === "true";
      if (mineOnly) {
        query.fieldOfficerId = user!.userId;
      }
    }

    if (status) {
      query.status = status;
    }
    if (supplierId && user!.role !== "supplier") {
      query.supplierId = supplierId;
    }

    const loads = await db
      .collection("inventory")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const collections = loads.map((l) => ({
      id: l._id.toString(),
      loadNumber: l.loadNumber || `RWL-${l._id.toString().slice(-6).toUpperCase()}`,
      status: (l.status || "CAPTURING").toUpperCase(),
      supplier: {
        id: l.supplierId ? l.supplierId.toString() : "",
        name: l.supplierName || "Unknown Supplier",
      },
      hubId: l.hubId ? l.hubId.toString() : null,
      totalSackCount: Number(l.totalSacks || 0),
      totalWeightKg: formatWeight(l.normalizedWeightKg || 0),
      totalEstimatedValue:
        user!.role === "driver"
          ? undefined
          : formatCurrency(l.netValueKes || l.grossValueKes || 0),
      paymentStatus: l.paymentStatus || "pending",
      paymentReference: l.paymentReference || null,
      groupCount: Array.isArray(l.items) ? l.items.length : 0,
      createdAt: l.createdAt || l.timestamp,
    }));

    return apiSuccess({ items: collections, count: collections.length });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch collections", 500);
  }
}

/**
 * POST /api/v1/collections
 * Creates a new draft collection in CAPTURING status
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const { supplierId, hubId, notes } = body;

    if (!supplierId || !supplierId.trim()) {
      return apiError("VALIDATION_ERROR", "Supplier ID is required to create a collection.", 422, "supplierId");
    }

    const db = await getDatabase();

    // Verify supplier exists
    let supplierObjId: ObjectId | null = null;
    try {
      supplierObjId = new ObjectId(supplierId);
    } catch {
      return apiError("INVALID_SUPPLIER_ID", "Provided supplier ID is not a valid identifier.", 422, "supplierId");
    }

    const supplier = await db.collection("users").findOne({ _id: supplierObjId });
    if (!supplier) {
      return apiError("SUPPLIER_NOT_FOUND", "The specified supplier does not exist.", 404, "supplierId");
    }

    const supplierName = supplier.businessName || `${supplier.firstName} ${supplier.lastName}`.trim();
    const loadNumber = `RWL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newCollection = {
      loadNumber,
      supplierId: supplier._id.toString(),
      supplierName,
      supplierCode: supplier.supplierCode || null,
      fieldOfficerId: user!.userId,
      fieldOfficerName: user!.email,
      hubId: hubId || supplier.hubId || null,
      status: "CAPTURING",
      totalSacks: 0,
      normalizedWeightKg: 0,
      quantity: 0,
      unit: "KG",
      unitPricePerKg: 0,
      grossValueKes: 0,
      netValueKes: 0,
      adjustmentKes: 0,
      items: [], // Array of CollectionGroups
      notes: notes || null,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection("inventory").insertOne(newCollection);
    const collectionId = insertResult.insertedId.toString();

    // Audit Log
    await logAuditEvent({
      actorUserId: user!.userId,
      action: "COLLECTION_CREATED",
      entityType: "COLLECTION",
      entityId: collectionId,
      after: { loadNumber, supplierId: supplier._id.toString(), status: "CAPTURING" },
    });

    const responseDto = {
      id: collectionId,
      loadNumber,
      status: "CAPTURING",
      supplier: {
        id: supplier._id.toString(),
        name: supplierName,
      },
      hubId: newCollection.hubId,
      totalSackCount: 0,
      totalWeightKg: "0.000",
      createdAt: newCollection.createdAt,
    };

    return apiSuccess(responseDto, 201);
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to create collection", 500);
  }
}
