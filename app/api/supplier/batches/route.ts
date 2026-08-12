import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// GET: Fetch all batches for a specific supplier
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
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
  

  if (!decoded.userId) {
    return NextResponse.json({ error: "Invalid supplier ID" }, { status: 400 });
  }

  const db = await getDatabase();
  const batches = await db
    .collection("batches")
    .find({ supplierId: new ObjectId(decoded.userId) })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(batches);
}

// POST: Create a new batch entry
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

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

    const newBatch = {
      ...body,
      supplierId: new ObjectId(decoded.userId),
      id: `B-${Math.floor(1000 + Math.random() * 9000)}`, // Generate unique ID
      status: "Stored",
      createdAt: new Date(),
    };

    const result = await db.collection("batches").insertOne(newBatch);
    return NextResponse.json(
      { success: true, id: result.insertedId },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to log batch" }, { status: 500 });
  }
}
