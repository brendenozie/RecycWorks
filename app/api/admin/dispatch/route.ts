import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const db = await getDatabase();
  const { requestId, driverId, vehiclePlate } = await request.json();

  try {
    await db.collection("pickup_requests").updateOne(
      { _id: requestId },
      {
        $set: {
          status: "Dispatched",
          assignedDriver: driverId,
          vehicle: vehiclePlate,
          dispatchedAt: new Date(),
        },
      },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}
