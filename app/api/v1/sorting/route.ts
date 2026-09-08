import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { toWeight } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/sorting
 * Lists sorting work orders.
 * Query params: hubId, status
 *
 * POST /api/v1/sorting
 * Creates a new sorting work order from source raw inventory lot(s).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "hub-manager"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hubId");
    const status = searchParams.get("status");

    const query: any = {};
    if (hubId) {
      if (ObjectId.isValid(hubId)) {
        query.$or = [{ hubId }, { hubId: new ObjectId(hubId) }];
      } else {
        query.hubId = hubId;
      }
    }
    if (status) query.status = status.toUpperCase();

    const db = await getDatabase();
    const orders = await db
      .collection("sorting_work_orders")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const mapped = orders.map((o: any) => ({
      id: o._id.toString(),
      workOrderNo: o.workOrderNo,
      hubId: o.hubId ? o.hubId.toString() : null,
      hubName: o.hubName || "Central Depot",
      sourceLotIds: o.sourceLotIds || [],
      inputMaterial: o.inputMaterial,
      inputQuantityKg: o.inputQuantityKg,
      assignedStaff: o.assignedStaff || [],
      status: o.status,
      outputs: o.outputs || [],
      rejectQuantityKg: o.rejectQuantityKg || 0,
      lossQuantityKg: o.lossQuantityKg || 0,
      totalOutputKg: o.totalOutputKg || 0,
      varianceKg: o.varianceKg || 0,
      varianceReason: o.varianceReason || null,
      startedAt: o.startedAt || null,
      completedAt: o.completedAt || null,
      notes: o.notes || null,
      createdAt: o.createdAt,
    }));

    return apiSuccess({ total: mapped.length, orders: mapped });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to fetch sorting work orders", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "hub-manager"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const {
      hubId,
      sourceLotIds = [],
      inputMaterial,
      inputQuantityKg,
      assignedStaff = [],
      notes = "",
    } = body;

    if (!inputMaterial) {
      return apiError("VALIDATION_ERROR", "Input material is required.", 422, "inputMaterial");
    }

    const numQty = toWeight(inputQuantityKg);
    if (numQty <= 0) {
      return apiError("INVALID_QUANTITY", "Input quantity must be greater than zero.", 422, "inputQuantityKg");
    }

    const db = await getDatabase();

    // Verify source lots if provided
    let hubName = "Central Depot";
    let validHubId = hubId;

    if (sourceLotIds.length > 0) {
      const objIds = sourceLotIds
        .filter((s: string) => ObjectId.isValid(s))
        .map((s: string) => new ObjectId(s));

      const sourceLots = await db
        .collection("inventory_lots")
        .find({ _id: { $in: objIds } })
        .toArray();

      if (sourceLots.length === 0) {
        return apiError("LOT_NOT_FOUND", "Specified source inventory lots were not found.", 404, "sourceLotIds");
      }

      const totalAvail = sourceLots.reduce((acc: number, l: any) => acc + (l.availableQuantityKg || 0), 0);
      if (totalAvail < numQty) {
        return apiError(
          "INSUFFICIENT_STOCK",
          `Source lots only have ${totalAvail} KG available, but ${numQty} KG requested.`,
          422,
          "inputQuantityKg"
        );
      }

      hubName = sourceLots[0].hubName || hubName;
      validHubId = sourceLots[0].hubId || validHubId;
    }

    const now = new Date();
    const workOrderNo = `SWO-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const hubIdObj = validHubId
      ? (ObjectId.isValid(validHubId) ? new ObjectId(validHubId) : validHubId)
      : new ObjectId();

    const newOrder = {
      workOrderNo,
      hubId: hubIdObj,
      hubName,
      sourceLotIds,
      inputMaterial,
      inputQuantityKg: numQty,
      assignedStaff: Array.isArray(assignedStaff) ? assignedStaff : [assignedStaff],
      status: "PLANNED",
      outputs: [],
      rejectQuantityKg: 0,
      lossQuantityKg: 0,
      totalOutputKg: 0,
      varianceKg: 0,
      varianceReason: null,
      startedAt: null,
      completedAt: null,
      notes,
      createdBy: user!.userId,
      createdAt: now,
      updatedAt: now,
    };

    const res = await db.collection("sorting_work_orders").insertOne(newOrder);

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "SORTING_WORK_ORDER_CREATED",
      entityType: "sorting_work_order",
      entityId: res.insertedId.toString(),
      metadata: { workOrderNo, inputMaterial, inputQuantityKg: numQty },
    });

    return apiSuccess(
      {
        message: "Sorting work order created.",
        order: {
          id: res.insertedId.toString(),
          workOrderNo,
          status: "PLANNED",
          inputMaterial,
          inputQuantityKg: numQty,
          assignedStaff: newOrder.assignedStaff,
        },
      },
      201
    );
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to create sorting work order", 500);
  }
}
