import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/processing/:id/start
 * Starts processing batch, puts machine in operation, and consumes input inventory lots.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "hub-manager"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const db = await getDatabase();

    let batchObjId: ObjectId;
    try {
      batchObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Invalid processing batch ID.", 422, "id");
    }

    const batch = await db.collection("processing_batches").findOne({ _id: batchObjId });
    if (!batch) {
      return apiError("NOT_FOUND", "Processing batch not found.", 404, "id");
    }

    if (batch.status !== "PLANNED" && batch.status !== "PAUSED") {
      return apiError("INVALID_STATE", `Cannot start batch in '${batch.status}' state.`, 400);
    }

    const now = new Date();

    // Deduct stock from source lots
    if (batch.sourceLotIds && batch.sourceLotIds.length > 0) {
      let remainingToDeduct = batch.inputQuantityKg;

      for (const lotIdStr of batch.sourceLotIds) {
        if (remainingToDeduct <= 0) break;
        if (!ObjectId.isValid(lotIdStr)) continue;

        const lotObjId = new ObjectId(lotIdStr);
        const lot = await db.collection("inventory_lots").findOne({ _id: lotObjId });
        if (!lot) continue;

        const deductKg = Math.min(lot.availableQuantityKg || 0, remainingToDeduct);
        if (deductKg > 0) {
          const newAvail = Math.round(((lot.availableQuantityKg || 0) - deductKg) * 100) / 100;
          const newTotal = Math.round(((lot.quantityKg || 0) - deductKg) * 100) / 100;
          const newStatus = newTotal <= 0 ? "DEPLETED" : lot.status;

          await db.collection("inventory_lots").updateOne(
            { _id: lotObjId },
            {
              $set: {
                availableQuantityKg: newAvail,
                quantityKg: newTotal,
                status: newStatus,
                updatedAt: now,
              },
            }
          );

          // Log movement
          const movementNumber = `MOV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
          await db.collection("inventory_movements").insertOne({
            movementNumber,
            lotId: lotObjId,
            hubId: batch.hubId,
            type: "PROCESSING_INPUT",
            quantityKg: -deductKg,
            balanceAfterKg: newTotal,
            referenceType: "PROCESSING",
            referenceId: batch._id.toString(),
            performedBy: user!.userId,
            notes: `Consumed ${deductKg} KG for ${batch.processType} batch ${batch.batchNo} on ${batch.machineName}`,
            timestamp: now,
          });

          remainingToDeduct -= deductKg;
        }
      }
    }

    await db.collection("processing_batches").updateOne(
      { _id: batchObjId },
      {
        $set: {
          status: "IN_PROGRESS",
          startedAt: batch.startedAt || now,
          updatedAt: now,
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "PROCESSING_BATCH_STARTED",
      entityType: "processing_batch",
      entityId: batch._id.toString(),
      metadata: { batchNo: batch.batchNo, machineName: batch.machineName, inputQuantityKg: batch.inputQuantityKg },
    });

    return apiSuccess({
      message: `${batch.processType} processing batch started.`,
      batchNo: batch.batchNo,
      status: "IN_PROGRESS",
      startedAt: now,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to start processing batch", 500);
  }
}
