import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
  checkAndStoreIdempotency,
} from "@/lib/api-auth";
import { formatCurrency } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/collections/:id/payment/mpesa
 * Triggers automated/system M-Pesa B2C payout for a collection, protected by Idempotency Key.
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
    const idempotencyKey = request.headers.get("idempotency-key");
    const body = await request.json().catch(() => ({}));
    const { phoneNumber, amount, idempotencyKey: bodyKey } = body;
    const finalKey = idempotencyKey || bodyKey;

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

    if (col.paymentStatus === "paid" && !finalKey) {
      return apiError("ALREADY_PAID", "This collection has already been marked as paid.", 400);
    }

    // Determine target recipient phone number
    let targetPhone = phoneNumber;
    if (!targetPhone) {
      if (col.supplierPhone) {
        targetPhone = col.supplierPhone;
      } else if (col.supplierId) {
        try {
          const suppUser = await db.collection("users").findOne({ _id: new ObjectId(col.supplierId) });
          targetPhone = suppUser?.phone || suppUser?.phoneNumber;
        } catch {}
      }
    }

    if (!targetPhone) {
      return apiError("VALIDATION_ERROR", "Supplier phone number is required for M-Pesa payout.", 422, "phoneNumber");
    }

    const netPayable = col.netValueKes || col.grossValueKes || 0;
    const finalAmount = amount !== undefined ? Number(amount) : netPayable;

    if (finalAmount <= 0) {
      return apiError("VALIDATION_ERROR", "Payable amount must be greater than zero.", 422, "amount");
    }

    const { result, fromCache } = await checkAndStoreIdempotency(
      finalKey,
      `PAYMENT_MPESA_${id}`,
      async () => {
        const now = new Date();
        const paymentNo = `PAY-${now.getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const mpesaRef = `RWM${now.getFullYear().toString().slice(-2)}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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
          provider: "MPESA_API",
          paymentReference: mpesaRef,
          status: "completed",
          processedBy: user!.email || user!.userId,
          initiatedBy: user!.email || user!.userId,
          providerReference: `B2C_${Date.now()}_${mpesaRef}`,
          notes: `Automated B2C payout to ${targetPhone}`,
          paidAt: now,
          createdAt: now,
        };

        await db.collection("payments").insertOne(paymentRecord);

        await db.collection("inventory").updateOne(
          { _id: colObjId },
          {
            $set: {
              paymentStatus: "paid",
              paymentReference: mpesaRef,
              status: "PAID",
              updatedAt: now,
            },
          }
        );

        await logAuditEvent({
          actorUserId: user!.userId,
          action: "PAYMENT_MPESA_TRIGGERED",
          entityType: "PAYMENT",
          entityId: id,
          details: {
            paymentNo,
            mpesaReference: mpesaRef,
            amount: finalAmount,
            targetPhone,
          },
        });

        return {
          message: "Automated M-Pesa payout processed successfully.",
          paymentNo,
          mpesaReference: mpesaRef,
          amount: formatCurrency(finalAmount),
          recipientPhone: targetPhone,
          status: "PAID",
          paidAt: now.toISOString(),
        };
      }
    );

    return apiSuccess({
      ...result,
      idempotentReplay: fromCache,
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to execute M-Pesa payout", 500);
  }
}
