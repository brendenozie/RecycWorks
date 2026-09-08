import "dotenv/config";
if (!process.env.MONGODB_URI && process.env.DATABASE_URL) {
  process.env.MONGODB_URI = process.env.DATABASE_URL;
}

import { getDatabase } from "../lib/mongodb";
import { signToken } from "../lib/auth";
import { ObjectId } from "mongodb";

const BASE_URL = "http://localhost:3000";

async function runTest() {
  console.log("=== STARTING DRIVER, PICKUP & PAYMENT WORKFLOW VERIFICATION ===");
  const db = await getDatabase();

  // 1. Setup Test Users
  console.log("\n1. Setting up test users...");
  const foUser = {
    _id: new ObjectId(),
    email: "test.fo.drivertest@recycworks.com",
    firstName: "Sarah",
    lastName: "FieldOfficer",
    role: "field_officer",
    status: "active",
    createdAt: new Date(),
  };

  const driverUser = {
    _id: new ObjectId(),
    email: "test.driver.drivertest@recycworks.com",
    firstName: "James",
    lastName: "Kamau",
    role: "driver",
    driverProfile: { vehiclePlate: "KDA 892M" },
    vehiclePlate: "KDA 892M",
    status: "active",
    createdAt: new Date(),
  };

  const adminUser = {
    _id: new ObjectId(),
    email: "test.admin.drivertest@recycworks.com",
    firstName: "Alice",
    lastName: "Admin",
    role: "admin",
    status: "active",
    isAdmin: true,
    createdAt: new Date(),
  };

  const supplierUser = {
    _id: new ObjectId(),
    email: "test.supplier.drivertest@recycworks.com",
    firstName: "Kip",
    lastName: "Aggregators",
    role: "supplier",
    phone: "+254712345678",
    status: "active",
    createdAt: new Date(),
  };

  await db.collection("users").insertMany([foUser, driverUser, adminUser, supplierUser]);

  const foToken = signToken({ userId: foUser._id.toString(), email: foUser.email, role: "field_officer" });
  const driverToken = signToken({ userId: driverUser._id.toString(), email: driverUser.email, role: "driver" });
  const adminToken = signToken({ userId: adminUser._id.toString(), email: adminUser.email, role: "admin", isAdmin: true });

  try {
    // 2. FO creates and finalizes collection
    console.log("\n2. Field Officer creates and finalizes collection...");
    const createRes = await fetch(`${BASE_URL}/api/v1/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${foToken}` },
      body: JSON.stringify({
        supplierId: supplierUser._id.toString(),
        pickupLocation: {
          county: "Nairobi",
          subCounty: "Industrial Area",
          landmark: "Near Junction Warehouse",
        },
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(`Collection create failed: ${JSON.stringify(createData)}`);
    const collectionId = createData.id;
    console.log(`✓ Collection created: ${collectionId} (${createData.loadNumber})`);

    // Add material group
    const groupRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${foToken}` },
      body: JSON.stringify({
        material: "PET",
        grade: "PET_CLEAR",
      }),
    });
    const groupData = await groupRes.json();
    if (!groupRes.ok) throw new Error(`Group create failed: ${JSON.stringify(groupData)}`);
    const groupId = groupData.id;
    console.log(`✓ Material group created: ${groupId}`);

    // Add individual sack weights
    for (const w of [42.5, 43.0, 44.5]) {
      const sackRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/groups/${groupId}/weights`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${foToken}` },
        body: JSON.stringify({ weightKg: w }),
      });
      const sackData = await sackRes.json();
      if (!sackRes.ok) throw new Error(`Sack add failed: ${JSON.stringify(sackData)}`);
    }
    console.log(`✓ Added 3 sack weights (42.5, 43.0, 44.5 kg) to group.`);

    // Finalize collection
    const finRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${foToken}` },
      body: JSON.stringify({ confirmed: true, notes: "Weighing completed and verified with supplier." }),
    });
    const finData = await finRes.json();
    if (!finRes.ok) throw new Error(`Finalize failed: ${JSON.stringify(finData)}`);
    console.log(`✓ Collection finalized: status=${finData.status}, netValueKes=${finData.netValueKes}`);

    // 3. Admin checks dispatch console
    console.log("\n3. Admin checks dispatch console...");
    const dispatchListRes = await fetch(`${BASE_URL}/api/v1/admin/dispatch`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dispatchListData = await dispatchListRes.json();
    if (!dispatchListRes.ok) throw new Error(`Dispatch list failed: ${JSON.stringify(dispatchListData)}`);
    const foundReady = dispatchListData.readyCollections.find((c: any) => c.id === collectionId);
    if (!foundReady) throw new Error(`Collection ${collectionId} not found in dispatch ready list!`);
    console.log(`✓ Dispatch console lists collection ${collectionId}. Total ready: ${dispatchListData.readyCount}`);

    // 4. Admin dispatches collection to Driver
    console.log("\n4. Admin dispatches collection to Driver...");
    const dispatchRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        driverId: driverUser._id.toString(),
        vehiclePlate: "KDA 892M",
        notes: "Pick up urgently before 4 PM.",
      }),
    });
    const dispatchData = await dispatchRes.json();
    if (!dispatchRes.ok) throw new Error(`Dispatch assign failed: ${JSON.stringify(dispatchData)}`);
    console.log(`✓ Collection dispatched: driver=${dispatchData.driverName}, status=${dispatchData.status}`);

    // 5. Driver starts shift
    console.log("\n5. Driver starts shift...");
    const startShiftRes = await fetch(`${BASE_URL}/api/v1/driver/shifts/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({
        vehiclePlate: "KDA 892M",
        startOdometer: 145200,
        startFuelPercent: 85,
        notes: "Pre-trip vehicle check passed.",
      }),
    });
    const startShiftData = await startShiftRes.json();
    if (!startShiftRes.ok) throw new Error(`Start shift failed: ${JSON.stringify(startShiftData)}`);
    const shiftId = startShiftData.shift.id;
    console.log(`✓ Driver shift started: id=${shiftId}, odo=${startShiftData.shift.startOdometer} km, nightTravel=${startShiftData.shift.nightTravel}`);

    // Check active shift endpoint
    const curShiftRes = await fetch(`${BASE_URL}/api/v1/driver/shifts/current`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    const curShiftData = await curShiftRes.json();
    if (!curShiftData.isOnShift || curShiftData.activeShift.id !== shiftId) {
      throw new Error(`Current shift mismatch: ${JSON.stringify(curShiftData)}`);
    }
    console.log(`✓ Current active shift verified via /api/v1/driver/shifts/current.`);

    // 6. Driver arrives at supplier yard
    console.log("\n6. Driver logs arrival at pickup location...");
    const arriveRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/arrive`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ notes: "Arrived at gate, supplier opening yard." }),
    });
    const arriveData = await arriveRes.json();
    if (!arriveRes.ok) throw new Error(`Arrive failed: ${JSON.stringify(arriveData)}`);
    console.log(`✓ Driver arrival recorded: status=${arriveData.status}`);

    // 7. Driver confirms pickup (Load Collected)
    console.log("\n7. Driver confirms cargo collection with proof photo & condition...");
    const collectRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({
        proofPhoto: "https://recyc-uploads.s3.amazonaws.com/proofs/load_photo_1.jpg",
        condition: "Dry, well packed in woven bags",
        discrepancyKg: 0,
        notes: "All 3 sacks loaded and secured under tarpaulin.",
      }),
    });
    const collectData = await collectRes.json();
    if (!collectRes.ok) throw new Error(`Collect failed: ${JSON.stringify(collectData)}`);
    console.log(`✓ Cargo collected: status=${collectData.status}`);

    // 8. Driver delivers cargo to Hub
    console.log("\n8. Driver delivers cargo to Hub...");
    const deliverRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/deliver`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({
        hubId: new ObjectId().toString(),
        notes: "Truck backed into Bay 2 for offloading.",
      }),
    });
    const deliverData = await deliverRes.json();
    if (!deliverRes.ok) throw new Error(`Deliver failed: ${JSON.stringify(deliverData)}`);
    console.log(`✓ Cargo delivered: status=${deliverData.status}`);

    // 9. Hub reconciles scale weight
    console.log("\n9. Hub scale operator reconciles verified weight...");
    const hubVerifyRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        verifiedWeightKg: 130.0,
        notes: "Offloaded and verified on weighbridge.",
      }),
    });
    const hubVerifyData = await hubVerifyRes.json();
    if (!hubVerifyRes.ok) throw new Error(`Hub verification failed: ${JSON.stringify(hubVerifyData)}`);
    console.log(`✓ Hub verified scale weight: verifiedWeightKg=${hubVerifyData.verifiedWeightKg}, discrepancyKg=${hubVerifyData.discrepancyKg}`);

    // 10. Admin checks payment status & approves payable
    console.log("\n10. Admin checks payment details & approves payable...");
    const payDetailsRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/payment`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const payDetailsData = await payDetailsRes.json();
    if (!payDetailsRes.ok) throw new Error(`Payment details fetch failed: ${JSON.stringify(payDetailsData)}`);
    console.log(`✓ Payment details: netPayableKes=${payDetailsData.netPayableKes}, paymentStatus=${payDetailsData.paymentStatus}`);

    const approvePayRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/payment/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const approvePayData = await approvePayRes.json();
    if (!approvePayRes.ok) throw new Error(`Payment approve failed: ${JSON.stringify(approvePayData)}`);
    console.log(`✓ Payment approved: status=${approvePayData.paymentStatus}`);

    // 11. Admin settles payment via Automated M-Pesa with Idempotency Key
    console.log("\n11. Admin settles payout via System M-Pesa (with Idempotency Key)...");
    const mpesaIdemKey = `test_mpesa_key_${Date.now()}`;
    const mpesaRes1 = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/payment/mpesa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
        "Idempotency-Key": mpesaIdemKey,
      },
      body: JSON.stringify({
        phoneNumber: "+254712345678",
      }),
    });
    const mpesaData1 = await mpesaRes1.json();
    if (!mpesaRes1.ok) throw new Error(`M-Pesa payout 1 failed: ${JSON.stringify(mpesaData1)}`);
    console.log(`✓ M-Pesa payout executed: ref=${mpesaData1.mpesaReference}, amount=${mpesaData1.amount}, paymentNo=${mpesaData1.paymentNo}`);

    // Test Idempotent replay
    const mpesaRes2 = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/payment/mpesa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
        "Idempotency-Key": mpesaIdemKey,
      },
      body: JSON.stringify({
        phoneNumber: "+254712345678",
      }),
    });
    const mpesaData2 = await mpesaRes2.json();
    if (mpesaData2.mpesaReference !== mpesaData1.mpesaReference) {
      throw new Error(`Idempotency failed! Replayed response has different ref: ${mpesaData2.mpesaReference}`);
    }
    console.log(`✓ Idempotent replay verified: returned identical reference ${mpesaData2.mpesaReference}`);

    // 12. Driver logs fuel purchase
    console.log("\n12. Driver logs fuel purchase...");
    const fuelRes = await fetch(`${BASE_URL}/api/v1/driver/fuel`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({
        vehiclePlate: "KDA 892M",
        litres: 45.5,
        amountKes: 8190,
        fuelType: "Diesel",
        station: "Shell Industrial Area",
        odometer: 145265,
        shiftId,
      }),
    });
    const fuelData = await fuelRes.json();
    if (!fuelRes.ok) throw new Error(`Fuel log failed: ${JSON.stringify(fuelData)}`);
    console.log(`✓ Fuel purchase logged: litres=${fuelData.fuelRecord.litres}, amountKes=${fuelData.fuelRecord.amountKes}`);

    // 13. Driver ends shift
    console.log("\n13. Driver ends shift with ending odometer...");
    const endShiftRes = await fetch(`${BASE_URL}/api/v1/driver/shifts/${shiftId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({
        endOdometer: 145280,
        endFuelPercent: 78,
        notes: "Completed shift, truck parked at depot.",
      }),
    });
    const endShiftData = await endShiftRes.json();
    if (!endShiftRes.ok) throw new Error(`End shift failed: ${JSON.stringify(endShiftData)}`);
    console.log(`✓ Shift ended: distanceKm=${endShiftData.shift.distanceKm} km, status=${endShiftData.shift.status}`);

    // 14. Admin verifies Command Center KPIs
    console.log("\n14. Admin verifies Command Center KPIs (/api/v1/admin/dashboard)...");
    const dashRes = await fetch(`${BASE_URL}/api/v1/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashData = await dashRes.json();
    if (!dashRes.ok) throw new Error(`Dashboard fetch failed: ${JSON.stringify(dashData)}`);
    console.log(`✓ Command Center KPIs fetched:`);
    console.log(`  - Total Collections: ${dashData.kpis.totalCollections}`);
    console.log(`  - Total Weight: ${dashData.kpis.totalWeightKg} KG`);
    console.log(`  - Supplier Payables Paid: KES ${dashData.kpis.payables.paidKes}`);
    console.log(`  - Fleet Distance: ${dashData.kpis.logistics.totalDistanceKm} KM`);
    console.log(`  - Total Fuel Cost: KES ${dashData.kpis.logistics.fuel.totalCostKes}`);
    console.log(`  - Pipeline Distribution:`, dashData.pipeline);

    console.log("\n=======================================================");
    console.log("🎉 ALL DRIVER, PICKUP & PAYMENT WORKFLOW TESTS PASSED! 🎉");
    console.log("=======================================================\n");
  } finally {
    // Cleanup test users and collections
    await db.collection("users").deleteMany({
      _id: { $in: [foUser._id, driverUser._id, adminUser._id, supplierUser._id] },
    });
  }
}

runTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
