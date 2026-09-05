import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

function extractAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();

    // 1. Fetch loads requiring payment (status: delivered or verified, not yet paid)
    const pendingLoads = await db
      .collection("inventory")
      .find({
        status: { $in: ["delivered", "verified", "payment_pending", "captured", "loaded"] },
        paymentStatus: { $ne: "paid" },
      })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    // 2. Fetch paid load archives
    const paidLoads = await db
      .collection("inventory")
      .find({ paymentStatus: "paid" })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();

    // 3. Aggregate Field Officer work & stipends
    const fieldOfficers = await db.collection("users").find({
      role: { $in: ["field_officer", "field-officer", "operations"] },
    }).toArray();

    const officerWork = await Promise.all(
      fieldOfficers.map(async (officer: any) => {
        const officerId = officer._id.toString();
        const suppliersOnboarded = await db.collection("users").countDocuments({
          fieldOfficerId: officerId,
        });

        const officerLoads = await db.collection("inventory").find({
          fieldOfficerId: officerId,
        }).toArray();

        const totalKg = officerLoads.reduce(
          (sum: number, l: any) => sum + (Number(l.normalizedWeightKg) || 0),
          0
        );

        // Stipend formula: 500 KES per onboarded supplier + 350 KES per verified load
        const calculatedStipendKes = suppliersOnboarded * 500 + officerLoads.length * 350;

        return {
          id: officerId,
          name: `${officer.firstName || ""} ${officer.lastName || ""}`.trim() || officer.email,
          email: officer.email,
          phone: officer.phoneNumber || "N/A",
          hubName: officer.hubName || "Central",
          suppliersOnboarded,
          loadsCaptured: officerLoads.length,
          totalTonnage: (totalKg / 1000).toFixed(2),
          calculatedStipendKes,
        };
      })
    );

    // 4. Aggregate Driver work & trip allowances
    const drivers = await db.collection("users").find({ role: "driver" }).toArray();

    const driverWork = await Promise.all(
      drivers.map(async (driver: any) => {
        const driverId = driver._id.toString();
        const trips = await db.collection("inventory").find({
          driverId: driverId,
          status: "delivered",
        }).toArray();

        const totalDeliveredKg = trips.reduce(
          (sum: number, l: any) => sum + (Number(l.normalizedWeightKg) || 0),
          0
        );

        // Trip allowance formula: 800 KES per completed bulk delivery trip
        const calculatedAllowanceKes = trips.length * 800;

        return {
          id: driverId,
          name: `${driver.firstName || ""} ${driver.lastName || ""}`.trim() || driver.email,
          email: driver.email,
          phone: driver.phoneNumber || "N/A",
          vehicle: driver.vehiclePlate || "ISUZU FRR",
          tripsCompleted: trips.length,
          totalDeliveredTonnage: (totalDeliveredKg / 1000).toFixed(2),
          calculatedAllowanceKes,
        };
      })
    );

    // 5. Recent completed payout transactions
    const recentPayouts = await db
      .collection("transactions")
      .find({})
      .sort({ date: -1 })
      .limit(30)
      .toArray();

    return NextResponse.json({
      pendingLoads,
      paidLoads,
      officerWork,
      driverWork,
      recentPayouts,
    });
  } catch (error: any) {
    console.error("[Payouts Matrix Error]:", error);
    return NextResponse.json({ error: "Failed to fetch payouts ledger" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    const admin = extractAdmin(request);

    const {
      loadId,
      supplierId,
      recipientName,
      amount,
      paymentMethod = "M-PESA",
      paymentReference,
      notes,
    } = body;

    if (!paymentReference) {
      return NextResponse.json(
        { error: "A payment reference code (e.g. M-Pesa receipt or bank transaction ID) is required." },
        { status: 400 }
      );
    }

    const clientPromise = (await import("@/lib/mongodb")).default;
    const client = await clientPromise;
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        // 1. Update Load Status if loadId provided
        if (loadId && ObjectId.isValid(loadId)) {
          await db.collection("inventory").updateOne(
            { _id: new ObjectId(loadId) },
            {
              $set: {
                paymentStatus: "paid",
                status: "paid",
                paymentReference,
                paymentMethod,
                amountPaidKes: Number(amount),
                paidAt: new Date(),
                paidBy: admin?.email || "Finance Desk",
                updatedAt: new Date(),
              },
            },
            { session }
          );
        }

        // 2. Update Supplier/Staff Wallet
        if (supplierId) {
          await db.collection("wallets").updateOne(
            { supplierId: supplierId.toString() },
            {
              $inc: { balance: Number(amount) || 0 },
              $set: { lastUpdated: new Date() },
            },
            { upsert: true, session }
          );
        }

        // 3. Create Audit Ledger Record
        await db.collection("transactions").insertOne(
          {
            loadId: loadId || null,
            supplierId: supplierId || null,
            recipientName: recipientName || "Supplier",
            amount: Number(amount) || 0,
            paymentMethod,
            paymentReference,
            type: "Payout",
            description: `Payment for consignment ${loadId || "Consolidated"} via ${paymentMethod} (${paymentReference})`,
            paidBy: admin?.email || "Finance Desk",
            notes: notes || "",
            date: new Date(),
          },
          { session }
        );
      });

      return NextResponse.json({
        success: true,
        message: `Payout of KES ${amount?.toLocaleString()} recorded successfully with reference ${paymentReference}.`,
      });
    } finally {
      await session.endSession();
    }
  } catch (error: any) {
    console.error("[Process Payout Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payout" },
      { status: 500 }
    );
  }
}
