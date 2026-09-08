import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { toWeight, toCurrency } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/orders
 * Lists B2B customer sales orders.
 * Query params: status, customerName
 *
 * POST /api/v1/orders
 * Creates a new B2B customer sales order.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "accounts", "driver"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerName = searchParams.get("customerName");
    const driverId = searchParams.get("driverId");

    const query: any = {};
    if (status) query.status = status.toUpperCase();
    if (customerName) query.customerName = { $regex: new RegExp(customerName, "i") };
    if (driverId) {
      if (ObjectId.isValid(driverId)) {
        query.$or = [{ assignedDriverId: driverId }, { assignedDriverId: new ObjectId(driverId) }];
      } else {
        query.assignedDriverId = driverId;
      }
    }

    const db = await getDatabase();
    const orders = await db
      .collection("customer_orders")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const mapped = orders.map((o: any) => ({
      id: o._id.toString(),
      orderNo: o.orderNo,
      customerName: o.customerName,
      customerContact: o.customerContact || null,
      customerPhone: o.customerPhone || null,
      customerEmail: o.customerEmail || null,
      deliveryAddress: o.deliveryAddress,
      deliveryCounty: o.deliveryCounty || "Nairobi",
      material: o.material,
      grade: o.grade,
      requiredQuantityKg: o.requiredQuantityKg,
      unitPriceKes: o.unitPriceKes,
      totalAmountKes: o.totalAmountKes,
      status: o.status,
      reservedLotIds: o.reservedLotIds || [],
      assignedDriverId: o.assignedDriverId ? o.assignedDriverId.toString() : null,
      assignedDriverName: o.assignedDriverName || null,
      assignedVehiclePlate: o.assignedVehiclePlate || null,
      dispatchedAt: o.dispatchedAt || null,
      deliveredAt: o.deliveredAt || null,
      proofOfDeliveryPhoto: o.proofOfDeliveryPhoto || null,
      recipientName: o.recipientName || null,
      deliveryNotes: o.deliveryNotes || null,
      paymentStatus: o.paymentStatus || "PENDING",
      createdAt: o.createdAt,
    }));

    return apiSuccess({ total: mapped.length, orders: mapped });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to fetch customer orders", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const {
      customerName,
      customerContact = "",
      customerPhone = "",
      customerEmail = "",
      deliveryAddress,
      deliveryCounty = "Nairobi",
      material,
      grade = "Standard",
      requiredQuantityKg,
      unitPriceKes,
    } = body;

    if (!customerName || !customerName.trim()) {
      return apiError("VALIDATION_ERROR", "Customer / Company name is required.", 422, "customerName");
    }
    if (!deliveryAddress || !deliveryAddress.trim()) {
      return apiError("VALIDATION_ERROR", "Delivery address is required.", 422, "deliveryAddress");
    }
    if (!material || !material.trim()) {
      return apiError("VALIDATION_ERROR", "Material type is required.", 422, "material");
    }

    const numQty = toWeight(requiredQuantityKg);
    if (numQty <= 0) {
      return apiError("INVALID_QUANTITY", "Required quantity must be greater than zero.", 422, "requiredQuantityKg");
    }

    const numPrice = toCurrency(unitPriceKes);
    if (numPrice <= 0) {
      return apiError("INVALID_PRICE", "Unit price must be greater than zero.", 422, "unitPriceKes");
    }

    const totalAmountKes = Math.round(numQty * numPrice * 100) / 100;
    const now = new Date();
    const orderNo = `ORD-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = {
      orderNo,
      customerName: customerName.trim(),
      customerContact,
      customerPhone,
      customerEmail,
      deliveryAddress: deliveryAddress.trim(),
      deliveryCounty,
      material: material.trim(),
      grade: grade.trim(),
      requiredQuantityKg: numQty,
      unitPriceKes: numPrice,
      totalAmountKes,
      status: "PENDING",
      reservedLotIds: [],
      assignedDriverId: null,
      assignedDriverName: null,
      assignedVehiclePlate: null,
      dispatchedAt: null,
      deliveredAt: null,
      proofOfDeliveryPhoto: null,
      recipientName: null,
      deliveryNotes: null,
      paymentStatus: "PENDING",
      createdBy: user!.userId,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDatabase();
    const res = await db.collection("customer_orders").insertOne(newOrder);

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "CUSTOMER_ORDER_CREATED",
      entityType: "customer_order",
      entityId: res.insertedId.toString(),
      metadata: { orderNo, customerName, requiredQuantityKg: numQty, totalAmountKes },
    });

    return apiSuccess(
      {
        message: "Customer order created.",
        order: {
          id: res.insertedId.toString(),
          orderNo,
          customerName,
          status: "PENDING",
          requiredQuantityKg: numQty,
          totalAmountKes,
        },
      },
      201
    );
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to create customer order", 500);
  }
}
