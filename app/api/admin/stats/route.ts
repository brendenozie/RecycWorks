import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDatabase();

    const statsArray = await db
      .collection("batches")
      .aggregate([
        {
          $facet: {
            // Total Tonnage toward 100T Goal
            tonnageProgress: [
              { $group: { _id: null, total: { $sum: "$weight" } } },
            ],
            // Active Hubs count
            activeHubs: [
              { $match: { status: "Verified" } },
              { $group: { _id: "$hubId", count: { $sum: 1 } } },
              { $count: "total" },
            ],
            // Breakdown by 16-product streams
            materialBreakdown: [
              { $group: { _id: "$materialType", weight: { $sum: "$weight" } } },
            ],
          },
        },
      ])
      .toArray();

    const stats = {
      currentTonnage: (statsArray[0].tonnageProgress[0]?.total || 0) / 1000, // Convert kg to Tons
      hubCount: statsArray[0].activeHubs[0]?.total || 0,
      breakdown: statsArray[0].materialBreakdown,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
