import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { toWeight, toCurrency, formatWeight, formatCurrency } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/collections/:id/complete
 * Operations hub verification and collection lifecycle completion
 * Records verified scale weight & discrepancy without modifying original field capture
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
    const rawScaleWeight = body.scaleWeightKg !== undefined ? body.scaleWeightKg : body.verifiedWeightKg;

    if (rawScaleWeight === undefined || rawScaleWeight === null) {
      return apiError("VALIDATION_ERROR", "Scale reading (scaleWeightKg) is required.", 422, "scaleWeightKg");
    }

    const verifiedWeight = toWeight(rawScaleWeight);
    if (verifiedWeight <= 0) {
      return apiError("INVALID_WEIGHT", "Verified scale weight must be greater than zero.", 422, "scaleWeightKg");
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

    const capturedWeight = toWeight(col.normalizedWeightKg || col.quantity || 0);
    const discrepancyKg = toWeight(verifiedWeight - capturedWeight);

    // Calculate valuation adjustment if any
    const avgPricePerKg = capturedWeight > 0 ? (col.grossValueKes || 0) / capturedWeight : 0;
    const adjustmentKes = toCurrency(discrepancyKg * avgPricePerKg);
    const netValueKes = toCurrency((col.grossValueKes || 0) + adjustmentKes);

    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          status: "VERIFIED",
          verifiedWeightKg: verifiedWeight,
          discrepancyKg,
          adjustmentKes,
          netValueKes,
          verifiedBy: user!.email || user!.userId,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "COLLECTION_VERIFIED_AND_COMPLETED",
      entityType: "COLLECTION",
      entityId: id,
      after: {
        capturedWeightKg: capturedWeight,
        verifiedWeightKg: verifiedWeight,
        discrepancyKg,
        adjustmentKes,
        netValueKes,
        status: "VERIFIED",
      },
    });

    return apiSuccess({
      id,
      status: "VERIFIED",
      capturedWeightKg: formatWeight(capturedWeight),
      verifiedWeightKg: formatWeight(verifiedWeight),
      discrepancyKg: formatWeight(discrepancyKg),
      grossValueKes: formatCurrency(col.grossValueKes || 0),
      adjustmentKes: formatCurrency(adjustmentKes),
      netValueKes: formatCurrency(netValueKes),
      verifiedBy: user!.email,
      verifiedAt: new Date(),
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to complete collection", 500);
  }
}
