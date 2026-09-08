import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
} from "@/lib/api-auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/suppliers/:id
 * Fetches supplier profile with strict ownership isolation (Section 81)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["supplier", "field_officer", "admin", "super_admin", "operations", "accounts"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;

    // Strict ownership isolation (Section 81): A supplier cannot view another supplier's data
    if (user!.role === "supplier" && user!.userId !== id) {
      return apiError("FORBIDDEN", "You do not have permission to access another supplier's data.", 403);
    }

    const db = await getDatabase();

    let supObjId: ObjectId;
    try {
      supObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Supplier identifier is not valid.", 422, "id");
    }

    const supplier = await db.collection("users").findOne({ _id: supObjId });
    if (!supplier || supplier.role !== "supplier") {
      return apiError("SUPPLIER_NOT_FOUND", "Supplier not found.", 404, "id");
    }

    return apiSuccess({
      id: supplier._id.toString(),
      code: supplier.supplierCode || `RW-${supplier._id.toString().slice(-4).toUpperCase()}`,
      name: supplier.businessName || `${supplier.firstName} ${supplier.lastName}`.trim(),
      phone: supplier.phoneNumber || "",
      county: supplier.county || "",
      subCounty: supplier.subCounty || "",
      supplierType: supplier.supplierType || "Aggregator",
      status: supplier.status || "active",
      createdAt: supplier.createdAt,
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch supplier", 500);
  }
}
