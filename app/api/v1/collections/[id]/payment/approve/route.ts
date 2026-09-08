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
 * POST /api/v1/collections/:id/payment/approve
 * Approves a collection's payable value for supplier disbursement.
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
      return apiError("ALREADY_PAID", "Collection has already been paid.", 400);
    }

    const now = new Date();
    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          paymentStatus: "approved",
          approvedBy: user!.userId,
          approvedAt: now,
          updatedAt: now,
        },
      }
    );

    const payableAmount = formatCurrency(col.netValueKes || col.grossValueKes || 0);

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "PAYMENT_APPROVED",
      entityType: "COLLECTION",
      entityId: id,
      details: {
        supplierId: col.supplierId?.toString(),
        payableAmount,
        approvedBy: user!.email,
      },
    });

    return apiSuccess({
      message: "Supplier payment approved successfully.",
      collectionId: id,
      payableAmount,
      paymentStatus: "approved",
      approvedAt: now.toISOString(),
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to approve payment", 500);
  }
}
