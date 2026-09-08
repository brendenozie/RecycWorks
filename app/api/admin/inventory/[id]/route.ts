import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function PUT(
  request: Request,
  { params }: { params?: Promise<{ id: string }> }
) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    const paramId = params ? (await params).id : undefined;
    const id = body._id || body.id || paramId;

    const name = body.name || body.material;
    // Basic structural parameter validations
    if (!id || !name || !body.grade || !body.weight || !body.supplier) {
      return NextResponse.json(
        {
          error:
            "Missing required inventory parameters (_id/id, name/material, grade, weight, supplier)",
        },
        { status: 400 },
      );
    }

    const cleanWeight = typeof body.weight === "string" ? body.weight : `${body.weight}kg`;
    const parsedWeight = parseFloat(cleanWeight.replace(/[^\d.-]/g, "")) || 0;
    const totalSacks = typeof body.totalSacks === "number" ? body.totalSacks : (Array.isArray(body.sacks) ? body.sacks.length : parseInt(body.totalSacks || "0", 10) || 0);
    const sacks = Array.isArray(body.sacks) ? body.sacks.map(Number) : [];

    const updateData: Record<string, any> = {
      name,
      material: name,
      grade: body.grade,
      weight: cleanWeight,
      normalizedWeightKg: parsedWeight,
      quantity: parsedWeight,
      totalSacks,
      sacks,
      packageType: body.packageType || (totalSacks > 0 ? "Woven Sacks" : "Standard"),
      hubId: body.hubId || "",
      notes: body.notes || "",
      unitPricePerKg: Number(body.unitPricePerKg || 0),
      grossValueKes: Number(body.unitPricePerKg || 0) * parsedWeight,
      supplier: body.supplier,
      supplierName: body.supplier,
      driver: body.driver || "",
      driverName: body.driver || "",
      driverId: body.driverId || "",
      supplierId: body.supplierId || "",
      status: body.status || "pending",
      updatedAt: new Date(),
    };

    if (body.movementType) {
      updateData.movementType = body.movementType;
    }
    if (body.isBackdated !== undefined) {
      updateData.isBackdated = Boolean(body.isBackdated);
    }
    if (body.collectedAt) {
      updateData.collectedAt = new Date(body.collectedAt);
      updateData.timestamp = new Date(body.collectedAt);
    }

    if (body.loadNumber) {
      updateData.loadNumber = body.loadNumber;
    }

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
