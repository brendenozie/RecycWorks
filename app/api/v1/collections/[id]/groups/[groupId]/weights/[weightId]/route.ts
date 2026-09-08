import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { toWeight, formatWeight, sumWeights } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * PATCH /api/v1/collections/:id/groups/:groupId/weights/:weightId
 * Edits an individual sack weight before collection finalization
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string; weightId: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id, groupId, weightId } = await params;
    const body = await request.json().catch(() => ({}));
    const rawWeight = body.weightKg !== undefined ? body.weightKg : body.weight;
    const newWeightKg = toWeight(rawWeight);

    if (newWeightKg <= 0) {
      return apiError("INVALID_WEIGHT", "Weight must be greater than zero.", 422, "weightKg");
    }

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
        "COLLECTION_NOT_EDITABLE",
        `Weights cannot be edited once collection is in '${currentStatus}' status.`,
        403
      );
    }

    const items: any[] = Array.isArray(col.items) ? col.items : [];
    const groupIndex = items.findIndex((g) => g.id === groupId);
    if (groupIndex === -1) {
      return apiError("GROUP_NOT_FOUND", "Collection group not found.", 404, "groupId");
    }

    const targetGroup = { ...items[groupIndex] };
    const sackRecords: any[] = Array.isArray(targetGroup.sackRecords) ? [...targetGroup.sackRecords] : [];
    const sackIndex = sackRecords.findIndex((s) => s.id === weightId);

    if (sackIndex === -1) {
      return apiError("WEIGHT_NOT_FOUND", "Sack weight record not found.", 404, "weightId");
    }

    const oldWeightKg = sackRecords[sackIndex].weightKg;
    sackRecords[sackIndex] = {
      ...sackRecords[sackIndex],
      weightKg: newWeightKg,
      editedAt: new Date(),
      editedByUserId: user!.userId,
    };

    const sacks = sackRecords.map((s) => s.weightKg);
    targetGroup.sackRecords = sackRecords;
    targetGroup.sacks = sacks;
    targetGroup.totalWeightKg = sumWeights(sacks);
    targetGroup.updatedAt = new Date();

    items[groupIndex] = targetGroup;

    const allGroupWeights = items.map((g) => g.totalWeightKg || 0);
    const grandTotalWeight = sumWeights(allGroupWeights);
    const grandTotalSacks = items.reduce((acc, g) => acc + (g.sackCount || 0), 0);

    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          items,
          totalSacks: grandTotalSacks,
          normalizedWeightKg: grandTotalWeight,
          quantity: grandTotalWeight,
          updatedAt: new Date(),
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "SACK_WEIGHT_UPDATED",
      entityType: "SACK_WEIGHT",
      entityId: weightId,
      before: { weightKg: oldWeightKg },
      after: { weightKg: newWeightKg },
    });

    return apiSuccess({
      weight: {
        id: weightId,
        sequenceNumber: sackRecords[sackIndex].sequenceNumber,
        weightKg: formatWeight(newWeightKg),
      },
      group: {
        id: groupId,
        sackCount: targetGroup.sackCount,
        totalWeightKg: formatWeight(targetGroup.totalWeightKg),
      },
      collection: {
        totalSackCount: grandTotalSacks,
        totalWeightKg: formatWeight(grandTotalWeight),
      },
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to edit sack weight", 500);
  }
}

/**
 * DELETE /api/v1/collections/:id/groups/:groupId/weights/:weightId
 * Deletes an individual sack weight before finalization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string; weightId: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id, groupId, weightId } = await params;
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
        "COLLECTION_NOT_EDITABLE",
        `Weights cannot be deleted once collection is in '${currentStatus}' status.`,
        403
      );
    }

    const items: any[] = Array.isArray(col.items) ? col.items : [];
    const groupIndex = items.findIndex((g) => g.id === groupId);
    if (groupIndex === -1) {
      return apiError("GROUP_NOT_FOUND", "Collection group not found.", 404, "groupId");
    }

    const targetGroup = { ...items[groupIndex] };
    const sackRecords: any[] = Array.isArray(targetGroup.sackRecords) ? [...targetGroup.sackRecords] : [];
    const sackIndex = sackRecords.findIndex((s) => s.id === weightId);

    if (sackIndex === -1) {
      return apiError("WEIGHT_NOT_FOUND", "Sack weight record not found.", 404, "weightId");
    }

    const removedWeightKg = sackRecords[sackIndex].weightKg;
    const updatedSackRecords = sackRecords
      .filter((s) => s.id !== weightId)
      .map((s, idx) => ({ ...s, sequenceNumber: idx + 1 })); // Re-index sequences

    const sacks = updatedSackRecords.map((s) => s.weightKg);
    targetGroup.sackRecords = updatedSackRecords;
    targetGroup.sacks = sacks;
    targetGroup.sackCount = sacks.length;
    targetGroup.totalWeightKg = sumWeights(sacks);
    targetGroup.updatedAt = new Date();

    items[groupIndex] = targetGroup;

    const allGroupWeights = items.map((g) => g.totalWeightKg || 0);
    const grandTotalWeight = sumWeights(allGroupWeights);
    const grandTotalSacks = items.reduce((acc, g) => acc + (g.sackCount || 0), 0);

    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          items,
          totalSacks: grandTotalSacks,
          normalizedWeightKg: grandTotalWeight,
          quantity: grandTotalWeight,
          updatedAt: new Date(),
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "SACK_WEIGHT_DELETED",
      entityType: "SACK_WEIGHT",
      entityId: weightId,
      before: { weightKg: removedWeightKg },
    });

    return apiSuccess({
      message: "Sack weight deleted successfully.",
      group: {
        id: groupId,
        sackCount: targetGroup.sackCount,
        totalWeightKg: formatWeight(targetGroup.totalWeightKg),
      },
      collection: {
        totalSackCount: grandTotalSacks,
        totalWeightKg: formatWeight(grandTotalWeight),
      },
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to delete sack weight", 500);
  }
}
