import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDatabase();

    // 1. Calculate Aggregate Volume
    const inventory = await db.collection("inventory").find({}).toArray();
    const totalWeight = inventory.reduce((acc, item) => {
      return acc + parseFloat(item.weight.replace(/[^\d.-]/g, ""));
    }, 0);

    // 2. Count Active Hauls (Items with an assigned driver)
    const activeHauls = await db.collection("inventory").countDocuments({
      driver: { $ne: "" },
    });

    return NextResponse.json({
      aggregateVolume: `${totalWeight.toFixed(1)}t`,
      activeHauls: activeHauls.toString().padStart(2, "0"),
      qualityRating: "98.2%", // Mocked or calculated from a 'quality' collection
      nodeLatency: "14ms",
    });
  } catch (error) {
    return NextResponse.json({ error: "Stats sync failed" }, { status: 500 });
  }
}
