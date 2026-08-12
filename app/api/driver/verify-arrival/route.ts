import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const db = await getDatabase();
  const { requestId, status, timestamp } = await request.json();

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
  if (!decoded || decoded.role !== "driver") {
    return NextResponse.json(
      { error: "Unauthorized access: Drivers only" },
      { status: 403 },
    );
  }
        
  // Validate allowed status transitions
  const validStatuses = ["Arrived", "In-Transit", "Delivered"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid Status Sequence" },
      { status: 400 },
    );
  }

  try {
    const result = await db.collection("pickup_requests").updateOne(
      { id: requestId }, // Or _id if using MongoDB ObjectId
      {
        $set: {
          status: status,
          [`lastUpdate_${status}`]: new Date(timestamp),
        },
      },
    );

    return NextResponse.json({ success: true, newStatus: status });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
