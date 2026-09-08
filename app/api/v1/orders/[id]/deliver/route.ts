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
 * POST /api/v1/orders/:id/deliver
 * Confirms customer receipt of outbound order with Proof of Delivery (POD) photo,
 * completes physical inventory deduction, and logs OUTBOUND_DELIVERY movement.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["driver", "operations", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      proofOfDeliveryPhoto = null,
      recipientName = "Customer Representative",
      deliveryNotes = "",
    } = body;

    const db = await getDatabase();

    let orderObjId: ObjectId;
    try {
      orderObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Invalid customer order ID.", 422, "id");
    }

    const order = await db.collection("customer_orders").findOne({ _id: orderObjId });
    if (!order) {
      return apiError("NOT_FOUND", "Customer order not found.", 404, "id");
    }

    if (order.status === "DELIVERED" || order.status === "COMPLETED") {
      return apiError("ALREADY_DELIVERED", "This customer order has already been delivered.", 400);
    }

    const now = new Date();

    // Deduct physical inventory from reserved lots
    if (order.reservedLotIds && order.reservedLotIds.length > 0) {
      let remainingToDeduct = order.requiredQuantityKg;

      for (const lotIdStr of order.reservedLotIds) {
        if (remainingToDeduct <= 0) break;
        if (!ObjectId.isValid(lotIdStr)) continue;

        const lotObjId = new ObjectId(lotIdStr);
        const lot = await db.collection("inventory_lots").findOne({ _id: lotObjId });
        if (!lot) continue;

        const deductKg = Math.min(lot.reservedQuantityKg || lot.quantityKg || 0, remainingToDeduct);
        if (deductKg > 0) {
          const newReserved = Math.max(0, Math.round(((lot.reservedQuantityKg || 0) - deductKg) * 100) / 100);
          const newTotal = Math.max(0, Math.round(((lot.quantityKg || 0) - deductKg) * 100) / 100);
          const newStatus = newTotal <= 0 ? "DEPLETED" : (newReserved > 0 ? "RESERVED" : "AVAILABLE");

          await db.collection("inventory_lots").updateOne(
            { _id: lotObjId },
            {
              $set: {
                reservedQuantityKg: newReserved,
                quantityKg: newTotal,
                status: newStatus,
                updatedAt: now,
              },
            }
          );

          // Log OUTBOUND_DELIVERY movement
          const movementNumber = `MOV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
          await db.collection("inventory_movements").insertOne({
            movementNumber,
            lotId: lotObjId,
            hubId: lot.hubId,
            type: "OUTBOUND_DELIVERY",
            quantityKg: -deductKg,
            balanceAfterKg: newTotal,
            referenceType: "ORDER",
            referenceId: order._id.toString(),
            performedBy: user!.userId,
            notes: `Outbound delivery of ${deductKg} KG for ${order.orderNo} to ${order.customerName}. Received by: ${recipientName}`,
            timestamp: now,
          });

          remainingToDeduct -= deductKg;
        }
      }
    }

    await db.collection("customer_orders").updateOne(
      { _id: orderObjId },
      {
        $set: {
          status: "DELIVERED",
          deliveredAt: now,
          proofOfDeliveryPhoto,
          recipientName,
          deliveryNotes,
          updatedAt: now,
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "CUSTOMER_ORDER_DELIVERED",
      entityType: "customer_order",
      entityId: order._id.toString(),
      metadata: {
        orderNo: order.orderNo,
        customerName: order.customerName,
        deliveredKg: order.requiredQuantityKg,
        recipientName,
        hasProofPhoto: Boolean(proofOfDeliveryPhoto),
      },
    });

    return apiSuccess({
      message: "Customer delivery completed successfully.",
      orderNo: order.orderNo,
      status: "DELIVERED",
      customerName: order.customerName,
      deliveredKg: order.requiredQuantityKg,
      recipientName,
      deliveredAt: now,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to complete customer delivery", 500);
  }
}
