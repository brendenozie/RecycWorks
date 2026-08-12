import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const db = await getDatabase();
  const { searchParams } = new URL(request.url);
  // const supplierId = searchParams.get("supplierId");

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
  

  // 1. Current Market Rates (Mocked or from a 'rates' collection)
  const rates: Record<string, number> = {
    "PET Clear": 28,
    "HDPE Opaque": 35,
    PP: 22,
  };

  // 2. Calculate "Pending" value from batches not yet paid
  const pendingBatches = await db
    .collection("batches")
    .find({ supplierId: new ObjectId(decoded.userId),
       status: { $in: ["Stored", "In-Transit"] } })
    .toArray();

  const estimatedValue = pendingBatches.reduce((acc, batch) => {
    return acc + batch.weight * (rates[batch.material] || 15);
  }, 0);

  // 3. Fetch Wallet Balance & History
  const wallet = await db.collection("wallets").findOne({ supplierId: new ObjectId(decoded.userId) });
  const history = await db
    .collection("transactions")
    .find({ supplierId: new ObjectId(decoded.userId) })
    .sort({ date: -1 })
    .limit(5)
    .toArray();

  return NextResponse.json({
    balance: wallet?.balance || 0,
    estimatedValue,
    history,
  });
}
