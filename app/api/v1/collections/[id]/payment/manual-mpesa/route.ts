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
 * POST /api/v1/collections/:id/payment/manual-mpesa
 * Settles supplier payment by recording a manual M-Pesa transaction reference code.
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
    const { mpesaReference, phoneNumber, amount, notes } = body;

    if (!mpesaReference || !mpesaReference.trim()) {
      return apiError("VALIDATION_ERROR", "M-Pesa transaction reference code is required.", 422, "mpesaReference");
    }

    const ref = mpesaReference.trim().toUpperCase();
    if (ref.length < 6) {
      return apiError("VALIDATION_ERROR", "M-Pesa reference code must be at least 6 characters (e.g. QAB8765XYZ).", 422, "mpesaReference");
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

    const supplierName = col.supplierName || "Supplier";
    const supplierId = col.supplierId ? new ObjectId(col.supplierId) : new ObjectId();

    const paymentRecord = {
      paymentNo,
      recipientId: supplierId,
      recipientName: supplierName,
      recipientType: "supplier",
      loadId: colObjId,
      amount: formatCurrency(finalAmount),
      method: "M-PESA",
      provider: "MPESA_MANUAL",
      paymentReference: ref,
      status: "completed",
      processedBy: user!.email || user!.userId,
      notes: notes ? `${notes} (Phone: ${phoneNumber || "N/A"})` : `Manual M-Pesa payment to ${phoneNumber || "supplier"}`,
      paidAt: now,
      createdAt: now,
    };

    await db.collection("payments").insertOne(paymentRecord);

    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          paymentStatus: "paid",
          paymentReference: ref,
          status: "PAID",
          updatedAt: now,
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "PAYMENT_MANUAL_MPESA_RECORDED",
      entityType: "PAYMENT",
      entityId: id,
      details: {
        paymentNo,
        mpesaReference: ref,
        amount: finalAmount,
        phoneNumber,
      },
    });

    return apiSuccess({
      message: "Manual M-Pesa payment recorded successfully.",
      paymentNo,
      mpesaReference: ref,
      amount: formatCurrency(finalAmount),
      status: "PAID",
      paidAt: now.toISOString(),
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to record manual M-Pesa payment", 500);
  }
}
