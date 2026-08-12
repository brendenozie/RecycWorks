import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function PUT(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    const id = body._id || body.id; // Use _id if available, otherwise fallback to id

    // Basic structural parameter validations
    if (!id || !body.name || !body.grade || !body.weight || !body.supplier) {
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
    await db
      .collection("inventory")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    return NextResponse.json({ message: "Manifest updated successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update manifest payload configuration" },
      { status: 500 },
    );
  }
}

// --- PATCH: Update Existing Material ---
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    const updateData = { ...body, updatedAt: new Date() };
    delete updateData._id; // Ensure we don't try to overwrite the ID

    await db
      .collection("inventory")
      .updateOne(
        { _id: new ObjectId((await params).id) },
        { $set: updateData },
      );

    return NextResponse.json({ message: "Manifest updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// --- DELETE: Permanently Remove Material ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = await getDatabase();
    await db
      .collection("inventory")
      .deleteOne({ _id: new ObjectId((await params).id) });

    return NextResponse.json({ message: "Material purged from ledger" });
  } catch (error) {
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
