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

    // Clean data for MongoDB update
    const { _id, ...updateData } = body;

    const result = await db
      .collection("hubs")
      .updateOne(
        { _id: new ObjectId((await params).id) },
        { $set: { ...updateData, lastUpdated: new Date() } },
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update hub" },
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
    await db
      .collection("hubs")
      .deleteOne({ _id: new ObjectId((await params).id) });
    return NextResponse.json({ message: "Hub decommissioned" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove hub" },
      { status: 500 },
    );
  }
}
