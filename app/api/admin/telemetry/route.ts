import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const db = await getDatabase();

    // 1. Find all vehicles currently on the move
    const activeVehicles = await db
      .collection("vehicles")
      .find({ status: "In Transit" })
      .toArray();

    const updates = activeVehicles.map((vehicle) => {
      // 2. Logic: Increment progress by 1-5% per "tick"
      const newProgress = Math.min(
        (vehicle.progress || 0) + Math.floor(Math.random() * 5) + 1,
        100,
      );

      // 3. Logic: Recalculate ETA based on remaining progress
      // (Simplified: 1% progress approx = 10 mins of driving)
      const remainingMins = (100 - newProgress) * 10;
      const newEta =
        newProgress === 100
          ? "Arrived"
          : `${Math.floor(remainingMins / 60)}h ${remainingMins % 60}m`;

      return db.collection("vehicles").updateOne(
        { _id: vehicle._id },
        {
          $set: {
            progress: newProgress,
            eta: newEta,
            lastUpdated: new Date(),
          },
        },
      );
    });

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      unitsUpdated: activeVehicles.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Telemetry drift failed" },
      { status: 500 },
    );
  }
}
