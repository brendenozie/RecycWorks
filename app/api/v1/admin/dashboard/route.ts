import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
} from "@/lib/api-auth";
import { formatWeight, formatCurrency } from "@/lib/decimal";

/**
 * GET /api/v1/admin/dashboard
 * Aggregates operational KPIs across collections, logistics, fleet, fuel, and supplier disbursements.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["admin", "super_admin", "operations", "accounts"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const db = await getDatabase();

    // Fetch all collections
    const collections = await db.collection("inventory").find({}).toArray();

    let totalWeightKg = 0;
    let totalSacks = 0;
    let pendingPayablesKes = 0;
    let approvedPayablesKes = 0;
    let paidPayablesKes = 0;

    const pipelineCounts: Record<string, number> = {
      captured: 0,
      assigned: 0,
      "in-transit": 0,
      collected: 0,
      delivered: 0,
      verified: 0,
      paid: 0,
      other: 0,
    };

    const materialMap: Record<string, { weightKg: number; valueKes: number; count: number }> = {};

    collections.forEach((col) => {
      const st = (col.status || "captured").toLowerCase();
      if (pipelineCounts[st] !== undefined) {
        pipelineCounts[st]++;
      } else {
        pipelineCounts.other++;
      }

      const colWeight = Number(col.verifiedWeightKg || col.normalizedWeightKg || col.quantity || 0);
      const colValue = Number(col.netValueKes || col.grossValueKes || 0);
      totalWeightKg += colWeight;

      // Calculate sacks
      let sacks = Number(col.totalSacks || 0);
      if (sacks === 0 && Array.isArray(col.items)) {
        sacks = col.items.reduce((acc, g) => acc + (Number(g.sackCount) || (Array.isArray(g.sacks) ? g.sacks.length : 0)), 0);
      }
      totalSacks += sacks;

      // Payables breakdown
      const payStatus = (col.paymentStatus || "pending").toLowerCase();
      if (payStatus === "paid") {
        paidPayablesKes += colValue;
      } else if (payStatus === "approved") {
        approvedPayablesKes += colValue;
      } else {
        pendingPayablesKes += colValue;
      }

      // Material stream breakdown
      const mat = (col.material || "Mixed").toUpperCase();
      if (!materialMap[mat]) {
        materialMap[mat] = { weightKg: 0, valueKes: 0, count: 0 };
      }
      materialMap[mat].weightKg += colWeight;
      materialMap[mat].valueKes += colValue;
      materialMap[mat].count += 1;
    });

    // Fetch driver shifts & fleet stats
    const shifts = await db.collection("driver_shifts").find({}).toArray();
    let totalDistanceKm = 0;
    let activeDriversCount = 0;
    let nightTravelCount = 0;

    shifts.forEach((s) => {
      totalDistanceKm += Number(s.distanceKm || 0);
      if (s.status === "active") activeDriversCount++;
      if (s.nightTravel) nightTravelCount++;
    });

    // Fetch fuel records
    const fuelRecords = await db.collection("fuel_records").find({}).toArray();
    let totalFuelLitres = 0;
    let totalFuelAmountKes = 0;

    fuelRecords.forEach((f) => {
      totalFuelLitres += Number(f.litres || 0);
      totalFuelAmountKes += Number(f.amountKes || 0);
    });

    // Active fleet vehicles
    const totalVehicles = await db.collection("vehicles").countDocuments({});
    const activeVehicles = await db.collection("vehicles").countDocuments({ status: { $ne: "Maintenance" } });

    const materialBreakdown = Object.entries(materialMap).map(([material, data]) => ({
      material,
      weightKg: formatWeight(data.weightKg),
      valueKes: formatCurrency(data.valueKes),
      collectionsCount: data.count,
    }));

    return apiSuccess({
      kpis: {
        totalCollections: collections.length,
        totalWeightKg: formatWeight(totalWeightKg),
        totalSacks,
        payables: {
          pendingKes: formatCurrency(pendingPayablesKes),
          approvedKes: formatCurrency(approvedPayablesKes),
          paidKes: formatCurrency(paidPayablesKes),
          totalPayableKes: formatCurrency(pendingPayablesKes + approvedPayablesKes + paidPayablesKes),
        },
        logistics: {
          activeDriversOnShift: activeDriversCount,
          activeFleet: activeVehicles,
          totalVehicles,
          totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
          nightTravelTrips: nightTravelCount,
          fuel: {
            totalLitres: Math.round(totalFuelLitres * 10) / 10,
            totalCostKes: formatCurrency(totalFuelAmountKes),
          },
        },
      },
      pipeline: {
        captured: pipelineCounts.captured,
        assigned: pipelineCounts.assigned,
        inTransit: pipelineCounts["in-transit"],
        collected: pipelineCounts.collected,
        delivered: pipelineCounts.delivered,
        verified: pipelineCounts.verified,
        paid: pipelineCounts.paid,
      },
      materials: materialBreakdown,
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to aggregate admin dashboard", 500);
  }
}
