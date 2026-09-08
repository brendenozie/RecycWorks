import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Authentication token missing" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paramSupplierId = searchParams.get("supplierId");

    let targetSupplierId = decoded.userId;
    // Allow admin/finance/accounts to inspect specific supplier
    if (paramSupplierId && ["admin", "super_admin", "accounts", "finance"].includes(decoded.role)) {
      targetSupplierId = paramSupplierId;
    }

    if (!targetSupplierId || targetSupplierId === "ALPHA_01") {
      // Fallback to current authenticated user's ID
      targetSupplierId = decoded.userId;
    }

    let supplierObjId: ObjectId | null = null;
    if (ObjectId.isValid(targetSupplierId)) {
      supplierObjId = new ObjectId(targetSupplierId);
    }

    // 1. Authoritative Pending Value from actual Collections in inventory
    const supplierLoads = await db
      .collection("inventory")
      .find({
        $or: [
          ...(supplierObjId ? [{ supplierId: supplierObjId }] : []),
          { supplierId: targetSupplierId },
        ],
      })
      .toArray();

    // Pending value (collections captured/delivered but not yet marked as paid)
    const pendingLoads = supplierLoads.filter((l) => (l.paymentStatus || "pending").toLowerCase() !== "paid");
    const estimatedValue = pendingLoads.reduce(
      (acc, l) => acc + (Number(l.netValueKes || l.grossValueKes || l.quantity * (l.unitPricePerKg || 35)) || 0),
      0
    );

    // 2. Authoritative Payments history from payments collection
    const paymentRecords = await db
      .collection("payments")
      .find({
        $or: [
          ...(supplierObjId ? [{ recipientId: supplierObjId }] : []),
          { recipientId: targetSupplierId },
        ],
      })
      .sort({ createdAt: -1, paidAt: -1 })
      .limit(10)
      .toArray();

    const totalPaidBalance = paymentRecords
      .filter((p) => p.status === "completed")
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const history = paymentRecords.map((p) => ({
      id: p._id.toString(),
      paymentNo: p.paymentNo,
      amount: Number(p.amount) || 0,
      paymentMethod: p.method || "M-PESA",
      paymentReference: p.paymentReference,
      status: p.status,
      description: p.notes || `Disbursement for collection ${p.paymentReference}`,
      date: p.paidAt || p.createdAt || new Date(),
    }));

    return NextResponse.json({
      balance: Math.round(totalPaidBalance * 100) / 100,
      estimatedValue: Math.round(estimatedValue * 100) / 100,
      history,
    });
  } catch (error: any) {
    console.error("[Supplier Finance API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch financial data" }, { status: 500 });
  }
}
