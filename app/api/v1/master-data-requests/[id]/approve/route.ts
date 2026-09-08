import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { toCurrency } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/master-data-requests/:id/approve
 * Admin/Super Admin approves request, creating the material/grade and configuring pricing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { benchmarkPriceKes, adminNotes, group } = body;

    const db = await getDatabase();

    let reqObjId: ObjectId;
    try {
      reqObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Request identifier is not valid.", 422, "id");
    }

    const reqDoc = await db.collection("material_requests").findOne({ _id: reqObjId });
    if (!reqDoc) {
      return apiError("REQUEST_NOT_FOUND", "Master data request not found.", 404, "id");
    }

    // If type is MATERIAL, ensure it exists in feedstockCategories
    if (reqDoc.type === "MATERIAL") {
      const existing = await db.collection("feedstockCategories").findOne({
        name: { $regex: new RegExp(`^${reqDoc.materialName.trim()}$`, "i") },
      });

      if (!existing) {
        await db.collection("feedstockCategories").insertOne({
          name: reqDoc.materialName.trim(),
          group: group || "Polymers & Synthetics",
          grades: ["Standard Grade"],
          totalWeight: "0 kg",
          activeOrders: 0,
          status: "Stable",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } else if (reqDoc.type === "GRADE" && reqDoc.gradeName) {
      // Append grade to material
      await db.collection("feedstockCategories").updateOne(
        { name: { $regex: new RegExp(`^${reqDoc.materialName.trim()}$`, "i") } },
        { $addToSet: { grades: reqDoc.gradeName.trim() }, $set: { updatedAt: new Date() } }
      );
    }

    // Set pricing if benchmarkPriceKes is provided
    if (benchmarkPriceKes !== undefined && benchmarkPriceKes !== null) {
      const price = toCurrency(benchmarkPriceKes);
      const grade = reqDoc.gradeName || "Standard Grade";

      await db.collection("feedstock_pricing").updateOne(
        {
          material: { $regex: new RegExp(`^${reqDoc.materialName.trim()}$`, "i") },
          grade: { $regex: new RegExp(`^${grade.trim()}$`, "i") },
        },
        {
          $set: {
            material: reqDoc.materialName.trim(),
            grade: grade.trim(),
            unit: "KG",
            basePricePerKg: price,
            isActive: true,
            effectiveFrom: new Date(),
            updatedBy: user!.userId,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    // Update request status to APPROVED
    await db.collection("material_requests").updateOne(
      { _id: reqObjId },
      {
        $set: {
          status: "APPROVED",
          reviewedBy: user!.email || user!.userId,
          reviewedAt: new Date(),
          adminNotes: adminNotes || "Approved by Administrator",
          updatedAt: new Date(),
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "MASTER_DATA_REQUEST_APPROVED",
      entityType: "MASTER_DATA_REQUEST",
      entityId: id,
      after: { status: "APPROVED", benchmarkPriceKes },
    });

    return apiSuccess({
      id,
      status: "APPROVED",
      message: "Master data request approved and catalog updated successfully.",
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to approve request", 500);
  }
}
