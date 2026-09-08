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
 * POST /api/v1/orders/:id/reserve
 * Checks physical inventory availability and reserves finished/processed stock for the customer order.
 * Prevents overselling by strictly checking availableQuantityKg against commitments.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
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

    if (order.status !== "PENDING" && order.status !== "APPROVED") {
      return apiError("INVALID_STATE", `Cannot reserve stock for order in '${order.status}' state.`, 400);
    }

    const requiredKg = order.requiredQuantityKg;

    // Query available finished / processed lots matching the material
    const matchingLots = await db
      .collection("inventory_lots")
      .find({
        material: { $regex: new RegExp(order.material, "i") },
        stage: { $in: ["PROCESSED", "FINISHED", "SORTED"] },
        status: { $ne: "DEPLETED" },
        availableQuantityKg: { $gt: 0 },
      })
      .sort({ createdAt: 1 }) // FIFO reservation
      .toArray();

    const totalAvailableKg = matchingLots.reduce(
      (acc: number, lot: any) => acc + (lot.availableQuantityKg || 0),
      0
    );

    // Section 155 check: Shortfall detection
    if (totalAvailableKg < requiredKg) {
      const shortKg = Math.round((requiredKg - totalAvailableKg) * 100) / 100;
      return apiError(
        "INSUFFICIENT_STOCK",
        `Insufficient available stock for ${order.material}. Required: ${requiredKg} KG, Available: ${totalAvailableKg} KG, Shortfall: ${shortKg} KG.`,
        422,
        "requiredQuantityKg"
      );
    }

    // Allocate reservation across matching lots
    let remainingToReserve = requiredKg;
    const reservedLotIds: string[] = [];
    const now = new Date();

    for (const lot of matchingLots) {
      if (remainingToReserve <= 0) break;

      const lotAvail = lot.availableQuantityKg || 0;
      const allocateKg = Math.min(lotAvail, remainingToReserve);

      if (allocateKg > 0) {
        const newAvail = Math.round((lotAvail - allocateKg) * 100) / 100;
        const newReserved = Math.round(((lot.reservedQuantityKg || 0) + allocateKg) * 100) / 100;

        await db.collection("inventory_lots").updateOne(
          { _id: lot._id },
          {
            $set: {
              availableQuantityKg: newAvail,
              reservedQuantityKg: newReserved,
              status: "RESERVED",
              updatedAt: now,
            },
          }
        );

        // Record reservation movement
        const movementNumber = `MOV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        await db.collection("inventory_movements").insertOne({
          movementNumber,
          lotId: lot._id,
          hubId: lot.hubId,
          type: "ORDER_RESERVATION",
          quantityKg: -allocateKg,
          balanceAfterKg: newAvail,
          referenceType: "ORDER",
          referenceId: order._id.toString(),
          performedBy: user!.userId,
          notes: `Reserved ${allocateKg} KG for customer order ${order.orderNo} (${order.customerName})`,
          timestamp: now,
        });

        reservedLotIds.push(lot._id.toString());
        remainingToReserve -= allocateKg;
      }
    }

    await db.collection("customer_orders").updateOne(
      { _id: orderObjId },
      {
        $set: {
          status: "RESERVED",
          reservedLotIds,
          updatedAt: now,
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "CUSTOMER_ORDER_STOCK_RESERVED",
      entityType: "customer_order",
      entityId: order._id.toString(),
      metadata: {
        orderNo: order.orderNo,
        customerName: order.customerName,
        requiredQuantityKg: requiredKg,
        reservedLotIds,
      },
    });

    return apiSuccess({
      message: `Stock of ${requiredKg} KG ${order.material} successfully reserved.`,
      orderNo: order.orderNo,
      status: "RESERVED",
      requiredQuantityKg: requiredKg,
      reservedLotIds,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to reserve order stock", 500);
  }
}
