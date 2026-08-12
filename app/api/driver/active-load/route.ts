import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

    // 2. Verify Token and Role
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== "driver" && decoded.role !== "admin")) {
      return NextResponse.json(
        { error: "Unauthorized access: Drivers only" },
        { status: 403 },
      );
    }

    // 3. Parse Request Body
    const body = await request.json();
    const { loadId, status, timestamp } = body;

    if (!loadId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: loadId and status" },
        { status: 400 },
      );
    }

    // 4. Connect to Database and Update
    const db = await getDatabase();

    // Optional: You could push to an array here if you want a history of status changes
    const updateResult = await db.collection("inventory").updateOne(
      { _id: new ObjectId(loadId) },
      {
        $set: {
          status: status,
          lastUpdatedBy: decoded.userId, // Track who made the change
          updatedAt: timestamp ? new Date(timestamp) : new Date(),
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Load not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Mission status updated successfully", success: true },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update Load Status Error:", error);
    return NextResponse.json(
      { error: "Failed to sync dispatch ledger" },
      { status: 500 },
    );
  }
}
