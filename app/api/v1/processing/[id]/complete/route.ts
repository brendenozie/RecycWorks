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
 * POST /api/v1/processing/:id/complete
 * Completes processing batch (crushing, shredding, pelletizing, etc.),
 * reconciles output vs input weights, creates PROCESSED/FINISHED inventory lots,
 * and logs authoritative inventory movements.
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
    const body = await request.json().catch(() => ({}));
    const {
      outputs = [], // [{ material, grade, quantityKg }]
      residueQuantityKg = 0,
      processLossKg = 0,
      notes = "",
    } = body;

    if (!Array.isArray(outputs) || outputs.length === 0) {
      return apiError("VALIDATION_ERROR", "At least one processed material output is required.", 422, "outputs");
    }

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

    if (batch.status !== "IN_PROGRESS" && batch.status !== "PLANNED") {
      return apiError("INVALID_STATE", `Cannot complete batch in '${batch.status}' state.`, 400);
    }

    const now = new Date();
    const numResidue = toWeight(residueQuantityKg);
    const numLoss = toWeight(processLossKg);

    let totalOutputKg = 0;
    const enrichedOutputs: any[] = [];

    for (const out of outputs) {
      const outQty = toWeight(out.quantityKg);
      if (outQty <= 0) continue;
      totalOutputKg += outQty;

      // Create new PROCESSED/FINISHED inventory lot
      const lotNumber = `LOT-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const lotDoc = {
        lotNumber,
        hubId: batch.hubId,
        hubName: batch.hubName,
        material: out.material || batch.outputStockType || batch.inputMaterial,
        grade: out.grade || "Processed Grade",
        stage: "PROCESSED",
        quantityKg: outQty,
        availableQuantityKg: outQty,
        reservedQuantityKg: 0,
        unit: "KG",
        sourceType: "PROCESSING_OUTPUT",
        sourceId: batch._id.toString(),
        status: "AVAILABLE",
        createdAt: now,
        updatedAt: now,
      };

      const lotInsert = await db.collection("inventory_lots").insertOne(lotDoc);

      // Log movement
      const movementNumber = `MOV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      await db.collection("inventory_movements").insertOne({
        movementNumber,
        lotId: lotInsert.insertedId,
        hubId: batch.hubId,
        type: "PROCESSING_OUTPUT",
        quantityKg: outQty,
        balanceAfterKg: outQty,
        referenceType: "PROCESSING",
        referenceId: batch._id.toString(),
        performedBy: user!.userId,
        notes: `Processed output from ${batch.processType} batch ${batch.batchNo}: ${lotDoc.material} ${lotDoc.grade}`,
        timestamp: now,
      });

      enrichedOutputs.push({
        material: lotDoc.material,
        grade: lotDoc.grade,
        quantityKg: outQty,
        outputLotId: lotInsert.insertedId.toString(),
        lotNumber,
      });
    }

    totalOutputKg = Math.round(totalOutputKg * 100) / 100;
    const accountedTotal = Math.round((totalOutputKg + numResidue + numLoss) * 100) / 100;
    const varianceKg = Math.round((batch.inputQuantityKg - accountedTotal) * 100) / 100;

    await db.collection("processing_batches").updateOne(
      { _id: batchObjId },
      {
        $set: {
          status: "COMPLETED",
          outputs: enrichedOutputs,
          residueQuantityKg: numResidue,
          processLossKg: numLoss,
          totalOutputKg,
          varianceKg,
          notes: notes || batch.notes,
          completedAt: now,
          updatedAt: now,
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "PROCESSING_BATCH_COMPLETED",
      entityType: "processing_batch",
      entityId: batch._id.toString(),
      metadata: {
        batchNo: batch.batchNo,
        processType: batch.processType,
        inputQuantityKg: batch.inputQuantityKg,
        totalOutputKg,
        residueQuantityKg: numResidue,
        varianceKg,
      },
    });

    return apiSuccess({
      message: "Processing batch completed successfully.",
      batchNo: batch.batchNo,
      status: "COMPLETED",
      reconciliation: {
        inputQuantityKg: batch.inputQuantityKg,
        totalOutputKg,
        residueQuantityKg: numResidue,
        processLossKg: numLoss,
        varianceKg,
        reconciled: varianceKg === 0,
      },
      outputs: enrichedOutputs,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to complete processing batch", 500);
  }
}
