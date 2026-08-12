import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// --- GET: Fetch all active assigned routes ---
export async function GET() {
  try {
    const db = await getDatabase();
    const routes = await db
      .collection("active_routes")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(routes);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 },
    );
  }
}

// --- POST: Admin Assigns Route (Origin to Destination) ---
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    const { originId, destinationId, driverId, vehiclePlate, manifestId } =
      body;

    // 1. Fetch Hub Details to store names/coords in the route (denormalization for speed)
    const originHub = await db
      .collection("hubs")
      .findOne({ _id: new ObjectId(originId) });
    const destinationHub = await db
      .collection("hubs")
      .findOne({ _id: new ObjectId(destinationId) });

    if (!originHub || !destinationHub) {
      return NextResponse.json(
        { error: "Invalid Hub selection" },
        { status: 400 },
      );
    }

    // 2. Build the Route Object
    const routeAssignment = {
      title: `${originHub.name} ➔ ${destinationHub.name}`,
      driverId,
      vehiclePlate,
      manifestId, // Linked to the inventory item
      origin: {
        id: originId,
        name: originHub.name,
        coords: originHub.coords,
      },
      destination: {
        id: destinationId,
        name: destinationHub.name,
        coords: destinationHub.coords,
      },
      // Default checkpoints (can be customized later)
      checkpoints: [
        {
          name: "Departure: " + originHub.name,
          status: "Cleared",
          timestamp: new Date(),
        },
        { name: "En-route Transit", status: "Pending" },
        { name: "Arrival: " + destinationHub.name, status: "Pending" },
      ],
      status: "Dispatched",
      createdAt: new Date(),
    };

    const result = await db
      .collection("active_routes")
      .insertOne(routeAssignment);

    // 3. Update Inventory status to "In-Transit"
    if (manifestId) {
      await db
        .collection("inventory")
        .updateOne(
          { _id: new ObjectId(manifestId) },
          { $set: { status: "In-Transit", currentRouteId: result.insertedId } },
        );
    }

    return NextResponse.json(
      { _id: result.insertedId, ...routeAssignment },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Route assignment failed" },
      { status: 500 },
    );
  }
}

// const assignRoute = async (originId, destId, materialId) => {
//   const payload = {
//     originId: originId,
//     destinationId: destId,
//     manifestId: materialId,
//     driverId: "DRV-99", // From your driver selection
//     vehiclePlate: "KDK 442Z",
//   };

//   const res = await fetch("/api/routes", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });

//   if (res.ok) {
//     alert("Route Live: Driver notified.");
//   }
// };
