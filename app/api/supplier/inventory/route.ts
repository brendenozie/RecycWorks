import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb"; // Adjust your import path if needed
import { verifyToken, processBatchCompletion } from "@/lib/auth"; // Wherever your auth file resides
import { ObjectId } from "mongodb";

// --- GET: Fetch All Material Manifests ---
export async function GET(request: Request) {
  try {
    
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status");

    // 1. Authenticate via Bearer Token or Cookie
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
    let query: Record<string, any> = {};
    if (statusFilter) {
      query.status = statusFilter;
    }

    // Fetch items sorted by newest first
    const items = await db
      .collection("inventory")
      .find({
        supplierId: new ObjectId(decoded.userId),
        ...query
      })
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

export async function POST(request: Request) {
  try {
    // 1. Authenticate via Bearer Token or Cookie
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
    const body = await request.json();
    const { name, grade, weight, driver } = body;

    if (!name || !weight) {
      return NextResponse.json(
        { error: "Missing required payload variables (name, weight)" },
        { status: 400 },
      );
    }

    // Parse values safely
    const parsedWeightTons = parseFloat(weight);
    const weightInKg = parsedWeightTons * 1000; // Conversion fallback for processBatchCompletion KGS

    // 2. Build Inventory Record
    const targetId = `MAT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newInventoryEntry = {
      id: targetId,
      name,
      grade: grade || "Standard Flakes",
      weight: `${parsedWeightTons}t`,
      supplierId: new ObjectId(decoded.userId),
      supplier: decoded.email, // Link user's unique identity profile safely
      driver: driver || "",
      createdAt: new Date(),
    };

    // 3. Write payload downstream
    const result = await db
      .collection("inventory")
      .insertOne(newInventoryEntry);

    // 4. Update the supplier profile analytics dynamically using your custom handler
    // Assumes an arbitrary base rate/rate configuration for recycled materials if none provided
    await processBatchCompletion(decoded.userId, {
      weight: weightInKg,
      rate: 15, // KES rate per KG configuration
      material: name,
    });

    return NextResponse.json(
      { success: true, insertedId: result.insertedId },
      { status: 201 },
    );
  } catch (error) {
    console.error("Ledger batch commit error:", error);
    return NextResponse.json(
      { error: "Internal server error logging ledger entry" },
      { status: 500 },
    );
  }
}
