import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Authentication token missing" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== "supplier" && decoded.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized access: Suppliers only" }, { status: 403 });
    }

    const supplierUser = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) });

    const clientPromise = (await import("@/lib/mongodb")).default;
    const client = await clientPromise;
    const session = client.startSession();

    const weightKg = Number(body.totalWeightKg || body.totalWeight || 0);
    const count = await db.collection("sourcing_requests").countDocuments();
    const requestNo = `SR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const pickupDoc = {
      requestNo,
      supplierId: new ObjectId(decoded.userId),
      supplierName: supplierUser
        ? `${supplierUser.firstName || ""} ${supplierUser.lastName || ""}`.trim() || supplierUser.businessName
        : "Registered Supplier",
      supplierPhone: supplierUser?.phoneNumber || body.phoneNumber || "",
      supplierEmail: supplierUser?.email || decoded.email,
      businessName: supplierUser?.businessName || "",
      materialName: body.material || body.name || "Mixed Recyclables",
      grade: body.grade || "Standard",
      estimatedWeightKg: weightKg,
      pickupAddress: body.pickupAddress || supplierUser?.county || "Supplier Yard",
      county: body.county || supplierUser?.county || "Nairobi",
      subCounty: body.subCounty || supplierUser?.subCounty || "",
      hubId: body.hubId ? new ObjectId(body.hubId) : (supplierUser?.hubId || null),
      hubName: body.hubName || "Central Receiving Yard",
      status: "pending",
      photos: Array.isArray(body.photos) ? body.photos : (body.photoUrl ? [body.photoUrl] : []),
      notes: body.notes || "",
      priority: weightKg > 2000 ? "High" : "Normal",
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await session.withTransaction(async () => {
        // 1. Insert into sourcing_requests for central operations queue
        await db.collection("sourcing_requests").insertOne(pickupDoc, { session });

        // 2. Also record in pickup_requests for supplier backwards compatibility
        await db.collection("pickup_requests").insertOne(pickupDoc, { session });

        // 3. If specific existing batch IDs were locked
        if (Array.isArray(body.batchIds) && body.batchIds.length > 0) {
          const validObjectIds = body.batchIds
            .filter((id: string) => ObjectId.isValid(id))
            .map((id: string) => new ObjectId(id));

          if (validObjectIds.length > 0) {
            await db.collection("inventory").updateMany(
              { _id: { $in: validObjectIds } },
              { $set: { status: "transit-requested", updatedAt: new Date() } },
              { session }
            );
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: `Pickup request ${requestNo} submitted. Central fleet notified.`,
        requestNo,
      });
    } finally {
      await session.endSession();
    }
  } catch (error: any) {
    console.error("[Supplier Pickup Request Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit pickup request" },
      { status: 500 }
    );
  }
}
