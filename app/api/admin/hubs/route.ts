import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getCityCoordinates } from "@/lib/locations";

// --- GET: Fetch All Active Nodes ---
export async function GET() {
  try {
    const db = await getDatabase();
    const rawHubs = await db.collection("hubs").find({}).toArray();

    // Normalize MongoDB _id string format and ensure real GPS coordinates
    const cleanHubs = await Promise.all(
      rawHubs.map(async (hub) => {
        let lat = typeof hub.lat === "number" ? hub.lat : undefined;
        let lng = typeof hub.lng === "number" ? hub.lng : undefined;

        // Auto-resolve missing coordinates using Kenya regional dataset
        if (lat === undefined || lng === undefined) {
          const resolved = getCityCoordinates(
            hub.location?.city,
            hub.location?.neighborhood,
            hub.name
          );
          lat = resolved.lat;
          lng = resolved.lng;

          // Backfill into MongoDB
          await db.collection("hubs").updateOne(
            { _id: hub._id },
            { $set: { lat, lng } }
          );
        }

        return {
          id: hub._id.toString(),
          name: hub.name,
          location: hub.location,
          load: hub.load || 0,
          status: hub.status || "Optimal",
          coords: hub.coords || { x: "50%", y: "50%" },
          lat,
          lng,
          supplierIds: hub.supplierIds || [],
        };
      })
    );

    return NextResponse.json(cleanHubs);
  } catch (error) {
    console.error("[Hubs Collection Engine Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch hub grid" },
      { status: 500 },
    );
  }
}

// --- POST: Provision New Hub ---
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    // Determine GPS coordinates
    let lat = Number(body.lat);
    let lng = Number(body.lng);

    if (isNaN(lat) || isNaN(lng) || lat === 0 && lng === 0) {
      const resolved = getCityCoordinates(body.city, body.neighborhood, body.name);
      lat = resolved.lat;
      lng = resolved.lng;
    }

    const newHub = {
      name: body.name,
      location: {
        country: body.country || "Kenya",
        city: body.city,
        neighborhood: body.neighborhood,
        phase: body.phase,
      },
      supplierIds: Array.isArray(body.supplierIds) ? body.supplierIds : [],
      load: Number(body.load) || 0,
      status: body.status || "Optimal",
      lat,
      lng,
      coords: body.coords || {
        x: `${Math.floor(Math.random() * 60 + 20)}%`,
        y: `${Math.floor(Math.random() * 50 + 25)}%`,
      },
      createdAt: new Date(),
    };

    const result = await db.collection("hubs").insertOne(newHub);
    return NextResponse.json(
      { id: result.insertedId.toString(), ...newHub },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to provision hub" },
      { status: 500 },
    );
  }
}
