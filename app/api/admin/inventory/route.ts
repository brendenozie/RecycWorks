import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// --- GET: Fetch All Material Manifests ---
export async function GET(request: Request) {
  try {

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status");

    const db = await getDatabase();
    let query: Record<string, any> = {};
    if (statusFilter) {
      query.status = statusFilter;
    }

    // Fetch items sorted by newest first
    const items = await db
      .collection("inventory")
      .find(query)
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch inventory matrix logs" },
      { status: 500 },
    );
  }
}

// --- GET: Fetch All Material Manifests ---
// export async function GET(request: Request) {
//   try {

//     const db = await getDatabase();
//     // Fetch items sorted by newest first
//     const items = await db
//       .collection("inventory")
//       .find({})
//       .sort({ timestamp: -1 })
//       .toArray();

//     return NextResponse.json(items);
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to fetch inventory matrix logs" },
//       { status: 500 },
//     );
//   }
// }

// --- POST: Sync New Material with Central Ledger ---
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    // Basic structural parameter validations
    if (!body.name || !body.grade || !body.weight || !body.supplier) {
      return NextResponse.json(
        {
          error:
            "Missing required inventory parameters (name, grade, weight, supplier)",
        },
        { status: 400 },
      );
    }

    const newItem = {
      name: body.name,
      grade: body.grade, // Selected contextually from the updated dynamic array template
      weight: body.weight, // e.g., "12.4t"
      supplier: body.supplier,
      driver: body.driver || "",
      driverId: body.driverId || "",
      supplierId: body.supplierId || "",
      status: body.status || "pending", // Default status for new entries pending would indicate they are awaiting further processing or review
      timestamp: new Date(),
    };

    // 1. Insert the manifest into the central inventory tracking ledger
    const result = await db.collection("inventory").insertOne(newItem);

    // 2. Cross-collection update: Adjust matching group category weights and metrics asynchronously
    try {
      const parsedWeight = parseFloat(body.weight.replace(/[^\d.-]/g, "")) || 0;

      // Update the active count and increment calculated metadata metrics
      await db.collection("feedstockCategories").updateOne(
        { name: body.name },
        {
          $inc: { activeOrders: 1 },
          $set: { updatedAt: new Date() },
          // Optional: You can parse and recalculate totalWeight into standard text tags here if desired
        },
      );
    } catch (relationError) {
      console.error(
        "Non-blocking feedstock structural count update failure:",
        relationError,
      );
    }

    return NextResponse.json(
      { _id: result.insertedId, ...newItem },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to record manifest payload configuration" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    // Basic structural parameter validations
    if (!body._id || !body.name || !body.grade || !body.weight || !body.supplier) {
      return NextResponse.json(
        {
          error:
            "Missing required inventory parameters (_id, name, grade, weight, supplier)",
        },
        { status: 400 },
      );
    }

    const updateData = {
      name: body.name,
      grade: body.grade,
      weight: body.weight,
      supplier: body.supplier,
      driver: body.driver || "",
      driverId: body.driverId || "",
      supplierId: body.supplierId || "",
      status: body.status || "pending",
      updatedAt: new Date(),
    };

    // Update the manifest in the central inventory tracking ledger
    await db.collection("inventory").updateOne(
      { _id: new ObjectId(body._id) },
      { $set: updateData },
    );

    return NextResponse.json({ message: "Manifest updated successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update manifest payload configuration" },
      { status: 500 },
    );
  }
}