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

    // 5. Recent completed payout transactions from authoritative payments collection
    const rawPayments = await db
      .collection("payments")
      .find({})
      .sort({ createdAt: -1, paidAt: -1 })
      .limit(50)
      .toArray();

    const recentPayouts = rawPayments.map((p) => ({
      _id: p._id.toString(),
      paymentNo: p.paymentNo || `PAY-${p._id.toString().slice(-6).toUpperCase()}`,
      loadId: p.loadId ? p.loadId.toString() : null,
      supplierId: p.recipientId ? p.recipientId.toString() : null,
      recipientName: p.recipientName || "Supplier",
      amount: Number(p.amount) || 0,
      paymentMethod: p.method || "M-PESA",
      paymentReference: p.paymentReference || "N/A",
      type: "Payout",
      description: p.notes || `Disbursement ${p.paymentReference} via ${p.method}`,
      paidBy: p.processedBy || p.initiatedBy || "Finance Desk",
      status: p.status || "completed",
      date: p.paidAt || p.createdAt || new Date(),
    }));

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
      const now = new Date();
      const paymentNo = `PAY-${now.getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Resolve recipient details from supplierId or load
      let recipientObjId: ObjectId = new ObjectId();
      let resolvedRecipientName = recipientName || "Supplier";
      let recipientType = "supplier";

      if (supplierId && ObjectId.isValid(supplierId)) {
        recipientObjId = new ObjectId(supplierId);
        const supp = await db.collection("users").findOne({ _id: recipientObjId });
        if (supp) {
          resolvedRecipientName = `${supp.firstName || ""} ${supp.lastName || ""}`.trim() || supp.businessName || resolvedRecipientName;
          recipientType = supp.role || "supplier";
        }
      }

      const paymentRecord = {
        paymentNo,
        recipientId: recipientObjId,
        recipientName: resolvedRecipientName,
        recipientType,
        loadId: loadId && ObjectId.isValid(loadId) ? new ObjectId(loadId) : null,
        amount: Number(amount) || 0,
        method: paymentMethod,
        paymentReference,
        status: "completed",
        provider: paymentMethod === "CASH" ? "CASH" : paymentMethod === "BANK" ? "BANK" : "MPESA_MANUAL",
        processedBy: admin?.email || "Finance Desk",
        initiatedBy: admin?.email || "Finance Desk",
        notes: notes || `Disbursement recorded via ${paymentMethod}`,
        paidAt: now,
        createdAt: now,
      };

      // 1. Insert authoritative payment record
      await db.collection("payments").insertOne(paymentRecord);

      // 2. Update Load Status if loadId provided
      if (loadId && ObjectId.isValid(loadId)) {
        await db.collection("inventory").updateOne(
          { _id: new ObjectId(loadId) },
          {
            $set: {
              paymentStatus: "paid",
              status: "PAID",
              paymentReference,
              paymentMethod,
              amountPaidKes: Number(amount),
              paidAt: now,
              paidBy: admin?.email || "Finance Desk",
              updatedAt: now,
            },
          }
        );
      }

      // 3. Audit log entry
      await db.collection("audit_logs").insertOne({
        userId: admin?.userId || "finance_desk",
        userEmail: admin?.email || "finance@recycworks.ke",
        action: "PAYMENT_RECORDED",
        entityType: "PAYMENT",
        entityId: paymentNo,
        details: {
          paymentNo,
          loadId,
          supplierId,
          recipientName: resolvedRecipientName,
          amount: Number(amount) || 0,
          paymentMethod,
          paymentReference,
        },
        timestamp: now,
      });

      return NextResponse.json({
        success: true,
        paymentNo,
        message: `Payout of KES ${Number(amount)?.toLocaleString()} recorded successfully with reference ${paymentReference}.`,
      });
    } catch (txError: any) {
      console.error("[Process Payout Transaction Error]:", txError);
      return NextResponse.json(
        { error: txError.message || "Failed to commit payout transaction" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Process Payout Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payout" },
      { status: 500 }
    );
  }
}
