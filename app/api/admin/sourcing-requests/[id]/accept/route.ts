import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * Helper to verify admin/operations authorization.
 */
function extractAdminUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  if (!token) return null;

  const decoded = verifyToken(token);
  if (decoded && (decoded.role === "admin" || decoded.role === "operations")) {
    return decoded;
  }

  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authorize Admin Access
    const adminUser = extractAdminUser(request);
    // if (!adminUser) {
    //   return NextResponse.json(
    //     { error: "Unauthorized access. Admin credentials required." },
    //     { status: 403 },
    //   );
    // }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: `Invalid sourcing request ID format` },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const requestObjectId = new ObjectId(id);

    // 2. Fetch current sourcing request
    const sourcingRequest = await db
      .collection("sourcing_requests")
      .findOne({ _id: requestObjectId });

    if (!sourcingRequest) {
      return NextResponse.json(
        { error: "Sourcing request not found" },
        { status: 404 },
      );
    }

    // 3. Prevent duplicate processing if already accepted
    if (sourcingRequest.status === "accepted") {
      return NextResponse.json(
        {
          error:
            "This request has already been accepted and queued in inventory.",
        },
        { status: 400 },
      );
    }

    // Access the MongoClient instance from mongodb module
    const clientPromise = (await import("@/lib/mongodb")).default;
    const client = await clientPromise;
    const session = client.startSession();

    let inventoryId: ObjectId | null = null;

    try {
      await session.withTransaction(async () => {
        // A. Update Sourcing Request status to "accepted"
        await db.collection("sourcing_requests").updateOne(
          { _id: requestObjectId },
          {
            $set: {
              status: "accepted",
              acceptedBy: adminUser?.userId || "unknown",
              acceptedAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { session },
        );

        // Format weight to string format matching inventory (e.g. "500kg" or "1.5t")
        const weightKg = sourcingRequest.estimatedWeightKg || 0;
        const formattedWeight =
          weightKg >= 1000
            ? `${(weightKg / 1000).toFixed(1)}t`
            : `${weightKg}kg`;

        // B. Insert linked record into Inventory collection marked as "pending"
        const inventoryPayload = {
          sourcingRequestId: requestObjectId,
          requestNo: sourcingRequest.requestNo || "",
          name: sourcingRequest.materialName,
          grade: sourcingRequest.grade || "Standard",
          weight: formattedWeight,
          weightKg: weightKg,
          supplier: sourcingRequest.supplierName || "Unassigned Supplier",
          supplierId: sourcingRequest.supplierId
            ? sourcingRequest.supplierId.toString()
            : "",
          driver: sourcingRequest.driverName || "",
          driverId: sourcingRequest.driverId
            ? sourcingRequest.driverId.toString()
            : "",
          hubId: sourcingRequest.hubId || null,
          pickupAddress: sourcingRequest.pickupAddress || "",
          status: "pending", // Added to inventory as pending review/fulfillment
          timestamp: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await db
          .collection("inventory")
          .insertOne(inventoryPayload, { session });

        inventoryId = result.insertedId;

        // C. Update feedstock categories count (non-blocking update)
        if (sourcingRequest.materialName) {
          await db.collection("feedstockCategories").updateOne(
            { name: sourcingRequest.materialName },
            {
              $inc: { activeOrders: 1 },
              $set: { updatedAt: new Date() },
            },
            { session },
          );
        }
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json(
      {
        message: "Sourcing request accepted and added to inventory as pending",
        sourcingRequestId: id,
        inventoryId: inventoryId ? inventoryId : null,
        status: "accepted",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[Accept Sourcing Request Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request acceptance" },
      { status: 500 },
    );
  }
}
