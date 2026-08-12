import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const db = await getDatabase();
  const body = await request.json();
  // Expects: { driverId, requestId, type: 'Breakdown' | 'Police' | 'Delay', note, coords }

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
  

  try {
    const incidentLog = {
      ...body,
      driverId: decoded.userId,
      loggedAt: new Date(),
      resolved: false,
    };

    await db.collection("incidents").insertOne(incidentLog);

    // Alert: In a real app, you'd trigger a Push Notification or SMS to Admin here

    return NextResponse.json({
      success: true,
      incidentId: incidentLog.loggedAt.getTime(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Critical log failure" },
      { status: 500 },
    );
  }
}
