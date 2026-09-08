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
      .sort({ createdAt: -1, timestamp: -1 })
      .toArray();

    const normalizedItems = items.map((l) => {
      // Calculate sacks array from direct property or aggregated items
      const sacks: number[] = Array.isArray(l.sacks)
        ? l.sacks
        : Array.isArray(l.items)
        ? l.items.flatMap((g: any) => (Array.isArray(g.sacks) ? g.sacks : []))
        : [];

      // Calculate total sacks count
      const totalSacks =
        typeof l.totalSacks === "number"
          ? l.totalSacks
          : sacks.length > 0
          ? sacks.length
          : Array.isArray(l.items)
          ? l.items.reduce(
              (sum: number, g: any) =>
                sum + (g.sackCount || (Array.isArray(g.sacks) ? g.sacks.length : 0)),
              0
            )
          : 0;

      return {
        _id: l._id.toString(),
        id: l._id.toString(),
        loadNumber: l.loadNumber || `RWL-${l._id.toString().slice(-6).toUpperCase()}`,
        name: l.material || l.name || "Mixed Plastics",
        material: l.material || l.name || "Mixed Plastics",
        grade: l.grade || "Standard",
        weight: l.weight || `${l.normalizedWeightKg || l.quantity || 0}kg`,
        normalizedWeightKg: Number(l.normalizedWeightKg || l.quantity || 0),
        totalSacks,
        sacks,
        packageType: l.packageType || (totalSacks > 0 ? "Woven Sacks" : "Standard"),
        items: Array.isArray(l.items) ? l.items : [],
        hubId: l.hubId ? l.hubId.toString() : l.hub || "",
        hub: l.hubName || l.hub || "",
        notes: l.notes || l.driverNotes || l.receivingNotes || "",
        unitPricePerKg: Number(l.unitPricePerKg || 0),
        grossValueKes: Number(l.grossValueKes || l.netValueKes || 0),
        supplier: l.supplierName || l.supplier || "Supplier",
        supplierName: l.supplierName || l.supplier || "Supplier",
        supplierId: l.supplierId ? l.supplierId.toString() : "",
        driver: l.driverName || l.driver || "",
        driverName: l.driverName || l.driver || "",
        driverId: l.driverId ? l.driverId.toString() : "",
        status: l.status || "pending",
        movementType: l.movementType || (l.status === "delivered" ? "delivered" : "received"),
        isBackdated: Boolean(l.isBackdated),
        collectedAt: l.collectedAt || l.timestamp || l.createdAt || new Date(),
        enteredAt: l.enteredAt || l.createdAt || new Date(),
        paymentStatus: l.paymentStatus || "pending",
        timestamp: l.timestamp || l.createdAt || new Date(),
        createdAt: l.createdAt || l.timestamp || new Date(),
      };
    });

    return NextResponse.json(normalizedItems);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch inventory matrix logs" },
      { status: 500 },
    );
  }
}

// --- POST: Sync New Material with Central Ledger ---
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    const name = body.name || body.material;
    // Basic structural parameter validations
    if (!name || !body.grade || !body.weight || !body.supplier) {
      return NextResponse.json(
        {
          error:
            "Missing required inventory parameters (name/material, grade, weight, supplier)",
        },
        { status: 400 },
      );
    }

    const cleanWeight = typeof body.weight === "string" ? body.weight : `${body.weight}kg`;
    const parsedWeight = parseFloat(cleanWeight.replace(/[^\d.-]/g, "")) || 0;
    const totalSacks = typeof body.totalSacks === "number" ? body.totalSacks : (Array.isArray(body.sacks) ? body.sacks.length : parseInt(body.totalSacks || "0", 10) || 0);
    const sacks = Array.isArray(body.sacks) ? body.sacks.map(Number) : [];

    const newItem = {
      loadNumber: body.loadNumber || `RWL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
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
      movementType: body.movementType || (body.status === "delivered" ? "delivered" : "received"),
      isBackdated: Boolean(body.isBackdated),
      collectedAt: body.collectedAt ? new Date(body.collectedAt) : new Date(),
      status: body.status || "pending",
      enteredAt: new Date(),
      timestamp: body.collectedAt ? new Date(body.collectedAt) : new Date(),
      createdAt: body.collectedAt ? new Date(body.collectedAt) : new Date(),
    };

    // 1. Insert the manifest into the central inventory tracking ledger
    const result = await db.collection("inventory").insertOne(newItem);

    // 2. Cross-collection update: Adjust matching group category weights and metrics asynchronously
    try {
      await db.collection("feedstockCategories").updateOne(
        { name },
        {
          $inc: { activeOrders: 1 },
          $set: { updatedAt: new Date() },
        },
      );
    } catch (relationError) {
      console.error(
        "Non-blocking feedstock structural count update failure:",
        relationError,
      );
    }

    return NextResponse.json(
      { _id: result.insertedId, id: result.insertedId.toString(), ...newItem },
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

    const targetId = body._id || body.id;
    const name = body.name || body.material;

    // Basic structural parameter validations
    if (!targetId || !name || !body.grade || !body.weight || !body.supplier) {
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
    await db.collection("inventory").updateOne(
      { _id: new ObjectId(targetId) },
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