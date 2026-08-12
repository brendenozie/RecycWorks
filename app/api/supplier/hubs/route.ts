import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

// Assuming verifyToken and getDatabase are imported here

// --- GET: Fetch Active Nodes for Current Supplier ---
export async function GET(request: Request) {
  try {
    // 1. Authenticate via Bearer Token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token missing" },
        { status: 401 },
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "supplier") {
      return NextResponse.json(
        { error: "Unauthorized access: Suppliers only" },
        { status: 403 },
      );
    }

    const db = await getDatabase();

    // 2. Extract the user ID from the decoded token payload
    const currentSupplierId = decoded.userId || null;

    // 3. Query hubs where the supplierIds array contains the current user's ID
    const rawHubs = await db
      .collection("hubs")
      .find({
        supplierIds: currentSupplierId,
      })
      .toArray();

    // 4. Normalize MongoDB _id string format to match frontend mapping key structure
    const cleanHubs = rawHubs.map((hub) => ({
      id: hub._id.toString(),
      name: hub.name,
      location: hub.location,
      load: hub.load || 0,
      status: hub.status || "Optimal",
      coords: hub.coords,
      supplierIds: hub.supplierIds || [],
    }));

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
// export async function POST(request: Request) {
//   try {
//     const db = await getDatabase();
//     const body = await request.json();

//     const newHub = {
//       name: body.name,
//       location: {
//         country: body.country,
//         city: body.city,
//         neighborhood: body.neighborhood,
//         phase: body.phase,
//       },
//       supplierIds: Array.isArray(body.supplierIds) ? body.supplierIds : [],
//       load: Number(body.load) || 0,
//       status: body.status || "Optimal",
//       coords: body.coords || {
//         x: `${Math.floor(Math.random() * 60 + 20)}%`,
//         y: `${Math.floor(Math.random() * 50 + 25)}%`,
//       },
//       createdAt: new Date(),
//     };

//     const result = await db.collection("hubs").insertOne(newHub);
//     return NextResponse.json(
//       { id: result.insertedId.toString(), ...newHub },
//       { status: 201 },
//     );
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to provision hub" },
//       { status: 500 },
//     );
//   }
// }
