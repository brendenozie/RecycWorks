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
 * POST /api/v1/sorting/:id/start
 * Transitions work order to IN_PROGRESS and reserves/consumes source raw stock.
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

    if (order.status !== "PLANNED") {
      return apiError("INVALID_STATE", `Cannot start order in '${order.status}' state.`, 400);
    }

    const now = new Date();

    // Deduct stock from source lots if linked
    if (order.sourceLotIds && order.sourceLotIds.length > 0) {
      let remainingToDeduct = order.inputQuantityKg;

      for (const lotIdStr of order.sourceLotIds) {
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
            hubId: order.hubId,
            type: "SORTING_CONSUMPTION",
            quantityKg: -deductKg,
            balanceAfterKg: newTotal,
            referenceType: "SORTING",
            referenceId: order._id.toString(),
            performedBy: user!.userId,
            notes: `Consumed ${deductKg} KG for sorting work order ${order.workOrderNo}`,
            timestamp: now,
          });

          remainingToDeduct -= deductKg;
        }
      }
    }

    await db.collection("sorting_work_orders").updateOne(
      { _id: orderObjId },
      {
        $set: {
          status: "IN_PROGRESS",
          startedAt: now,
          updatedAt: now,
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "SORTING_WORK_ORDER_STARTED",
      entityType: "sorting_work_order",
      entityId: order._id.toString(),
      metadata: { workOrderNo: order.workOrderNo, inputQuantityKg: order.inputQuantityKg },
    });

    return apiSuccess({
      message: "Sorting work order started.",
      workOrderNo: order.workOrderNo,
      status: "IN_PROGRESS",
      startedAt: now,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to start sorting work order", 500);
  }
}
