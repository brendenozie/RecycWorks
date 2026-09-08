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
 * POST /api/v1/orders/:id/dispatch
 * Assigns driver and vehicle to customer delivery and sets status to DISPATCHED.
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
    const body = await request.json().catch(() => ({}));
    const { driverId, driverName, vehiclePlate } = body;

    if (!vehiclePlate || !vehiclePlate.trim()) {
      return apiError("VALIDATION_ERROR", "Vehicle plate is required.", 422, "vehiclePlate");
    }

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

    if (order.status !== "RESERVED" && order.status !== "APPROVED" && order.status !== "PENDING") {
      return apiError("INVALID_STATE", `Cannot dispatch order in '${order.status}' state. Stock must be reserved.`, 400);
    }

    let assignedDriverIdObj: any = null;
    let finalDriverName = driverName || "Assigned Driver";

    if (driverId) {
      if (ObjectId.isValid(driverId)) {
        assignedDriverIdObj = new ObjectId(driverId);
        const driverUser = await db.collection("users").findOne({ _id: assignedDriverIdObj });
        if (driverUser) {
          finalDriverName = `${driverUser.firstName} ${driverUser.lastName || ""}`.trim();
        }
      } else {
        assignedDriverIdObj = driverId;
      }
    }

    const now = new Date();

    await db.collection("customer_orders").updateOne(
      { _id: orderObjId },
      {
        $set: {
          status: "DISPATCHED",
          assignedDriverId: assignedDriverIdObj,
          assignedDriverName: finalDriverName,
          assignedVehiclePlate: vehiclePlate.trim().toUpperCase(),
          dispatchedAt: now,
          updatedAt: now,
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "CUSTOMER_ORDER_DISPATCHED",
      entityType: "customer_order",
      entityId: order._id.toString(),
      metadata: {
        orderNo: order.orderNo,
        customerName: order.customerName,
        driverName: finalDriverName,
        vehiclePlate: vehiclePlate.trim().toUpperCase(),
      },
    });

    return apiSuccess({
      message: "Customer order dispatched for delivery.",
      orderNo: order.orderNo,
      status: "DISPATCHED",
      driverName: finalDriverName,
      vehiclePlate: vehiclePlate.trim().toUpperCase(),
      dispatchedAt: now,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to dispatch customer order", 500);
  }
}
