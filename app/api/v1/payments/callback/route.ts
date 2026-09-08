import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { logAuditEvent, checkAndStoreIdempotency } from "@/lib/api-auth";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/payments/callback
 * Asynchronous M-Pesa Daraja B2C Callback / Webhook Handler.
 * Authenticated, Idempotent, Retry-Safe, Auditable.
 * Supports standard Safaricom B2C Result payload and direct webhook notification.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const db = await getDatabase();

    // 1. Extract Result metadata from standard Daraja B2C structure or direct body
    let resultCode = 0;
    let resultDesc = "Success";
    let originatorConversationId = "";
    let conversationId = "";
    let transactionReceipt = "";
    let transactionAmount = 0;
    let providerReference = "";

    if (rawBody.Result) {
      const res = rawBody.Result;
      resultCode = Number(res.ResultCode ?? 0);
      resultDesc = String(res.ResultDesc || "");
      originatorConversationId = res.OriginatorConversationID || "";
      conversationId = res.ConversationID || "";
      transactionReceipt = res.TransactionID || "";

      if (res.ResultParameters?.ResultParameter) {
        const params = res.ResultParameters.ResultParameter;
        for (const p of params) {
          if (p.Key === "TransactionAmount") transactionAmount = Number(p.Value || 0);
          if (p.Key === "TransactionReceipt") transactionReceipt = String(p.Value || transactionReceipt);
        }
      }
      providerReference = originatorConversationId || conversationId || transactionReceipt;
    } else {
      // Direct notification / simulated webhook payload
      resultCode = Number(rawBody.resultCode ?? rawBody.ResultCode ?? 0);
      resultDesc = String(rawBody.resultDesc || rawBody.ResultDesc || "Completed");
      transactionReceipt = String(rawBody.transactionReceipt || rawBody.paymentReference || rawBody.mpesaReference || "");
      originatorConversationId = String(rawBody.originatorConversationId || rawBody.providerReference || "");
      conversationId = String(rawBody.conversationId || "");
      transactionAmount = Number(rawBody.amount || 0);
      providerReference = originatorConversationId || conversationId || rawBody.paymentNo || transactionReceipt;
    }

    // Identify idempotency key from header or extracted references
    const headerKey = request.headers.get("idempotency-key");
    const idempotencyKey = headerKey || `CALLBACK_${providerReference || transactionReceipt || Date.now()}`;

    const { result, fromCache } = await checkAndStoreIdempotency(
      idempotencyKey,
      "MPESA_B2C_CALLBACK",
      async () => {
        const now = new Date();

        // 2. Locate payment record by providerReference, paymentNo, paymentReference, or conversation ID
        const query: Record<string, any>[] = [];
        if (providerReference) query.push({ providerReference });
        if (originatorConversationId) query.push({ providerReference: { $regex: originatorConversationId, $options: "i" } });
        if (conversationId) query.push({ providerReference: { $regex: conversationId, $options: "i" } });
        if (transactionReceipt) query.push({ paymentReference: transactionReceipt });
        if (rawBody.paymentNo) query.push({ paymentNo: rawBody.paymentNo });
        if (rawBody.loadId && ObjectId.isValid(rawBody.loadId)) query.push({ loadId: new ObjectId(rawBody.loadId) });

        let paymentRecord = null;
        if (query.length > 0) {
          paymentRecord = await db.collection("payments").findOne({ $or: query });
        }

        const isSuccess = resultCode === 0;

        if (paymentRecord) {
          // If already successfully completed and this is a duplicate callback
          if (paymentRecord.status === "completed" && isSuccess) {
            return {
              status: "ALREADY_COMPLETED",
              message: "Payment already confirmed and reconciled.",
              paymentNo: paymentRecord.paymentNo,
              paymentReference: paymentRecord.paymentReference,
            };
          }

          const updatedStatus = isSuccess ? "completed" : "failed";
          const finalReceipt = transactionReceipt || paymentRecord.paymentReference;

          // Update Payment document
          await db.collection("payments").updateOne(
            { _id: paymentRecord._id },
            {
              $set: {
                status: updatedStatus,
                paymentReference: finalReceipt,
                failureReason: isSuccess ? null : resultDesc,
                completedAt: isSuccess ? now : null,
                failedAt: isSuccess ? null : now,
                updatedAt: now,
                callbackReceivedAt: now,
                callbackPayload: rawBody,
              },
            }
          );

          // Update corresponding collection if loadId attached
          if (paymentRecord.loadId) {
            const loadObjId = typeof paymentRecord.loadId === "string" ? new ObjectId(paymentRecord.loadId) : paymentRecord.loadId;

            if (isSuccess) {
              await db.collection("inventory").updateOne(
                { _id: loadObjId },
                {
                  $set: {
                    paymentStatus: "paid",
                    paymentReference: finalReceipt,
                    status: "PAID",
                    updatedAt: now,
                  },
                }
              );
            } else {
              await db.collection("inventory").updateOne(
                { _id: loadObjId },
                {
                  $set: {
                    paymentStatus: "failed",
                    paymentFailureReason: resultDesc,
                    updatedAt: now,
                  },
                }
              );
            }
          }

          // Audit Log
          await logAuditEvent({
            actorUserId: "SYSTEM_MPESA_GATEWAY",
            action: isSuccess ? "PAYMENT_CALLBACK_SUCCESS" : "PAYMENT_CALLBACK_FAILED",
            entityType: "PAYMENT",
            entityId: paymentRecord._id.toString(),
            details: {
              paymentNo: paymentRecord.paymentNo,
              paymentReference: finalReceipt,
              resultCode,
              resultDesc,
              amount: transactionAmount || paymentRecord.amount,
            },
          });

          return {
            status: isSuccess ? "SUCCESS" : "FAILED",
            message: isSuccess ? "Payment confirmed successfully." : `Payment failed: ${resultDesc}`,
            paymentNo: paymentRecord.paymentNo,
            paymentReference: finalReceipt,
            loadId: paymentRecord.loadId?.toString(),
          };
        } else {
          // Unmatched callback recorded for audit inspection
          await db.collection("audit_logs").insertOne({
            action: "UNMATCHED_MPESA_CALLBACK",
            entityType: "PAYMENT",
            details: {
              rawBody,
              resultCode,
              resultDesc,
              transactionReceipt,
              providerReference,
            },
            timestamp: now,
          });

          return {
            status: "UNMATCHED",
            message: "Callback received and recorded for manual reconciliation.",
            transactionReceipt,
          };
        }
      }
    );

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback accepted",
      data: result,
      idempotentReplay: fromCache,
    });
  } catch (error: any) {
    console.error("[M-Pesa Callback Error]:", error);
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: error.message || "Failed to process callback" },
      { status: 500 }
    );
  }
}
