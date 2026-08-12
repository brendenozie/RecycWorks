import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// --- PATCH: Update Hub Configuration/Load ---
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    const targetId = (await params).id;

    // Structure properties cleanly back into our nested schema layout
    const updatePayload: Record<string, any> = {
      name: body.name,
      load: Number(body.load),
      status: body.status,
      supplierIds: Array.isArray(body.supplierIds) ? body.supplierIds : [],
      location: {
        country: body.country,
        city: body.city,
        neighborhood: body.neighborhood,
        phase: body.phase,
      },
      lastUpdated: new Date(),
    };

    // Keep the target coordinate pin stationary if already set
    if (body.coords) {
      updatePayload.coords = body.coords;
    }

    const result = await db
      .collection("hubs")
      .updateOne({ _id: new ObjectId(targetId) }, { $set: updatePayload });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Target node entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Hub Patch Configuration Engine Error]:", error);
    return NextResponse.json(
      { error: "Failed to update hub parameters" },
      { status: 500 },
    );
  }
}

// --- DELETE: Decommission Hub ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = await getDatabase();
    const targetId = (await params).id;

    await db.collection("hubs").deleteOne({ _id: new ObjectId(targetId) });

    return NextResponse.json({ message: "Hub decommissioned safely" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove hub node reference" },
      { status: 500 },
    );
  }
}
