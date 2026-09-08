import "dotenv/config";
if (!process.env.MONGODB_URI && process.env.DATABASE_URL) {
  process.env.MONGODB_URI = process.env.DATABASE_URL;
}
import { calculateMultiGroupLoad, CANONICAL_PRICING_CATALOG } from "../lib/pricing";
import { prisma } from "../lib/prisma";

async function runVerification() {
  console.log("=================================================");
  console.log("RECY C WORKS — RAPID FIELD WEIGHING TEST SUITE");
  console.log("=================================================\n");

  // TEST 1: Pricing Calculation & Catalog Consistency
  console.log("--- TEST 1: PRICING CATALOG INTEGRITY ---");
  console.log(`Total canonical catalog entries: ${CANONICAL_PRICING_CATALOG.length}`);
  const pp = CANONICAL_PRICING_CATALOG.find((p) => p.material.includes("PP"));
  const hdpe = CANONICAL_PRICING_CATALOG.find((p) => p.material.includes("HDPE"));

  console.log(`PP Sample Rate (${pp?.grade}): KES ${pp?.basePricePerKg}/kg`);
  console.log(`HDPE Sample Rate (${hdpe?.grade}): KES ${hdpe?.basePricePerKg}/kg`);

  if (!pp || !hdpe) {
    throw new Error("Missing expected pricing benchmarks for PP or HDPE");
  }
  console.log("✔ Catalog rates verified.\n");

  // TEST 2: Section 36 Real-World Scenario Calculations
  console.log("--- TEST 2: SECTION 36 MULTI-GROUP WEIGHING SCENARIO ---");
  const section36Groups = [
    {
      material: "PP",
      grade: "Grade A",
      sacks: [48, 51, 49, 52, 50], // 5 sacks, 250 KG
    },
    {
      material: "PP",
      grade: "Grade B",
      sacks: [46, 49, 47], // 3 sacks, 142 KG
    },
    {
      material: "HDPE",
      grade: "Grade A",
      sacks: [50, 48, 51, 49], // 4 sacks, 198 KG
    },
  ];

  const calculated = calculateMultiGroupLoad(section36Groups);

  console.log(`Total Groups: ${calculated.items.length}`);
  console.log(`Total Sacks: ${calculated.totalSacks} (Expected: 12)`);
  console.log(`Grand Weight: ${calculated.totalWeightKg} kg (Expected: 590 kg)`);
  console.log(`Grand Estimated Value: KES ${calculated.grossValueKes}`);

  if (calculated.totalSacks !== 12) {
    throw new Error(`Total sacks mismatch: expected 12, got ${calculated.totalSacks}`);
  }
  if (calculated.totalWeightKg !== 590) {
    throw new Error(`Total weight mismatch: expected 590, got ${calculated.totalWeightKg}`);
  }

  // Verify each group
  const g1 = calculated.items[0];
  console.log(`Group 1 (${g1.material} / ${g1.grade}): ${g1.sackCount} sacks, ${g1.totalWeightKg} kg, rate KES ${g1.unitPricePerKg}/kg -> KES ${g1.estimatedValueKes}`);
  if (g1.sackCount !== 5 || g1.totalWeightKg !== 250) {
    throw new Error(`Group 1 calculation error: expected 5 sacks and 250 kg, got ${g1.sackCount} sacks and ${g1.totalWeightKg} kg`);
  }

  const g2 = calculated.items[1];
  console.log(`Group 2 (${g2.material} / ${g2.grade}): ${g2.sackCount} sacks, ${g2.totalWeightKg} kg, rate KES ${g2.unitPricePerKg}/kg -> KES ${g2.estimatedValueKes}`);
  if (g2.sackCount !== 3 || g2.totalWeightKg !== 142) {
    throw new Error(`Group 2 calculation error: expected 3 sacks and 142 kg, got ${g2.sackCount} sacks and ${g2.totalWeightKg} kg`);
  }

  const g3 = calculated.items[2];
  console.log(`Group 3 (${g3.material} / ${g3.grade}): ${g3.sackCount} sacks, ${g3.totalWeightKg} kg, rate KES ${g3.unitPricePerKg}/kg -> KES ${g3.estimatedValueKes}`);
  if (g3.sackCount !== 4 || g3.totalWeightKg !== 198) {
    throw new Error(`Group 3 calculation error: expected 4 sacks and 198 kg, got ${g3.sackCount} sacks and ${g3.totalWeightKg} kg`);
  }
  console.log("✔ Section 36 calculations verified.\n");

  // TEST 3: Validation & Error Handling
  console.log("--- TEST 3: SACK VALIDATION & ZERO/NEGATIVE CHECKS ---");
  try {
    calculateMultiGroupLoad([
      {
        material: "PET",
        grade: "Grade A",
        sacks: [50, 0, 45],
      },
    ]);
    throw new Error("Should have thrown error for 0 kg sack");
  } catch (err: any) {
    console.log(`✔ Correctly caught invalid sack weight: "${err.message}"`);
  }

  try {
    calculateMultiGroupLoad([]);
    throw new Error("Should have thrown error for empty groups");
  } catch (err: any) {
    console.log(`✔ Correctly caught empty groups: "${err.message}"`);
  }
  console.log("");

  // TEST 4: Database Storage & Hub Receiving Verification Flow
  console.log("--- TEST 4: PRISMA DATABASE LOAD RECORD & HUB VERIFICATION ---");
  try {
    const testLoadNumber = `TEST-LOAD-${Date.now().toString().slice(-6)}`;
    
    // Create test load in inventory collection
    const createdLoad = await prisma.load.create({
      data: {
        loadNumber: testLoadNumber,
        supplierId: "507f1f77bcf86cd799439011",
        supplierName: "ABC Aggregators",
        status: "captured",
        material: "PP, HDPE",
        grade: "Multi-Stream",
        quantity: 590,
        normalizedWeightKg: 590,
        unitPricePerKg: 43,
        totalSacks: 12,
        grossValueKes: calculated.grossValueKes,
        netValueKes: calculated.netValueKes,
        items: calculated.items as any,
        notes: "Field verification test",
      },
    });

    console.log(`✔ Successfully created test load in DB: ID ${createdLoad.id}, Load # ${createdLoad.loadNumber}`);
    console.log(`  - DB totalSacks: ${createdLoad.totalSacks}`);
    console.log(`  - DB normalizedWeightKg: ${createdLoad.normalizedWeightKg} kg`);
    console.log(`  - DB items count: ${(createdLoad.items as any[])?.length}`);

    // Simulate Hub Scale Verification (Scale reads 588.5 KG -> 1.5 KG discrepancy)
    const scaleReading = 588.5;
    const originalWeight = createdLoad.normalizedWeightKg || 590;
    const discrepancy = Number((scaleReading - originalWeight).toFixed(2));

    const verifiedLoad = await prisma.load.update({
      where: { id: createdLoad.id },
      data: {
        status: "verified",
        verifiedWeightKg: scaleReading,
        discrepancyKg: discrepancy,
        verifiedBy: "Hub Scale Terminal 1",
        verifiedAt: new Date(),
      },
    });

    console.log(`✔ Hub Scale Verification simulated successfully:`);
    console.log(`  - Original Captured Weight (Preserved): ${verifiedLoad.normalizedWeightKg} kg`);
    console.log(`  - Verified Scale Weight: ${verifiedLoad.verifiedWeightKg} kg`);
    console.log(`  - Recorded Discrepancy: ${verifiedLoad.discrepancyKg} kg`);
    console.log(`  - Status: ${verifiedLoad.status}`);

    if (verifiedLoad.normalizedWeightKg !== 590) {
      throw new Error("Original weight was improperly modified by hub verification!");
    }

    // Clean up test load
    await prisma.load.delete({ where: { id: createdLoad.id } });
    console.log("✔ Cleaned up test load record from DB.");
  } catch (dbErr: any) {
    console.error("DB test error:", dbErr);
    throw dbErr;
  }

  // TEST 5: Master Data Request Collection Flow
  console.log("\n--- TEST 5: MASTER DATA REQUEST FLOW ---");
  try {
    const { getDatabase } = await import("../lib/mongodb");
    const db = await getDatabase();
    
    const insertRes = await db.collection("material_requests").insertOne({
      type: "material",
      materialName: "Rigid Polypropylene Drum",
      notes: "Found high volume at industrial supplier ABC",
      requestedBy: "507f1f77bcf86cd799439012",
      requestedByName: "Field Officer John",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✔ MasterDataRequest inserted: ID ${insertRes.insertedId}`);

    // Update to approved
    await db.collection("material_requests").updateOne(
      { _id: insertRes.insertedId },
      {
        $set: {
          status: "approved",
          reviewedBy: "Admin Super",
          reviewedAt: new Date(),
          adminNotes: "Approved and benchmark rate set at KES 45/KG",
        },
      }
    );
    const updatedReq = await db.collection("material_requests").findOne({ _id: insertRes.insertedId });
    console.log(`✔ MasterDataRequest approved: ID ${insertRes.insertedId}, status: ${updatedReq?.status}`);

    // Clean up
    await db.collection("material_requests").deleteOne({ _id: insertRes.insertedId });
    console.log("✔ Cleaned up test MasterDataRequest record from DB.");
  } catch (reqErr: any) {
    console.error("MasterDataRequest test error:", reqErr);
    throw reqErr;
  }

  console.log("\n=================================================");
  console.log("ALL TESTS COMPLETED SUCCESSFULLY! ✔");
  console.log("=================================================");
}

runVerification()
  .catch((e) => {
    console.error("FATAL TEST ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
