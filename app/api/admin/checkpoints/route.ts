import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

/**
 * PATCH: Atomically clear a specific checkpoint status.
 * This is the primary interaction for the driver/dashboard to mark a hub as cleared.
 */
export async function PATCH(req: Request) {
  try {
    const { manifestId, checkpointId } = await req.json();

    if (!manifestId || !checkpointId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const db = await getDatabase();

    // Use the positional operator $ to update only the specific checkpoint object
    const result = await db.collection("manifests").findOneAndUpdate(
      {
        id: manifestId,
        "checkpoints.id": checkpointId,
      },
      {
        $set: {
          "checkpoints.$.status": "Cleared",
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json(
        { error: "Checkpoint or Manifest not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ manifest: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove a checkpoint from a route (e.g., if a supplier load is cancelled).
 */
export async function DELETE(req: Request) {
  try {
    const { manifestId, checkpointId } = await req.json();
    const db = await getDatabase();

    const result = await db
      .collection("manifests")
      .updateOne(
        { id: manifestId },
        { $pull: { checkpoints: { id: checkpointId } } as any },
      );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "No checkpoint removed" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove checkpoint" },
      { status: 500 },
    );
  }
}
// import { getDatabase } from "@/lib/mongodb";
// import { NextResponse } from "next/server";

// // --- GET: Fetch All Active Nodes ---
// export async function GET() {
//   try {
//     const db = await getDatabase();
//     const hubs = await db.collection("hubs").find({}).toArray();
//     return NextResponse.json(hubs);
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to fetch hub grid" },
//       { status: 500 },
//     );
//   }
// }

// // --- POST: Provision New Hub ---
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
//       load: Number(body.load) || 0,
//       status: body.status || "Optimal",
//       // If coordinates aren't provided, we generate random ones for the tactical map
//       coords: body.coords || {
//         x: `${Math.floor(Math.random() * 80 + 10)}%`,
//         y: `${Math.floor(Math.random() * 80 + 10)}%`,
//       },
//       createdAt: new Date(),
//     };

//     const result = await db.collection("hubs").insertOne(newHub);
//     return NextResponse.json(
//       { _id: result.insertedId, ...newHub },
//       { status: 201 },
//     );
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to provision hub" },
//       { status: 500 },
//     );
//   }
// }
