import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const db = await getDatabase();
  const body = await request.json(); // { supplierId, batchIds, hub, totalWeight }

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

  const session = (
    await (
      await import("@/lib/mongodb")
    ).default
  ).startSession();

  try {
    await session.withTransaction(async () => {
      // 1. Create the Pickup Request for the Admin Dashboard
      await db.collection("pickup_requests").insertOne(
        {
          ...body,
          supplierId: new ObjectId(decoded.userId),
          status: "transit-requested",
          requestedAt: new Date(),
          priority: body.totalWeight > 2000 ? "High" : "Normal",
        },
        { session },
      );

      // 2. Update all selected inventory to "Transit-Requested" (locking them)

      await db.collection("inventory").updateMany(
        {
          _id: {
            $in: body.batchIds.map((id: string) => new ObjectId(id)),
          },
        },
        {
          $set: {
            status: "transit-requested",
          },
        },
        { session },
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Logistics Sync Failed" },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
