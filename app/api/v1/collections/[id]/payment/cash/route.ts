import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { formatCurrency } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/collections/:id/payment/cash
 * Settles supplier payment via Cash, recording receipt number and notes.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["admin", "super_admin", "accounts", "finance"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { receiptNumber, amount, notes } = body;

    if (!receiptNumber || !receiptNumber.trim()) {
      return apiError("VALIDATION_ERROR", "Cash receipt number is required.", 422, "receiptNumber");
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

    if (col.paymentStatus === "paid") {
      return apiError("ALREADY_PAID", "This collection has already been marked as paid.", 400);
    }

    const netPayable = col.netValueKes || col.grossValueKes || 0;
    const finalAmount = amount !== undefined ? Number(amount) : netPayable;

    const now = new Date();
    const paymentNo = `PAY-${now.getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Look up supplier name
    const supplierName = col.supplierName || "Supplier";
    const supplierId = col.supplierId ? new ObjectId(col.supplierId) : new ObjectId();

    const paymentRecord = {
      paymentNo,
      recipientId: supplierId,
      recipientName: supplierName,
      recipientType: "supplier",
      loadId: colObjId,
      amount: formatCurrency(finalAmount),
      method: "CASH",
      provider: "CASH",
      paymentReference: receiptNumber.trim().toUpperCase(),
      status: "completed",
      processedBy: user!.email || user!.userId,
      notes: notes || "Disbursed via cash at office/yard",
      paidAt: now,
      createdAt: now,
    };

    await db.collection("payments").insertOne(paymentRecord);

    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          paymentStatus: "paid",
          paymentReference: receiptNumber.trim().toUpperCase(),
          status: "PAID",
          updatedAt: now,
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "PAYMENT_CASH_DISBURSED",
      entityType: "PAYMENT",
      entityId: id,
      details: {
        paymentNo,
        receiptNumber: receiptNumber.trim().toUpperCase(),
        amount: finalAmount,
        supplierName,
      },
    });

    return apiSuccess({
      message: "Cash payment recorded successfully.",
      paymentNo,
      receiptNumber: receiptNumber.trim().toUpperCase(),
      amount: formatCurrency(finalAmount),
      status: "PAID",
      paidAt: now.toISOString(),
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to record cash payment", 500);
  }
}
