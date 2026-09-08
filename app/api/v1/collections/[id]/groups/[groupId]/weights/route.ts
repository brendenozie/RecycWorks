import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
  checkAndStoreIdempotency,
} from "@/lib/api-auth";
import { toWeight, formatWeight, sumWeights } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/collections/:id/groups/:groupId/weights
 * Retrieves individual sack weights for a group
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
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

    const { id, groupId } = await params;
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

    if (user!.role === "supplier" && col.supplierId !== user!.userId) {
      return apiError("FORBIDDEN", "Access denied.", 403);
    }

    const items: any[] = Array.isArray(col.items) ? col.items : [];
    const targetGroup = items.find((g) => g.id === groupId);
    if (!targetGroup) {
      return apiError("GROUP_NOT_FOUND", "Collection group not found.", 404, "groupId");
    }

    const sackRecords: any[] = Array.isArray(targetGroup.sackRecords)
      ? targetGroup.sackRecords
      : (Array.isArray(targetGroup.sacks) ? targetGroup.sacks : []).map((w: number, i: number) => ({
          id: `w_${i + 1}`,
          sequenceNumber: i + 1,
          weightKg: toWeight(w),
        }));

    return apiSuccess({
      groupId,
      material: targetGroup.material,
      grade: targetGroup.grade,
      weights: sackRecords.map((s) => ({
        id: s.id,
        sequenceNumber: s.sequenceNumber,
        weightKg: formatWeight(s.weightKg),
        capturedAt: s.capturedAt || targetGroup.createdAt,
      })),
      sackCount: sackRecords.length,
      totalWeightKg: formatWeight(targetGroup.totalWeightKg || 0),
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch weights", 500);
  }
}

/**
 * POST /api/v1/collections/:id/groups/:groupId/weights
 * Atomically appends a sack weight to a group and recalculates group + collection totals.
 * Supports Idempotency-Key header.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id, groupId } = await params;
    const idempotencyKey = request.headers.get("idempotency-key") || request.headers.get("x-idempotency-key");

    const body = await request.json().catch(() => ({}));
    const rawWeight = body.weightKg !== undefined ? body.weightKg : body.weight;
    const weightKg = toWeight(rawWeight);

    if (weightKg <= 0) {
      return apiError("INVALID_WEIGHT", "Weight must be greater than zero.", 422, "weightKg");
    }

    const db = await getDatabase();

    let colObjId: ObjectId;
    try {
      colObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Collection identifier is not valid.", 422, "id");
    }

    // Idempotency execution wrapper
    const { result, fromCache } = await checkAndStoreIdempotency(
      idempotencyKey,
      `weights:${id}:${groupId}`,
      async () => {
        const col = await db.collection("inventory").findOne({ _id: colObjId });
        if (!col) {
          throw { status: 404, code: "COLLECTION_NOT_FOUND", message: "Collection not found." };
        }

        const currentStatus = (col.status || "").toUpperCase();
        if (currentStatus !== "CAPTURING" && currentStatus !== "DRAFT") {
          throw {
            status: 409,
            code: "COLLECTION_NOT_EDITABLE",
            message: `Collection in status '${currentStatus}' is not editable.`,
          };
        }

        const items: any[] = Array.isArray(col.items) ? col.items : [];
        const groupIndex = items.findIndex((g) => g.id === groupId);
        if (groupIndex === -1) {
          throw { status: 404, code: "GROUP_NOT_FOUND", message: "Collection group not found." };
        }

        const targetGroup = { ...items[groupIndex] };
        const sacks: number[] = Array.isArray(targetGroup.sacks) ? [...targetGroup.sacks] : [];
        const sackRecords: any[] = Array.isArray(targetGroup.sackRecords) ? [...targetGroup.sackRecords] : [];

        // Build new sack record
        const sequenceNumber = sacks.length + 1;
        const sackId = `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newSackRecord = {
          id: sackId,
          sequenceNumber,
          weightKg,
          capturedByUserId: user!.userId,
          capturedAt: new Date(),
        };

        sacks.push(weightKg);
        sackRecords.push(newSackRecord);

        // Recalculate group totals using precision math
        targetGroup.sacks = sacks;
        targetGroup.sackRecords = sackRecords;
        targetGroup.sackCount = sacks.length;
        targetGroup.totalWeightKg = sumWeights(sacks);
        targetGroup.updatedAt = new Date();

        items[groupIndex] = targetGroup;

        // Recalculate collection grand totals using precision math
        const allGroupWeights = items.map((g) => g.totalWeightKg || 0);
        const grandTotalWeight = sumWeights(allGroupWeights);
        const grandTotalSacks = items.reduce((acc, g) => acc + (g.sackCount || 0), 0);

        // Atomic update of collection and embedded groups
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

        // Audit Log
        await logAuditEvent({
          actorUserId: user!.userId,
          action: "SACK_WEIGHT_ADDED",
          entityType: "SACK_WEIGHT",
          entityId: sackId,
          details: {
            collectionId: id,
            groupId,
            sequenceNumber,
            weightKg,
            idempotencyKey,
          },
        });

        return {
          weight: {
            id: sackId,
            sequenceNumber,
            weightKg: formatWeight(weightKg),
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
        };
      }
    );

    return apiSuccess(result, fromCache ? 200 : 201);
  } catch (error: any) {
    if (error.code && error.status) {
      return apiError(error.code, error.message, error.status);
    }
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to add sack weight", 500);
  }
}
