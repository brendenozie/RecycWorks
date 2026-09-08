import "dotenv/config";
if (!process.env.MONGODB_URI && process.env.DATABASE_URL) {
  process.env.MONGODB_URI = process.env.DATABASE_URL;
}

import { generateToken } from "../lib/auth";
import { toWeight, sumWeights, calculateItemValue, formatWeight, formatCurrency } from "../lib/decimal";
import { getDatabase } from "../lib/mongodb";
import { ObjectId } from "mongodb";

// Mock NextRequest dispatcher or direct route caller
import { POST as createCollection, GET as listCollections } from "../app/api/v1/collections/route";
import { GET as getCollection, DELETE as cancelCollection } from "../app/api/v1/collections/[id]/route";
import { POST as createGroup } from "../app/api/v1/collections/[id]/groups/route";
import { POST as addWeight, GET as listWeights } from "../app/api/v1/collections/[id]/groups/[groupId]/weights/route";
import { PATCH as editWeight, DELETE as deleteWeight } from "../app/api/v1/collections/[id]/groups/[groupId]/weights/[weightId]/route";
import { POST as finalizeCollection } from "../app/api/v1/collections/[id]/finalize/route";
import { POST as assignDriver } from "../app/api/v1/collections/[id]/assign-driver/route";
import { POST as driverArrive } from "../app/api/v1/collections/[id]/arrive/route";
import { POST as driverCollect } from "../app/api/v1/collections/[id]/collect/route";
import { POST as driverDeliver } from "../app/api/v1/collections/[id]/deliver/route";
import { POST as hubComplete } from "../app/api/v1/collections/[id]/complete/route";
import { POST as createPricing } from "../app/api/v1/pricing/route";
import { POST as createMaterial } from "../app/api/v1/materials/route";
import { GET as getSupplier } from "../app/api/v1/suppliers/[id]/route";

import { NextRequest } from "next/server";

