import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDatabase();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // 1. All loads query
    const allLoads = await db.collection("inventory").find({}).toArray();

    // Monthly weight (tonnes)
    const monthlyLoads = allLoads.filter((l) => {
      const d = l.createdAt ? new Date(l.createdAt) : l.timestamp ? new Date(l.timestamp) : null;
      return d && d >= startOfMonth;
    });
    const monthlyWeightKg = monthlyLoads.reduce(
      (sum, l) => sum + (Number(l.verifiedWeightKg || l.normalizedWeightKg || l.quantity) || 0),
      0
    );
    const monthlyWeightTonnes = Math.round((monthlyWeightKg / 1000) * 10) / 10;

    // Total recycled weight and weekly weight for Carbon metrics (EPA factor: 1.82 kg CO2e / kg plastic)
    const totalWeightKg = allLoads.reduce(
      (sum, l) => sum + (Number(l.verifiedWeightKg || l.normalizedWeightKg || l.quantity) || 0),
      0
    );
    const weeklyLoads = allLoads.filter((l) => {
      const d = l.createdAt ? new Date(l.createdAt) : l.timestamp ? new Date(l.timestamp) : null;
      return d && d >= sevenDaysAgo;
    });
    const weeklyWeightKg = weeklyLoads.reduce(
      (sum, l) => sum + (Number(l.verifiedWeightKg || l.normalizedWeightKg || l.quantity) || 0),
      0
    );

    const totalCarbonSavingsTonnes = Math.round((totalWeightKg * 1.82 / 1000) * 10) / 10;
    const weeklyCarbonSavingsTonnes = Math.round((weeklyWeightKg * 1.82 / 1000) * 10) / 10;

    // 2. Active Hubs
    const hubs = await db.collection("hubs").find({}).toArray();
    const activeCentersCount = hubs.length;

    // 3. Active Cooperative Members / Suppliers
    const suppliersCount = await db.collection("users").countDocuments({ role: "supplier" });

    // 4. Logistics: Active Trucks & Shifts
    const activeShifts = await db.collection("driver_shifts").find({ status: "active" }).toArray();
    const emptyTrucksCount = activeShifts.filter((s) => s.emptyReturn).length;

    // 5. Materials Collection Ledger (Recent 5)
    const recentLoads = await db
      .collection("inventory")
      .find({})
      .sort({ createdAt: -1, timestamp: -1 })
      .limit(5)
      .toArray();

    const materialsLedger = recentLoads.map((l) => ({
      hub: l.hubName || "Nairobi Core Hub",
      mat: l.material || l.name || "Mixed Recyclables",
      qty: Number(l.normalizedWeightKg || l.quantity || 0),
      status: l.status === "VERIFIED" || l.status === "verified" ? "Verified" : (l.status || "In Transit").toUpperCase(),
    }));

    // 6. Regional Storage from Hubs
    const regionalStorage = hubs.map((h) => ({
      name: h.name,
      cap: Math.min(Math.round(((h.load || 0) / (h.capacityTonnes || 100)) * 100), 100),
    }));

    const TARGET_CAPACITY = 100; // Target tons
    const STARTING_BASELINE = 15;

    const responsePayload = {
      data: {
        monthlyWeight: monthlyWeightTonnes || Math.round((totalWeightKg / 1000) * 10) / 10 || 0,
        targetCapacity: TARGET_CAPACITY,
        activeCenters: activeCentersCount,
        carbonSavings: totalCarbonSavingsTonnes || 0,
        carbonSavedThisWeek: weeklyCarbonSavingsTonnes || 0,
        activeMembers: suppliersCount,
        ecoNetworks: Math.max(hubs.length, 1),
        startingBaseline: STARTING_BASELINE,
        emptyTrucks: emptyTrucksCount,
        materialsLedger,
        regionalStorage: regionalStorage.length > 0 ? regionalStorage : [{ name: "Nairobi Core Hub", cap: 45 }],
      },
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    console.error("[Dashboard Operations API Error]:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal Server Error",
        data: {
          monthlyWeight: 0,
          targetCapacity: 100,
          activeCenters: 0,
          carbonSavings: 0,
          carbonSavedThisWeek: 0,
          activeMembers: 0,
          ecoNetworks: 0,
          startingBaseline: 0,
          emptyTrucks: 0,
          materialsLedger: [],
          regionalStorage: [],
        },
      },
      { status: 500 }
    );
  }
}