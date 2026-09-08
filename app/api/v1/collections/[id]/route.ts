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
 * GET /api/v1/collections/:id
 * Fetches sanitized DTO of a single collection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const db = await getDatabase();

    let colObjId: ObjectId;
    try {
      colObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Collection identifier is not valid.", 422, "id");
    }

    const col = await db.collection("inventory").findOne({ _id: colObjId });
    if (!col) {
      return apiError("COLLECTION_NOT_FOUND", "Collection not found.", 404, "id");
    }

    // Strict supplier data isolation (Section 81)
    if (user!.role === "supplier" && col.supplierId !== user!.userId) {
      return apiError("FORBIDDEN", "You do not have permission to view another supplier's collection.", 403);
    }

    const isInternal = ["admin", "super_admin", "accounts", "operations"].includes(user!.role);
    const rawItems: any[] = Array.isArray(col.items) ? col.items : [];

    const formattedGroups = rawItems.map((g, idx) => ({
      id: g.id || `group_${idx + 1}`,
      material: {
        id: g.materialId || g.material || "UNKNOWN",
        name: g.material || "Unknown Material",
      },
      grade: {
        id: g.gradeId || g.grade || "UNKNOWN",
        name: g.grade || "Standard Grade",
      },
      sackCount: Number(g.sackCount || (Array.isArray(g.sacks) ? g.sacks.length : 0)),
      totalWeightKg: formatWeight(g.totalWeightKg || 0),
      unitPriceSnapshot: isInternal ? formatCurrency(g.unitPricePerKg || 0) : undefined,
      calculatedValue: isInternal ? formatCurrency(g.estimatedValueKes || 0) : undefined,
    }));

    const responseDto = {
      id: col._id.toString(),
      loadNumber: col.loadNumber || `RWL-${col._id.toString().slice(-6).toUpperCase()}`,
      status: (col.status || "CAPTURING").toUpperCase(),
      supplier: {
        id: col.supplierId ? col.supplierId.toString() : "",
        name: col.supplierName || "Unknown Supplier",
      },
      hubId: col.hubId ? col.hubId.toString() : null,
      fieldOfficerId: col.fieldOfficerId ? col.fieldOfficerId.toString() : null,
      driverId: col.driverId ? col.driverId.toString() : null,
      groups: formattedGroups,
      totalSackCount: Number(col.totalSacks || 0),
      totalWeightKg: formatWeight(col.normalizedWeightKg || 0),
      totalValue: isInternal ? formatCurrency(col.grossValueKes || 0) : undefined,
      startedAt: col.startedAt || col.createdAt,
      finalizedAt: col.finalizedAt || null,
      createdAt: col.createdAt,
      updatedAt: col.updatedAt,
    };

    return apiSuccess(responseDto);
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch collection", 500);
  }
}

/**
 * DELETE /api/v1/collections/:id
 * Cancels a collection if it is not yet finalized
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const db = await getDatabase();

    let colObjId: ObjectId;
    try {
      colObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Collection identifier is not valid.", 422, "id");
    }

    const col = await db.collection("inventory").findOne({ _id: colObjId });
    if (!col) {
      return apiError("COLLECTION_NOT_FOUND", "Collection not found.", 404, "id");
    }

    const currentStatus = (col.status || "").toUpperCase();
    if (currentStatus !== "CAPTURING" && currentStatus !== "DRAFT") {
      return apiError(
        "COLLECTION_NOT_CANCELLABLE",
        `Collection in status '${currentStatus}' cannot be cancelled.`,
        409
      );
    }

    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          status: "CANCELLED",
          updatedAt: new Date(),
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "COLLECTION_CANCELLED",
      entityType: "COLLECTION",
      entityId: id,
      before: { status: currentStatus },
      after: { status: "CANCELLED" },
    });

    return apiSuccess({ message: "Collection cancelled successfully.", id, status: "CANCELLED" });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to cancel collection", 500);
  }
}
