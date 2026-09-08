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
 * GET /api/v1/inventory/summary
 * Aggregates current physical stock across all stages (RAW, SORTED, PROCESSED, FINISHED)
 * and groups by material and hub.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "hub-manager"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hubId");

    const match: any = { status: { $ne: "DEPLETED" } };
    if (hubId) {
      if (ObjectId.isValid(hubId)) {
        match.$or = [{ hubId }, { hubId: new ObjectId(hubId) }];
      } else {
        match.hubId = hubId;
      }
    }

    const db = await getDatabase();

    const lots = await db.collection("inventory_lots").find(match).toArray();

    const byStage: Record<string, { totalKg: number; availableKg: number; reservedKg: number; count: number }> = {
      RAW: { totalKg: 0, availableKg: 0, reservedKg: 0, count: 0 },
      SORTED: { totalKg: 0, availableKg: 0, reservedKg: 0, count: 0 },
      PROCESSED: { totalKg: 0, availableKg: 0, reservedKg: 0, count: 0 },
      FINISHED: { totalKg: 0, availableKg: 0, reservedKg: 0, count: 0 },
    };

    const byMaterial: Record<string, { totalKg: number; availableKg: number; grades: Record<string, number> }> = {};

    for (const lot of lots) {
      const stage = (lot.stage || "RAW").toUpperCase();
      if (!byStage[stage]) {
        byStage[stage] = { totalKg: 0, availableKg: 0, reservedKg: 0, count: 0 };
      }
      byStage[stage].totalKg += lot.quantityKg || 0;
      byStage[stage].availableKg += lot.availableQuantityKg || 0;
      byStage[stage].reservedKg += lot.reservedQuantityKg || 0;
      byStage[stage].count += 1;

      const mat = lot.material || "Unknown Material";
      const grd = lot.grade || "Standard";
      if (!byMaterial[mat]) {
        byMaterial[mat] = { totalKg: 0, availableKg: 0, grades: {} };
      }
      byMaterial[mat].totalKg += lot.quantityKg || 0;
      byMaterial[mat].availableKg += lot.availableQuantityKg || 0;
      byMaterial[mat].grades[grd] = (byMaterial[mat].grades[grd] || 0) + (lot.availableQuantityKg || 0);
    }

    // Round values
    Object.keys(byStage).forEach((k) => {
      byStage[k].totalKg = Math.round(byStage[k].totalKg * 100) / 100;
      byStage[k].availableKg = Math.round(byStage[k].availableKg * 100) / 100;
      byStage[k].reservedKg = Math.round(byStage[k].reservedKg * 100) / 100;
    });

    Object.keys(byMaterial).forEach((k) => {
      byMaterial[k].totalKg = Math.round(byMaterial[k].totalKg * 100) / 100;
      byMaterial[k].availableKg = Math.round(byMaterial[k].availableKg * 100) / 100;
      Object.keys(byMaterial[k].grades).forEach((g) => {
        byMaterial[k].grades[g] = Math.round(byMaterial[k].grades[g] * 100) / 100;
      });
    });

    const totalStockKg = Math.round(
      Object.values(byStage).reduce((acc, curr) => acc + curr.totalKg, 0) * 100
    ) / 100;

    return apiSuccess({
      totalStockKg,
      byStage,
      byMaterial,
      lotCount: lots.length,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to aggregate inventory summary", 500);
  }
}
