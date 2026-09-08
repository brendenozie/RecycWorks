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
 * POST /api/v1/sorting/:id/complete
 * Completes sorting work order, reconciles output vs input weights,
 * creates new SORTED inventory lots, and logs inventory movements.
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
      rejectQuantityKg = 0,
      lossQuantityKg = 0,
      varianceReason = null,
      notes = "",
    } = body;

    if (!Array.isArray(outputs) || outputs.length === 0) {
      return apiError("VALIDATION_ERROR", "At least one sorted material output is required.", 422, "outputs");
    }

    const db = await getDatabase();

    let orderObjId: ObjectId;
    try {
      orderObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Invalid sorting work order ID.", 422, "id");
    }

    const order = await db.collection("sorting_work_orders").findOne({ _id: orderObjId });
    if (!order) {
      return apiError("NOT_FOUND", "Sorting work order not found.", 404, "id");
    }

    if (order.status !== "IN_PROGRESS" && order.status !== "PLANNED") {
      return apiError("INVALID_STATE", `Cannot complete order in '${order.status}' state.`, 400);
    }

    const now = new Date();
    const numReject = toWeight(rejectQuantityKg);
    const numLoss = toWeight(lossQuantityKg);

    let totalOutputKg = 0;
    const enrichedOutputs: any[] = [];

    for (const out of outputs) {
      const outQty = toWeight(out.quantityKg);
      if (outQty <= 0) continue;
      totalOutputKg += outQty;

      // Create new SORTED inventory lot
      const lotNumber = `LOT-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const lotDoc = {
        lotNumber,
        hubId: order.hubId,
        hubName: order.hubName,
        material: out.material || order.inputMaterial,
        grade: out.grade || "Grade A",
        stage: "SORTED",
        quantityKg: outQty,
        availableQuantityKg: outQty,
        reservedQuantityKg: 0,
        unit: "KG",
        sourceType: "SORTING_OUTPUT",
        sourceId: order._id.toString(),
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
        hubId: order.hubId,
        type: "SORTING_OUTPUT",
        quantityKg: outQty,
        balanceAfterKg: outQty,
        referenceType: "SORTING",
        referenceId: order._id.toString(),
        performedBy: user!.userId,
        notes: `Sorted output from work order ${order.workOrderNo}: ${out.material} ${out.grade}`,
        timestamp: now,
      });

      enrichedOutputs.push({
        material: out.material || order.inputMaterial,
        grade: out.grade || "Grade A",
        quantityKg: outQty,
        outputLotId: lotInsert.insertedId.toString(),
        lotNumber,
      });
    }

    totalOutputKg = Math.round(totalOutputKg * 100) / 100;
    const accountedTotal = Math.round((totalOutputKg + numReject + numLoss) * 100) / 100;
    const varianceKg = Math.round((order.inputQuantityKg - accountedTotal) * 100) / 100;

    await db.collection("sorting_work_orders").updateOne(
      { _id: orderObjId },
      {
        $set: {
          status: "COMPLETED",
          outputs: enrichedOutputs,
          rejectQuantityKg: numReject,
          lossQuantityKg: numLoss,
          totalOutputKg,
          varianceKg,
          varianceReason: varianceReason || (varianceKg !== 0 ? "Sorting weight variance" : null),
          notes: notes || order.notes,
          completedAt: now,
          updatedAt: now,
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "SORTING_WORK_ORDER_COMPLETED",
      entityType: "sorting_work_order",
      entityId: order._id.toString(),
      metadata: {
        workOrderNo: order.workOrderNo,
        inputQuantityKg: order.inputQuantityKg,
        totalOutputKg,
        varianceKg,
      },
    });

    return apiSuccess({
      message: "Sorting work order completed successfully.",
      workOrderNo: order.workOrderNo,
      status: "COMPLETED",
      reconciliation: {
        inputQuantityKg: order.inputQuantityKg,
        totalOutputKg,
        rejectQuantityKg: numReject,
        lossQuantityKg: numLoss,
        varianceKg,
        reconciled: varianceKg === 0,
      },
      outputs: enrichedOutputs,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to complete sorting work order", 500);
  }
}
