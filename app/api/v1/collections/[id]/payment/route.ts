import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
} from "@/lib/api-auth";
import { formatWeight, formatCurrency } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/collections/:id/payment
 * Returns authoritative payable details, status, and payment history for a collection.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, [
      "admin",
      "super_admin",
      "accounts",
      "finance",
      "operations",
      "supplier",
    ]);
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

    // Supplier isolation check
    if (user!.role === "supplier" && col.supplierId !== user!.userId) {
      return apiError("FORBIDDEN", "You do not have access to this payment.", 403);
    }

    // Look up supplier details
    let supplierPhone = col.supplierPhone || "";
    if (!supplierPhone && col.supplierId) {
      try {
        const suppUser = await db.collection("users").findOne({ _id: new ObjectId(col.supplierId) });
        if (suppUser) {
          supplierPhone = suppUser.phone || suppUser.phoneNumber || "";
        }
      } catch {}
    }

    // Look up associated payments in payments collection
    const payments = await db
      .collection("payments")
      .find({
        $or: [
          { loadId: colObjId },
          { loadId: id },
        ],
      })
      .toArray();

    const paymentDetails = payments.map((p) => ({
      id: p._id.toString(),
      paymentNo: p.paymentNo,
      amount: formatCurrency(p.amount),
      method: p.method,
      provider: p.provider || p.method,
      paymentReference: p.paymentReference,
      status: p.status,
      paidAt: p.paidAt || p.createdAt,
    }));

    return apiSuccess({
      collectionId: id,
      loadNumber: col.loadNumber || `RWL-${id.slice(-6).toUpperCase()}`,
      status: (col.status || "CAPTURED").toUpperCase(),
      paymentStatus: (col.paymentStatus || "pending").toLowerCase(),
      paymentReference: col.paymentReference || null,
      supplier: {
        id: col.supplierId ? col.supplierId.toString() : "",
        name: col.supplierName || "Supplier",
        code: col.supplierCode || "",
        phone: supplierPhone,
      },
      material: col.material || "Recyclables",
      grade: col.grade || "Standard",
      weightKg: formatWeight(col.verifiedWeightKg || col.normalizedWeightKg || col.quantity || 0),
      isVerifiedWeight: !!col.verifiedWeightKg,
      unitPricePerKg: formatCurrency(col.unitPricePerKg || 0),
      grossValueKes: formatCurrency(col.grossValueKes || 0),
      adjustmentKes: formatCurrency(col.adjustmentKes || 0),
      netPayableKes: formatCurrency(col.netValueKes || col.grossValueKes || 0),
      payments: paymentDetails,
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch payment details", 500);
  }
}
