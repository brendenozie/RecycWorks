import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET() {
  try {

    const db = await getDatabase();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

//     // Calculate 7 days ago for weekly carbon metrics
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(now.getDate() - 7);

//     // --- 1. Monthly Recycling Weight & Baseline ---
//     const weightStats = await db.weightRecord.aggregate({
//       _sum: {
//         weight: true,
//       },
//       where: {
//         createdAt: {
//           gte: startOfMonth,
//         },
//       },
//     });

//     // --- 2. Active Collection Centers Count ---
//     const activeCentersCount = await db.collectionCenter.count({
//       where: {
//         status: "ACTIVE",
//       },
//     });

//     // --- 3. Carbon Savings Aggregations ---
//     const carbonStats = await db.carbonRecord.aggregate({
//       _sum: {
//         co2Offset: true,
//       },
//     });

//     const carbonStatsThisWeek = await db.carbonRecord.aggregate({
//       _sum: {
//         co2Offset: true,
//       },
//       where: {
//         createdAt: {
//           gte: sevenDaysAgo,
//         },
//       },
//     });

//     // --- 4. Active Cooperative Members ---
//     const activeMembersCount = await db.cooperativeMember.count({
//       where: {
//         status: "ACTIVE",
//       },
//     });

//     // --- 5. Empty Return-Leg Trucks Count ---
//     const emptyTrucksCount = await db.truckRoute.count({
//       where: {
//         status: "EMPTY_RETURN",
//       },
//     });

//     // --- 6. Materials Collection Ledger (Limit 5) ---
//     const rawLedger = await db.collectionLedger.findMany({
//       take: 5,
//       orderBy: {
//         createdAt: "desc",
//       },
//       select: {
//         hubName: true,
//         materialType: true,
//         quantity: true,
//         verificationStatus: true,
//       },
//     });

//     const materialsLedger = rawLedger.map((item) => ({
//       hub: item.hubName || "Unknown Hub",
//       mat: item.materialType || "Mixed Recyclables",
//       qty: item.quantity ?? 0,
//       status:
//         item.verificationStatus === "VERIFIED" ? "Verified" : "In Transit",
//     }));

//     // --- 7. Regional Storage Capacities ---
//     const storageFacilities = await db.storageFacility.findMany({
//       select: {
//         name: true,
//         capacityUsedPercentage: true,
//       },
//     });

//     const regionalStorage = storageFacilities.map((facility) => ({
//       name: facility.name,
//       cap: facility.capacityUsedPercentage ?? 0,
//     }));

//     // --- Static Target / Configuration Defaults ---
//     // You can also pull these limits directly from a "TenantSettings" or "GlobalConfig" table
//     const TARGET_CAPACITY = 100; // Target tons
//     const STARTING_BASELINE = 15; // Baseline tons
//     const ECO_NETWORKS_COUNT = 16; // Static or query count

//     // --- 8. Build Safe Payload with Strict '0' Fallbacks ---
//     const responsePayload = {
//       data: {
//         monthlyWeight: weightStats._sum.weight ?? 0,
//         targetCapacity: TARGET_CAPACITY,
//         activeCenters: activeCentersCount ?? 0,
//         carbonSavings: carbonStats._sum.co2Offset ?? 0,
//         carbonSavedThisWeek: carbonStatsThisWeek._sum.co2Offset ?? 0,
//         activeMembers: activeMembersCount ?? 0,
//         ecoNetworks: ECO_NETWORKS_COUNT,
//         startingBaseline: STARTING_BASELINE,
//         emptyTrucks: emptyTrucksCount ?? 0,
//         materialsLedger: materialsLedger,
//         regionalStorage: regionalStorage,
//       },
//     };

//     return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("Dashboard API Error:", error);

    // Safety Fallback Response: Return structurally valid empty data if db queries throw errors
    return NextResponse.json(
      {
        error: "Internal Server Error",
        data: {
          monthlyWeight: 0,
          targetCapacity: 0,
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
      { status: 500 },
    );
  }
}