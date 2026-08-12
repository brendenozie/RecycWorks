import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// --- PATCH: Driver checks into a checkpoint ---
export async function PATCH(request: Request) {
  try {
    const db = await getDatabase();
    const { routeId, checkpointIndex, locationData } = await request.json();

    if (!routeId || checkpointIndex === undefined) {
      return NextResponse.json(
        { error: "Missing Route ID or Checkpoint Index" },
        { status: 400 },
      );
    }

    // 1. Locate the route
    const route = await db
      .collection("active_routes")
      .findOne({ _id: new ObjectId(routeId) });
    if (!route)
      return NextResponse.json({ error: "Route not found" }, { status: 404 });

    // 2. Prepare the update for the specific checkpoint in the array
    const updatePath = `checkpoints.${checkpointIndex}`;

    const result = await db.collection("active_routes").updateOne(
      { _id: new ObjectId(routeId) },
      {
        $set: {
          [`${updatePath}.status`]: "Cleared",
          [`${updatePath}.clearedAt`]: new Date(),
          [`${updatePath}.lastKnownLocation`]: locationData, // GPS Lat/Long
          currentPosition: checkpointIndex, // Track overall progress
          updatedAt: new Date(),
        },
      },
    );

    // 3. Logic: If this was the last checkpoint, mark the whole Route as "Completed"
    if (checkpointIndex === route.checkpoints.length - 1) {
      await db
        .collection("active_routes")
        .updateOne(
          { _id: new ObjectId(routeId) },
          { $set: { status: "Delivered", completedAt: new Date() } },
        );

      // Also release the Inventory item from "In-Transit" to "Delivered"
      await db
        .collection("inventory")
        .updateOne(
          { _id: new ObjectId(route.manifestId) },
          { $set: { status: "In-Stock", location: route.destination.name } },
        );
    }

    return NextResponse.json({
      success: true,
      message: "Checkpoint synchronization complete.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Tracking sync failed" },
      { status: 500 },
    );
  }
}
