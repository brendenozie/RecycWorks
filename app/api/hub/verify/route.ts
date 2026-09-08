import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// --- GET: Preview Load / Batch Details Before Verification ---
export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const identifier = (searchParams.get("batchId") || searchParams.get("loadNumber") || "").trim();

    if (!identifier) {
      return NextResponse.json({ error: "Batch Serial ID or Load Number required" }, { status: 400 });
    }

    // 1. Look in inventory collection (authoritative Load model)
    const load = await db.collection("inventory").findOne({
      $or: [
        { loadNumber: identifier },
        { loadNumber: { $regex: new RegExp(`^${identifier}$`, "i") } },
        ...(ObjectId.isValid(identifier) ? [{ _id: new ObjectId(identifier) }] : []),
      ],
    });

    if (load) {
      return NextResponse.json({
        found: true,
        type: "load",
        id: load._id.toString(),
        loadNumber: load.loadNumber,
        supplierName: load.supplierName || load.supplier,
        material: load.material,
        grade: load.grade,
        expectedWeightKg: load.normalizedWeightKg || load.quantity || 0,
        totalSacks: load.totalSacks || load.items?.length || 1,
        items: load.items || [],
        status: load.status,
        verifiedWeightKg: load.verifiedWeightKg || null,
        discrepancyKg: load.discrepancyKg || null,
      });
    }

    // 2. Fallback to legacy batches collection
    const batch = await db.collection("batches").findOne({
      $or: [{ id: identifier }, { batchId: identifier }],
    });

    if (batch) {
      return NextResponse.json({
        found: true,
        type: "batch",
        id: batch.id || batch._id?.toString(),
        loadNumber: batch.id,
        supplierName: batch.supplier || "Yard Partner",
        material: batch.material || "Feedstock",
        grade: batch.grade || "Standard",
        expectedWeightKg: batch.weight || 0,
        totalSacks: 1,
        items: [],
        status: batch.status,
        verifiedWeightKg: batch.verifiedWeight || null,
        discrepancy: batch.discrepancy || null,
      });
    }

    return NextResponse.json({ error: "Consignment / Batch ID not found in receiving matrix" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to query load for receiving verification" }, { status: 500 });
  }
}

// --- POST: Commit Scale Verified Reading to Ledger ---
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const { batchId, verifiedWeight, hubManagerId } = await request.json();

    const identifier = (batchId || "").trim();
    const numVerified = parseFloat(String(verifiedWeight));

    if (!identifier || isNaN(numVerified) || numVerified <= 0) {
      return NextResponse.json(
        { error: "Valid Batch Serial / Load Number and positive Scale Verified Weight are required" },
        { status: 400 }
      );
    }

    // 1. Look in inventory collection
    const load = await db.collection("inventory").findOne({
      $or: [
        { loadNumber: identifier },
        { loadNumber: { $regex: new RegExp(`^${identifier}$`, "i") } },
        ...(ObjectId.isValid(identifier) ? [{ _id: new ObjectId(identifier) }] : []),
      ],
    });

    if (load) {
      const originalWeight = load.normalizedWeightKg || load.quantity || 0;
      const discrepancy = Math.round((originalWeight - numVerified) * 100) / 100;

      await db.collection("inventory").updateOne(
        { _id: load._id },
        {
          $set: {
            status: "verified",
            actualWeightKg: numVerified,
            verifiedWeightKg: numVerified,
            discrepancyKg: discrepancy,
            verifiedAt: new Date(),
            verifiedBy: hubManagerId || "HUB_CENTRAL_01",
            updatedAt: new Date(),
          },
        }
      );

      // Audit log entry
      await db.collection("audit_logs").insertOne({
        action: "LOAD_VERIFIED_AT_HUB",
        entityType: "load",
        entityId: load._id.toString(),
        details: {
          loadNumber: load.loadNumber,
          originalWeightKg: originalWeight,
          verifiedWeightKg: numVerified,
          discrepancyKg: discrepancy,
          hubManagerId,
        },
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        type: "load",
        loadNumber: load.loadNumber,
        originalWeightKg: originalWeight,
        verifiedWeight: numVerified,
        discrepancy,
        status: "verified",
        supplierName: load.supplierName || load.supplier,
        items: load.items || [],
        totalSacks: load.totalSacks || 1,
      });
    }

    // 2. Legacy fallback in batches collection
    const batch = await db.collection("batches").findOne({
      $or: [{ id: identifier }, { batchId: identifier }],
    });

    if (batch) {
      const discrepancy = Math.round(((batch.weight || 0) - numVerified) * 100) / 100;

      await db.collection("batches").updateOne(
        { _id: batch._id },
        {
          $set: {
            status: "Verified",
            verifiedWeight: numVerified,
            discrepancy,
            verifiedAt: new Date(),
            verifiedBy: hubManagerId || "HUB_CENTRAL_01",
          },
        }
      );

      return NextResponse.json({
        success: true,
        type: "batch",
        discrepancy,
        verifiedWeight: numVerified,
        status: "Verified",
      });
    }

    return NextResponse.json({ error: "Batch or Load Number not found in ledger" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Verification Failed" }, { status: 500 });
  }
}
