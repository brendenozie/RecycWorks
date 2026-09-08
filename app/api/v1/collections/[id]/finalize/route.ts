import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { getApplicablePricePerKg } from "@/lib/pricing";
import { formatWeight, formatCurrency, calculateItemValue, sumCurrency, sumWeights } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/collections/:id/finalize
 * Authoritative server-side finalization of a collection
 * Evaluates pricing, snapshots rates, locks totals, and advances status to READY_FOR_COLLECTION
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.confirmed !== true) {
      return apiError(
        "CONFIRMATION_REQUIRED",
        "Finalization requires explicit confirmation { confirmed: true }.",
        422,
        "confirmed"
      );
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

    const currentStatus = (col.status || "").toUpperCase();
    if (currentStatus !== "CAPTURING" && currentStatus !== "DRAFT") {
      return apiError(
        "COLLECTION_NOT_FINALIZABLE",
        `Collection in status '${currentStatus}' cannot be finalized.`,
        409
      );
    }

    const items: any[] = Array.isArray(col.items) ? col.items : [];
    if (items.length === 0) {
      return apiError(
        "EMPTY_COLLECTION",
        "Cannot finalize a collection without at least one material stream group.",
        422,
        "items"
      );
    }

    // Verify every group has at least one sack weight
    for (let i = 0; i < items.length; i++) {
      const g = items[i];
      const sackCount = Number(g.sackCount || (Array.isArray(g.sacks) ? g.sacks.length : 0));
      if (sackCount === 0 || (g.totalWeightKg || 0) <= 0) {
        return apiError(
          "EMPTY_GROUP",
          `Stream group '${g.material} / ${g.grade}' contains no weighed sacks. Add weights before finalization.`,
          422,
          `items[${i}]`
        );
      }
    }

    // Authoritative Server-side Price Snapshot & Valuation
    const finalizedGroups = items.map((g) => {
      const groupWeight = sumWeights(g.sacks || []);
      const unitPrice = getApplicablePricePerKg(g.material, g.grade);
      const calculatedValue = calculateItemValue(groupWeight, unitPrice);

      return {
        ...g,
        totalWeightKg: groupWeight,
        sackCount: (g.sacks || []).length,
        unitPricePerKg: unitPrice,
        unitPriceSnapshot: unitPrice,
        estimatedValueKes: calculatedValue,
        calculatedValue,
        finalizedAt: new Date(),
      };
    });

    const grandTotalWeight = sumWeights(finalizedGroups.map((g) => g.totalWeightKg));
    const grandTotalSacks = finalizedGroups.reduce((acc, g) => acc + g.sackCount, 0);
    const grandTotalValue = sumCurrency(finalizedGroups.map((g) => g.calculatedValue));

    // Calculate primary material & grade for root document backward compatibility
    const primaryGroup = finalizedGroups[0];
    const materialSummary =
      finalizedGroups.length === 1
        ? primaryGroup.material
        : Array.from(new Set(finalizedGroups.map((g) => g.material))).join(", ");
    const gradeSummary =
      finalizedGroups.length === 1 ? primaryGroup.grade : "Multi-Stream";

    const updatePayload = {
      status: "READY_FOR_COLLECTION",
      material: materialSummary,
      grade: gradeSummary,
      quantity: grandTotalWeight,
      normalizedWeightKg: grandTotalWeight,
      totalSacks: grandTotalSacks,
      unitPricePerKg: finalizedGroups.length === 1 ? primaryGroup.unitPricePerKg : 0,
      grossValueKes: grandTotalValue,
      netValueKes: grandTotalValue,
      items: finalizedGroups,
      finalizedAt: new Date(),
      finalizedByUserId: user!.userId,
      updatedAt: new Date(),
    };

    await db.collection("inventory").updateOne({ _id: colObjId }, { $set: updatePayload });

    // Audit Log
    await logAuditEvent({
      actorUserId: user!.userId,
      action: "COLLECTION_FINALIZED",
      entityType: "COLLECTION",
      entityId: id,
      after: {
        status: "READY_FOR_COLLECTION",
        totalSacks: grandTotalSacks,
        totalWeightKg: grandTotalWeight,
        grossValueKes: grandTotalValue,
        groupCount: finalizedGroups.length,
      },
    });

    const isInternal = ["admin", "super_admin", "accounts", "operations"].includes(user!.role);

    const responseDto = {
      id: col._id.toString(),
      loadNumber: col.loadNumber,
      status: "READY_FOR_COLLECTION",
      groups: finalizedGroups.map((g) => ({
        material: g.material,
        grade: g.grade,
        sackCount: g.sackCount,
        totalWeightKg: formatWeight(g.totalWeightKg),
        unitPrice: isInternal ? formatCurrency(g.unitPricePerKg) : undefined,
        value: isInternal ? formatCurrency(g.calculatedValue) : undefined,
      })),
      totalSackCount: grandTotalSacks,
      totalWeightKg: formatWeight(grandTotalWeight),
      totalValue: isInternal ? formatCurrency(grandTotalValue) : undefined,
      finalizedAt: updatePayload.finalizedAt,
    };

    return apiSuccess(responseDto);
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to finalize collection", 500);
  }
}
