import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const db = await getDatabase();
  const { batchId, supplierId, amount } = await request.json();

  const session = (
    await (
      await import("@/lib/mongodb")
    ).default
  ).startSession();

  try {
    await session.withTransaction(async () => {
      // 1. Update Batch Status
      await db
        .collection("batches")
        .updateOne(
          { id: batchId },
          { $set: { status: "Paid", paidAt: new Date() } },
          { session },
        );

      // 2. Update Supplier Wallet
      await db.collection("wallets").updateOne(
        { supplierId },
        {
          $inc: { balance: amount },
          $set: { lastUpdated: new Date() },
        },
        { upsert: true, session },
      );

      // 3. Create Audit Trail
      await db.collection("transactions").insertOne(
        {
          supplierId,
          batchId,
          amount,
          type: "Credit",
          description: `Payout for Batch ${batchId}`,
          date: new Date(),
        },
        { session },
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Payout Failed" }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
