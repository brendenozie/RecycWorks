import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const db = await getDatabase();
  const { batchId, verifiedWeight, hubManagerId } = await request.json();

  try {
    const batch = await db.collection("batches").findOne({ id: batchId });
    if (!batch)
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });

    const discrepancy = batch.weight - verifiedWeight;

    await db.collection("batches").updateOne(
      { id: batchId },
      {
        $set: {
          status: "Verified",
          verifiedWeight,
          discrepancy,
          verifiedAt: new Date(),
          verifiedBy: hubManagerId,
        },
      },
    );

    return NextResponse.json({ success: true, discrepancy });
  } catch (error) {
    return NextResponse.json({ error: "Verification Failed" }, { status: 500 });
  }
}
