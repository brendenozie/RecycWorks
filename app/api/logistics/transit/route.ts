import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// --- GET: Fetch Active Load for Transit Pass ---
export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");

    const activeLoad = await db.collection("transit_logs").findOne({
      driverId: driverId,
      status: { $in: ["In Transit", "Pending Verification"] },
    });

    return NextResponse.json(activeLoad);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transit data" },
      { status: 500 },
    );
  }
}

// --- POST: Driver Submits New Load (The 3 Photos) ---
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    const transitDoc = {
      driverId: body.driverId,
      vehiclePlate: body.vehiclePlate,
      originHub: body.originHub,
      materialType: body.materialType,
      weight: Number(body.weight),
      // Images stored as URLs/References
      images: {
        driverPortrait: body.driverImage,
        vehiclePlate: body.plateImage,
        loadContent: body.loadImage,
      },
      status: "Pending Verification",
      timestamp: new Date(),
    };

    const result = await db.collection("transit_logs").insertOne(transitDoc);
    return NextResponse.json(
      { _id: result.insertedId, ...transitDoc },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to log transit" },
      { status: 500 },
    );
  }
}
