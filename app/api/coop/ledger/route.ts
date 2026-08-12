import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// --- GET: Fetch Earnings for a Supplier ---
export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    const earnings = await db
      .collection("dividends")
      .aggregate([
        { $match: { supplierId: supplierId } },
        {
          $group: {
            _id: "$productType",
            totalEarned: { $sum: "$amount" },
            totalWeight: { $sum: "$weight" },
          },
        },
      ])
      .toArray();

    return NextResponse.json({ earnings });
  } catch (error) {
    return NextResponse.json({ error: "Ledger fetch failed" }, { status: 500 });
  }
}

// --- PATCH: Admin Verifies Weight & Triggers Dividend ---
export async function PATCH(request: Request) {
  try {
    const db = await getDatabase();
    const { batchId, finalWeight, ratePerKg } = await request.json();

    const dividendAmount = Number(finalWeight) * Number(ratePerKg);

    // Update the batch status
    await db.collection("batches").updateOne(
      { _id: new ObjectId(batchId) },
      {
        $set: {
          status: "Verified",
          weight: finalWeight,
          verifiedAt: new Date(),
        },
      },
    );

    // Create a Ledger entry
    await db.collection("dividends").insertOne({
      batchId: new ObjectId(batchId),
      amount: dividendAmount,
      timestamp: new Date(),
      type: "CREDIT",
    });

    return NextResponse.json({ message: "Dividend distributed successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Distribution failed" }, { status: 500 });
  }
}
