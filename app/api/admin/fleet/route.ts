import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// --- GET: Fetch all vehicles (optionally filtered by status) ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // e.g., "Available"

    const db = await getDatabase();
    const query = status ? { status } : {};

    const vehicles = await db.collection("vehicles").find(query).toArray();
    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch fleet" },
      { status: 500 },
    );
  }
}

// --- POST: Register New Asset ---
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    const newAsset = {
      plate: body.plate?.toUpperCase(),
      makeModel: body.makeModel,
      capacity: body.capacity || "N/A",
      status: "Available",
      lastService: new Date(),
      location: body.location || "Nairobi Hub",
      currentManifestId: null,
      driver: body.driver || null, // Stores { name, id, phone }
      assignedHub: body.assignedHub || null,
      telemetry: { lastLat: null, lastLng: null, speed: null },
      createdAt: new Date(),
    };

    const result = await db.collection("vehicles").insertOne(newAsset);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to register vehicle" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Vehicle ID is required" },
        { status: 400 },
      );
    }

    const updateData = {
      ...body,
      lastUpdated: new Date(),
    };

    delete updateData.id; // Remove id from update data

    const result = await db
      .collection("vehicles")
      .updateOne({ _id: new ObjectId(body.id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Vehicle updated successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update vehicle" },
      { status: 500 },
    );
  }
}

// --- DELETE: Remove Asset ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    const db = await getDatabase();
    await db.collection("vehicles").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: "Vehicle removed" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// import { getDatabase } from "@/lib/mongodb";
// import { NextResponse } from "next/server";

// // --- GET: Fetch Available Vehicles ---
// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const status = searchParams.get("status") || "Available"; // Filter by availability

//     const db = await getDatabase();
//     const vehicles = await db
//       .collection("vehicles")
//       .find({ status: status })
//       .toArray();

//     return NextResponse.json(vehicles);
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to fetch fleet" },
//       { status: 500 },
//     );
//   }
// }

// // --- POST: Register New Asset ---
// export async function POST(request: Request) {
//   const db = await getDatabase();
//   const body = await request.json();

//   const newAsset = {
//     plate: body.plate.toUpperCase(),
//     model: body.model,
//     capacity: body.capacity, // e.g., "30 Tons"
//     status: "Available", // Default status
//     lastService: new Date(),
//     location: "Nairobi Hub",
//     //     currentManifestId	ObjectId	Link to the active Route Manifest (Null if Idle).
//     // telemetry	Object	Stores lastLat, lastLng, and speed.
//     currentManifestId: null,
//     telemetry: {
//       lastLat: null,
//       lastLng: null,
//       speed: null,
//     },
//     createdAt: new Date(),
//   };

//   const result = await db.collection("vehicles").insertOne(newAsset);
//   return NextResponse.json(result, { status: 201 });
// }