// Helper to construct simulated NextRequests
function makeRequest(
  url: string,
  method: string,
  token?: string,
  body?: any,
  headers?: Record<string, string>
): NextRequest {
  const allHeaders: Record<string, string> = {
    "content-type": "application/json",
    ...(headers || {}),
  };
  if (token) {
    allHeaders["authorization"] = `Bearer ${token}`;
  }

  return new NextRequest(url, {
    method,
    headers: allHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function runApiVerification() {
  console.log("==========================================================");
  console.log("RECY C WORKS — V1 REST API COMPREHENSIVE VERIFICATION");
  console.log("==========================================================\n");

  const db = await getDatabase();

  // Setup Test Users with specific roles
  const testOfficerId = new ObjectId().toString();
  const testOfficerToken = generateToken(testOfficerId, "officer_ken@recycworks.ke", "field_officer", false);

  const testAdminId = new ObjectId().toString();
  const testAdminToken = generateToken(testAdminId, "super_admin@recycworks.ke", "super_admin", true);

  const testDriverId = new ObjectId().toString();
  const testDriverToken = generateToken(testDriverId, "driver_alex@recycworks.ke", "driver", false);

  const testSupplier1Id = new ObjectId().toString();
  const testSupplier1Token = generateToken(testSupplier1Id, "supplier1@recycworks.ke", "supplier", false);

  const testSupplier2Id = new ObjectId().toString();
  const testSupplier2Token = generateToken(testSupplier2Id, "supplier2@recycworks.ke", "supplier", false);

  // Ensure test supplier exists in database
  await db.collection("users").insertOne({
    _id: new ObjectId(testSupplier1Id),
    email: "supplier1@recycworks.ke",
    firstName: "ABC",
    lastName: "Aggregators",
    businessName: "ABC Aggregators",
    role: "supplier",
    phoneNumber: "+254711000111",
    status: "active",
    createdAt: new Date(),
  });

  // Ensure driver exists
  await db.collection("users").insertOne({
    _id: new ObjectId(testDriverId),
    email: "driver_alex@recycworks.ke",
    firstName: "Alex",
    lastName: "Kamau",
    role: "driver",
    vehiclePlate: "KCD 123X",
    status: "active",
    createdAt: new Date(),
  });

  let createdCollectionId = "";
  let group1Id = "";
  let group2Id = "";
  let firstWeightId = "";

  try {
    // -------------------------------------------------------------
    // PART 1: SECTION 91 CRITICAL END-TO-END WORKFLOW
    // -------------------------------------------------------------
    console.log("--- PART 1: SECTION 91 END-TO-END WORKFLOW ---");

    // 1. POST /collections
    const colReq = makeRequest(
      "http://localhost:3000/api/v1/collections",
      "POST",
      testOfficerToken,
      { supplierId: testSupplier1Id }
    );
    const colRes = await createCollection(colReq);
    const colData = await colRes.json();
    console.log(`1. Created Collection: status ${colRes.status}, ID: ${colData.id}, Load#: ${colData.loadNumber}`);
    if (colRes.status !== 201 || !colData.id) throw new Error("Failed to create collection");
    createdCollectionId = colData.id;

    // 2. POST /collections/:id/groups (Group 1: PP / Grade A)
    const grp1Req = makeRequest(
      `http://localhost:3000/api/v1/collections/${createdCollectionId}/groups`,
      "POST",
      testOfficerToken,
      { material: "Polypropylene (PP)", grade: "Injection Grade (Chairs, Basins)" }
    );
    const grp1Res = await createGroup(grp1Req, { params: Promise.resolve({ id: createdCollectionId }) });
    const grp1Data = await grp1Res.json();
    group1Id = grp1Data.id;
    console.log(`2. Added Group 1: status ${grp1Res.status}, Group ID: ${group1Id}`);
    if (grp1Res.status !== 201) throw new Error("Failed to add Group 1");

    // 3. POST weights for Group 1: 48, 51, 49, 52 KG
    const group1Weights = [48, 51, 49, 52];
    for (let i = 0; i < group1Weights.length; i++) {
      const w = group1Weights[i];
      const wReq = makeRequest(
        `http://localhost:3000/api/v1/collections/${createdCollectionId}/groups/${group1Id}/weights`,
        "POST",
        testOfficerToken,
        { weightKg: w },
        { "idempotency-key": `idemp-g1-s${i + 1}-${Date.now()}` }
      );
      const wRes = await addWeight(wReq, {
        params: Promise.resolve({ id: createdCollectionId, groupId: group1Id }),
      });
      const wData = await wRes.json();
      if (i === 0) firstWeightId = wData.weight.id;
      console.log(`   - Added Sack ${i + 1}: ${w} KG -> Group total: ${wData.group.totalWeightKg} KG (${wData.group.sackCount} sacks)`);
      if (wRes.status !== 201) throw new Error(`Failed to add weight ${w}`);
    }

    // 4. POST /collections/:id/groups (Group 2: PP / Grade B)
    const grp2Req = makeRequest(
      `http://localhost:3000/api/v1/collections/${createdCollectionId}/groups`,
      "POST",
      testOfficerToken,
      { material: "Polypropylene (PP)", grade: "Woven Bag Scrap" }
    );
    const grp2Res = await createGroup(grp2Req, { params: Promise.resolve({ id: createdCollectionId }) });
    const grp2Data = await grp2Res.json();
    group2Id = grp2Data.id;
    console.log(`4. Added Group 2: status ${grp2Res.status}, Group ID: ${group2Id}`);
    if (grp2Res.status !== 201) throw new Error("Failed to add Group 2");

    // 5. POST weights for Group 2: 46, 49 KG
    const group2Weights = [46, 49];
    for (let i = 0; i < group2Weights.length; i++) {
      const w = group2Weights[i];
      const wReq = makeRequest(
        `http://localhost:3000/api/v1/collections/${createdCollectionId}/groups/${group2Id}/weights`,
        "POST",
        testOfficerToken,
        { weightKg: w },
        { "idempotency-key": `idemp-g2-s${i + 1}-${Date.now()}` }
      );
      const wRes = await addWeight(wReq, {
        params: Promise.resolve({ id: createdCollectionId, groupId: group2Id }),
      });
      const wData = await wRes.json();
      console.log(`   - Added Sack ${i + 1}: ${w} KG -> Collection total: ${wData.collection.totalWeightKg} KG (${wData.collection.totalSackCount} sacks)`);
      if (wRes.status !== 201) throw new Error(`Failed to add weight ${w}`);
    }

    // 6. POST /collections/:id/finalize
    const finReq = makeRequest(
      `http://localhost:3000/api/v1/collections/${createdCollectionId}/finalize`,
      "POST",
      testOfficerToken,
      { confirmed: true }
    );
    const finRes = await finalizeCollection(finReq, { params: Promise.resolve({ id: createdCollectionId }) });
    const finData = await finRes.json();
    console.log(`6. Finalized Collection: status ${finRes.status}, Status: ${finData.status}`);
    console.log(`   - Final Total Sacks: ${finData.totalSackCount} (Expected: 6)`);
    console.log(`   - Final Total Weight: ${finData.totalWeightKg} KG (Expected: 295.000 KG)`);
    console.log(`   - Group 1 Total: ${finData.groups[0].totalWeightKg} KG (Expected: 200.000 KG)`);
    console.log(`   - Group 2 Total: ${finData.groups[1].totalWeightKg} KG (Expected: 95.000 KG)`);

    if (finData.totalSackCount !== 6) throw new Error(`Expected 6 sacks, got ${finData.totalSackCount}`);
    if (finData.totalWeightKg !== "295.000") throw new Error(`Expected 295.000 KG, got ${finData.totalWeightKg}`);
    console.log("✔ Section 91 end-to-end workflow successfully verified!\n");

    // -------------------------------------------------------------
    // PART 2: IDEMPOTENCY REPLAY TEST
    // -------------------------------------------------------------
    console.log("--- PART 2: IDEMPOTENCY REPLAY TEST ---");
    // Create a scratch collection to test idempotency replay
    const col2Req = makeRequest(
      "http://localhost:3000/api/v1/collections",
      "POST",
      testOfficerToken,
      { supplierId: testSupplier1Id }
    );
    const col2Res = await createCollection(col2Req);
    const col2Data = await col2Res.json();

    const gReq = makeRequest(
      `http://localhost:3000/api/v1/collections/${col2Data.id}/groups`,
      "POST",
      testOfficerToken,
      { material: "Rigid HDPE", grade: "Standard Regrind" }
    );
    const gRes = await createGroup(gReq, { params: Promise.resolve({ id: col2Data.id }) });
    const gData = await gRes.json();

    const fixedIdempKey = `test-idemp-key-${Date.now()}`;
    // First weight call
    const firstCall = await addWeight(
      makeRequest(
        `http://localhost:3000/api/v1/collections/${col2Data.id}/groups/${gData.id}/weights`,
        "POST",
        testOfficerToken,
        { weightKg: 55 },
        { "idempotency-key": fixedIdempKey }
      ),
      { params: Promise.resolve({ id: col2Data.id, groupId: gData.id }) }
    );
    const firstData = await firstCall.json();

    // Replay with identical key
    const replayCall = await addWeight(
      makeRequest(
        `http://localhost:3000/api/v1/collections/${col2Data.id}/groups/${gData.id}/weights`,
        "POST",
        testOfficerToken,
        { weightKg: 55 },
        { "idempotency-key": fixedIdempKey }
      ),
      { params: Promise.resolve({ id: col2Data.id, groupId: gData.id }) }
    );
    const replayData = await replayCall.json();

    console.log(`Original response status: ${firstCall.status}, Weight ID: ${firstData.weight.id}`);
    console.log(`Replay response status: ${replayCall.status}, Weight ID: ${replayData.weight.id}`);
    console.log(`Collection sack count after replay: ${replayData.collection.totalSackCount}`);

    if (replayData.weight.id !== firstData.weight.id || replayData.collection.totalSackCount !== 1) {
      throw new Error("Idempotency failed: duplicated record created on replayed key");
    }
    console.log("✔ Idempotency successfully verified (zero duplicate sacks created).\n");
    await db.collection("inventory").deleteOne({ _id: new ObjectId(col2Data.id) });

    // -------------------------------------------------------------
    // PART 3: SECTION 80 AUTHORIZATION MATRIX ENFORCEMENT
    // -------------------------------------------------------------
    console.log("--- PART 3: AUTHORIZATION MATRIX TESTS ---");

    // 1. Field Officer attempting Pricing POST -> MUST BE 403
    const foPricingReq = makeRequest(
      "http://localhost:3000/api/v1/pricing",
      "POST",
      testOfficerToken,
      { material: "PP", grade: "Grade A", pricePerKg: 100 }
    );
    const foPricingRes = await createPricing(foPricingReq);
    console.log(`1. Field Officer setting price: status ${foPricingRes.status} (Expected: 403)`);
    if (foPricingRes.status !== 403) throw new Error("Security breach: Field officer allowed to set price!");

    // 2. Driver attempting Material POST -> MUST BE 403
    const driverMatReq = makeRequest(
      "http://localhost:3000/api/v1/materials",
      "POST",
      testDriverToken,
      { name: "Unauthorized Material" }
    );
    const driverMatRes = await createMaterial(driverMatReq);
    console.log(`2. Driver creating material: status ${driverMatRes.status} (Expected: 403)`);
    if (driverMatRes.status !== 403) throw new Error("Security breach: Driver allowed to create material!");

    // 3. Anonymous caller without token -> MUST BE 401
    const anonReq = makeRequest("http://localhost:3000/api/v1/collections", "GET");
    const anonRes = await listCollections(anonReq);
    console.log(`3. Anonymous request: status ${anonRes.status} (Expected: 401)`);
    if (anonRes.status !== 401) throw new Error("Security breach: Anonymous request allowed!");

    // 4. Supplier 2 attempting to view Supplier 1 profile -> MUST BE 403 (Section 81 Data Isolation)
    const supAccessReq = makeRequest(
      `http://localhost:3000/api/v1/suppliers/${testSupplier1Id}`,
      "GET",
      testSupplier2Token
    );
    const supAccessRes = await getSupplier(supAccessReq, { params: Promise.resolve({ id: testSupplier1Id }) });
    console.log(`4. Supplier accessing other supplier: status ${supAccessRes.status} (Expected: 403)`);
    if (supAccessRes.status !== 403) throw new Error("Security breach: Supplier accessed another supplier's data!");

    // 5. Attempting to edit sack weight on finalized collection -> MUST BE 403
    const editFinReq = makeRequest(
      `http://localhost:3000/api/v1/collections/${createdCollectionId}/groups/${group1Id}/weights/${firstWeightId}`,
      "PATCH",
      testOfficerToken,
      { weightKg: 99 }
    );
    const editFinRes = await editWeight(editFinReq, {
      params: Promise.resolve({ id: createdCollectionId, groupId: group1Id, weightId: firstWeightId }),
    });
    console.log(`5. Editing finalized sack weight: status ${editFinRes.status} (Expected: 403)`);
    if (editFinRes.status !== 403) throw new Error("Integrity breach: Finalized sack weight was editable!");

    console.log("✔ Authorization Matrix & Data Isolation successfully verified!\n");

    // -------------------------------------------------------------
    // PART 4: LOGISTICS LIFECYCLE PROGRESSION
    // -------------------------------------------------------------
    console.log("--- PART 4: LOGISTICS LIFECYCLE PROGRESSION ---");

    // 1. Assign driver
    const assignReq = makeRequest(
      `http://localhost:3000/api/v1/collections/${createdCollectionId}/assign-driver`,
      "POST",
      testAdminToken,
      { driverId: testDriverId }
    );
    const assignRes = await assignDriver(assignReq, { params: Promise.resolve({ id: createdCollectionId }) });
    const assignData = await assignRes.json();
    console.log(`1. Driver assigned: status ${assignRes.status}, Driver: ${assignData.driver?.name}`);

    // 2. Driver Arrive
    const arriveReq = makeRequest(
      `http://localhost:3000/api/v1/collections/${createdCollectionId}/arrive`,
      "POST",
      testDriverToken
    );
    const arriveRes = await driverArrive(arriveReq, { params: Promise.resolve({ id: createdCollectionId }) });
    console.log(`2. Driver arrived: status ${arriveRes.status}`);

    // 3. Driver Collect
    const collectReq = makeRequest(
      `http://localhost:3000/api/v1/collections/${createdCollectionId}/collect`,
      "POST",
      testDriverToken,
      { proofPhoto: "https://photos.recycworks.ke/p1.jpg" }
    );
    const collectRes = await driverCollect(collectReq, { params: Promise.resolve({ id: createdCollectionId }) });
    console.log(`3. Cargo in transit: status ${collectRes.status}`);

    // 4. Driver Deliver
    const deliverReq = makeRequest(
      `http://localhost:3000/api/v1/collections/${createdCollectionId}/deliver`,
      "POST",
      testDriverToken
    );
    const deliverRes = await driverDeliver(deliverReq, { params: Promise.resolve({ id: createdCollectionId }) });
    console.log(`4. Cargo delivered to Hub: status ${deliverRes.status}`);

    // 5. Hub Complete with Verified Scale Weight (294.000 KG -> -1.000 KG discrepancy)
    const hubReq = makeRequest(
      `http://localhost:3000/api/v1/collections/${createdCollectionId}/complete`,
      "POST",
      testAdminToken,
      { scaleWeightKg: 294 }
    );
    const hubRes = await hubComplete(hubReq, { params: Promise.resolve({ id: createdCollectionId }) });
    const hubData = await hubRes.json();
    console.log(`5. Hub Scale Verified: status ${hubRes.status}`);
    console.log(`   - Original Field Weight (Preserved): ${hubData.capturedWeightKg} KG`);
    console.log(`   - Verified Scale Weight: ${hubData.verifiedWeightKg} KG`);
    console.log(`   - Recorded Discrepancy: ${hubData.discrepancyKg} KG`);
    console.log(`   - Status: ${hubData.status}`);

    if (hubData.capturedWeightKg !== "295.000" || hubData.discrepancyKg !== "-1.000") {
      throw new Error("Hub verification discrepancy calculation error");
    }
    console.log("✔ Logistics lifecycle progression verified!\n");

    console.log("==========================================================");
    console.log("ALL V1 API TESTS COMPLETED AND PASSED WITH 100% SUCCESS! ✔");
    console.log("==========================================================");
  } finally {
    // Clean up test records
    if (createdCollectionId) {
      await db.collection("inventory").deleteOne({ _id: new ObjectId(createdCollectionId) });
    }
    await db.collection("users").deleteOne({ _id: new ObjectId(testSupplier1Id) });
    await db.collection("users").deleteOne({ _id: new ObjectId(testDriverId) });
    await db.collection("idempotency_keys").deleteMany({});
  }
}

runApiVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("TEST SUITE FAILED:", err);
    process.exit(1);
  });
