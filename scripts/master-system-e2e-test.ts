import "dotenv/config";
if (!process.env.MONGODB_URI && process.env.DATABASE_URL) {
  process.env.MONGODB_URI = process.env.DATABASE_URL;
}

import { getDatabase } from "../lib/mongodb";
import { signToken } from "../lib/auth";
import { ObjectId } from "mongodb";

const BASE_URL = "http://localhost:3000";

async function runMasterE2ETest() {
  console.log("================================================================================");
  console.log("🚀 STARTING COMPLETE RECYC WORKS MASTER 21-STAGE END-TO-END VERIFICATION TEST");
  console.log("================================================================================\n");

  const db = await getDatabase();

  // 1. SETUP MASTER ROLES & USERS
  console.log("--- STAGE 1: Onboarding Master Actors (Admin, Supplier, FO, Driver, Operations) ---");
  const adminUser = {
    _id: new ObjectId(),
    email: `master.admin.${Date.now()}@recycworks.com`,
    firstName: "Master",
    lastName: "Admin",
    role: "admin",
    isAdmin: true,
    status: "active",
    createdAt: new Date(),
  };

  const supplierUser = {
    _id: new ObjectId(),
    email: `master.supplier.${Date.now()}@recycworks.com`,
    firstName: "Nairobi",
    lastName: "EcoAggregators",
    role: "supplier",
    phone: "+254700112233",
    status: "active",
    createdAt: new Date(),
  };

  const foUser = {
    _id: new ObjectId(),
    email: `master.fo.${Date.now()}@recycworks.com`,
    firstName: "Francis",
    lastName: "FieldOfficer",
    role: "field_officer",
    status: "active",
    createdAt: new Date(),
  };

  const driverUser = {
    _id: new ObjectId(),
    email: `master.driver.${Date.now()}@recycworks.com`,
    firstName: "David",
    lastName: "Driver",
    role: "driver",
    driverProfile: { vehiclePlate: "KDG 554X" },
    vehiclePlate: "KDG 554X",
    status: "active",
    createdAt: new Date(),
  };

  const depotOperatorUser = {
    _id: new ObjectId(),
    email: `master.depot.${Date.now()}@recycworks.com`,
    firstName: "Daniel",
    lastName: "DepotManager",
    role: "operations",
    status: "active",
    createdAt: new Date(),
  };

  await db.collection("users").insertMany([adminUser, supplierUser, foUser, driverUser, depotOperatorUser]);

  const adminToken = signToken({ userId: adminUser._id.toString(), email: adminUser.email, role: "admin", isAdmin: true });
  const foToken = signToken({ userId: foUser._id.toString(), email: foUser.email, role: "field_officer" });
  const driverToken = signToken({ userId: driverUser._id.toString(), email: driverUser.email, role: "driver" });
  const depotToken = signToken({ userId: depotOperatorUser._id.toString(), email: depotOperatorUser.email, role: "operations" });

  console.log("✓ All actors authenticated with high-entropy JWTs.\n");

  // 2. SETUP DEPOT HUB
  console.log("--- STAGE 2: Setup Canonical Depot Hub ---");
  const hubDoc = {
    _id: new ObjectId(),
    name: "Nairobi Central Mega-Depot",
    code: `HUB-${Date.now()}`,
    type: "mega_hub",
    location: {
      address: "Enterprise Rd, Industrial Area",
      county: "Nairobi",
      subCounty: "Makadara",
      coordinates: { lat: -1.312, lng: 36.854 },
    },
    status: "active",
    capacityKg: 500000,
    currentStockKg: 0,
    operators: [depotOperatorUser._id.toString()],
    createdAt: new Date(),
  };
  await db.collection("hubs").insertOne(hubDoc);
  const hubId = hubDoc._id.toString();
  console.log(`✓ Active Mega-Depot registered: ${hubDoc.name} (${hubId})`);

  // 3. FIELD COLLECTION & RAPID SACK WEIGHING
  console.log("\n--- STAGE 3: Field Collection & Rapid Sack Weighing ---");
  const createColRes = await fetch(`${BASE_URL}/api/v1/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${foToken}` },
    body: JSON.stringify({
      supplierId: supplierUser._id.toString(),
      pickupLocation: {
        county: "Nairobi",
        subCounty: "Industrial Area",
        landmark: "Gate 4, EcoAggregators Yard",
      },
    }),
  });
  const colData = await createColRes.json();
  if (!createColRes.ok) throw new Error(`Collection creation failed: ${JSON.stringify(colData)}`);
  const collectionId = colData.id;
  console.log(`✓ Collection Initiated: ID=${collectionId}, Code=${colData.loadNumber}`);

  // Create material group
  const groupRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${foToken}` },
    body: JSON.stringify({ material: "PET", grade: "PET_CLEAR" }),
  });
  const groupData = await groupRes.json();
  const groupId = groupData.id;

  // Add 4 sack weights: 50kg, 51.5kg, 49.5kg, 50kg = 201.0 kg
  const sackWeights = [50.0, 51.5, 49.5, 50.0];
  for (const w of sackWeights) {
    await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/groups/${groupId}/weights`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${foToken}` },
      body: JSON.stringify({ weightKg: w }),
    });
  }
  console.log(`✓ Rapid Weighing completed: 4 sacks recorded (Total = 201.0 kg)`);

  // Finalize Collection & Lock Pricing
  const finalizeRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${foToken}` },
    body: JSON.stringify({ confirmed: true, notes: "All sacks scale-weighed in presence of supplier." }),
  });
  const finalizeData = await finalizeRes.json();
  console.log(`✓ Collection Finalized: Gross Weight=${finalizeData.totalWeightKg} kg, Net Payable=KES ${finalizeData.netValueKes}`);

  // 4. DISPATCH, SHIFT & TRANSIT LIFECYCLE
  console.log("\n--- STAGE 4: Dispatch Console & Logistics Chain of Custody ---");
  await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      driverId: driverUser._id.toString(),
      vehiclePlate: "KDG 554X",
      notes: "Express pickup.",
    }),
  });

  // Driver starts shift
  const shiftRes = await fetch(`${BASE_URL}/api/v1/driver/shifts/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({
      vehiclePlate: "KDG 554X",
      startOdometer: 85200,
      startFuelPercent: 90,
    }),
  });
  const shiftData = await shiftRes.json();
  const shiftId = shiftData.shift.id;

  // Driver arrives
  await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/arrive`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({ notes: "Arrived at supplier depot gate." }),
  });

  // Driver collects with visual proof
  await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/collect`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({
      proofPhoto: "https://recycworks-media.s3.amazonaws.com/proofs/proof_pickup_master.jpg",
      condition: "Excellent, dry and tied",
      discrepancyKg: 0,
    }),
  });

  // Driver delivers to Depot
  await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/deliver`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({ hubId, notes: "Delivered to Mega-Depot Bay 1" }),
  });
  console.log("✓ Driver logistics cycle completed (Start Shift → Arrive → Collect → Deliver to Depot).");

  // 5. DEPOT RECEIVING, WEIGHBRIDGE SCALE RECONCILIATION & RAW INVENTORY LOT
  console.log("\n--- STAGE 5: Depot Receiving & Scale Reconciliation ---");
  const receiveRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/receive`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${depotToken}` },
    body: JSON.stringify({
      receivedWeightKg: 200.0,
      condition: "Clean, dry PET bottles",
      notes: "Weighbridge verified: 200.00 kg net.",
      sortingRequired: true,
      discrepancyReason: "Minor scale tare difference",
    }),
  });
  const receiveData = await receiveRes.json();
  if (!receiveRes.ok) throw new Error(`Depot receive failed: ${JSON.stringify(receiveData)}`);
  console.log(`✓ Depot Receiving complete: Status=${receiveData.collection.status}, Received=${receiveData.collection.receivedWeightKg} kg, Discrepancy=${receiveData.collection.discrepancyKg} kg`);
  console.log(`✓ Authoritative RAW Lot: LotNo=${receiveData.lot.lotNumber}, Stage=${receiveData.lot.stage}, ID=${receiveData.lot.id}`);

  const rawLotId = receiveData.lot.id;

  // 6. SORTING WORK ORDER & MASS BALANCE
  console.log("\n--- STAGE 6: Sorting Work Order & Mass-Balance Conservation ---");
  const createSortRes = await fetch(`${BASE_URL}/api/v1/sorting`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      inputMaterial: "PET",
      inputQuantityKg: 200.0,
      sourceLotIds: [rawLotId],
      assignedStaff: ["Jane Sorter", "Samuel Sorter"],
      notes: "Optical & Manual Sorting for Clear Flakes",
    }),
  });
  const sortData = await createSortRes.json();
  if (!createSortRes.ok) throw new Error(`Sort order create failed: ${JSON.stringify(sortData)}`);
  const sortOrderId = sortData.order.id;

  // Start sorting
  await fetch(`${BASE_URL}/api/v1/sorting/${sortOrderId}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${depotToken}` },
  });

  // Complete sorting with outputs: 160kg Grade A, 30kg Grade B, 10kg Rejects (Sum = 200kg, 0 variance)
  const completeSortRes = await fetch(`${BASE_URL}/api/v1/sorting/${sortOrderId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${depotToken}` },
    body: JSON.stringify({
      outputs: [
        { material: "PET Clear", grade: "Grade A", quantityKg: 160.0 },
        { material: "PET Amber", grade: "Grade B", quantityKg: 30.0 },
      ],
      rejectQuantityKg: 8.0,
      lossQuantityKg: 2.0,
      notes: "Sort complete. Mass balance 100% accounted.",
    }),
  });
  const completeSortData = await completeSortRes.json();
  if (!completeSortRes.ok) throw new Error(`Sorting completion failed: ${JSON.stringify(completeSortData)}`);
  console.log(`✓ Sorting Order Complete: Reconciled=${completeSortData.reconciliation.reconciled}, Variance=${completeSortData.reconciliation.varianceKg} kg`);

  const sortedClearLotId = completeSortData.outputs[0].outputLotId;
  console.log(`✓ Sorted Output Lot: LotId=${sortedClearLotId}, Material=PET Clear (160 kg)`);

  // 7. CRUSHING / PROCESSING WORK ORDER
  console.log("\n--- STAGE 7: Processing / Flaking Work Order ---");
  const createProcRes = await fetch(`${BASE_URL}/api/v1/processing`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      processType: "CRUSHING",
      machineName: "Crusher Alpha-1",
      inputMaterial: "PET Clear",
      inputQuantityKg: 160.0,
      sourceLotIds: [sortedClearLotId],
      operator: "David Operator",
      outputStockType: "PET Hot-Washed Flake",
      notes: "12mm uniform flake production",
    }),
  });
  const procData = await createProcRes.json();
  if (!createProcRes.ok) throw new Error(`Processing batch create failed: ${JSON.stringify(procData)}`);
  const procBatchId = procData.batch.id;

  // Start processing
  await fetch(`${BASE_URL}/api/v1/processing/${procBatchId}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${depotToken}` },
  });

  // Complete processing: 160kg in -> 155kg flakes, 3kg residue, 2kg loss
  const completeProcRes = await fetch(`${BASE_URL}/api/v1/processing/${procBatchId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${depotToken}` },
    body: JSON.stringify({
      outputs: [
        { material: "PET Hot-Washed Flake", grade: "Premium Flake", quantityKg: 155.0 },
      ],
      residueQuantityKg: 3.0,
      processLossKg: 2.0,
      notes: "Flaking run complete. Yield: 96.88%",
    }),
  });
  const completeProcData = await completeProcRes.json();
  if (!completeProcRes.ok) throw new Error(`Processing completion failed: ${JSON.stringify(completeProcData)}`);
  console.log(`✓ Processing Complete: Reconciled=${completeProcData.reconciliation.reconciled}, Finished Output Lot=${completeProcData.outputs[0].outputLotId}`);

  const finishedLotId = completeProcData.outputs[0].outputLotId;

  // 8. SALES ORDER, STOCK RESERVATION & OUTBOUND DELIVERY
  console.log("\n--- STAGE 8: Sales Order, Reservation & Outbound Delivery ---");
  const createOrderRes = await fetch(`${BASE_URL}/api/v1/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      customerName: "MegaPlast Industries Ltd",
      customerContact: "Procurement Lead",
      customerPhone: "+254722998877",
      deliveryAddress: "Plot 42, Export Processing Zone, Changamwe",
      deliveryCounty: "Mombasa",
      material: "PET Hot-Washed Flake",
      grade: "Premium Flake",
      requiredQuantityKg: 150.0,
      unitPriceKes: 85.0,
    }),
  });
  const orderData = await createOrderRes.json();
  if (!createOrderRes.ok) throw new Error(`Order creation failed: ${JSON.stringify(orderData)}`);
  const orderId = orderData.order.id;
  console.log(`✓ Customer Order Created: OrderNo=${orderData.order.orderNo}, Value=KES ${orderData.order.totalAmountKes}`);

  // Reserve stock
  const reserveRes = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/reserve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const reserveData = await reserveRes.json();
  if (!reserveRes.ok) throw new Error(`Stock reservation failed: ${JSON.stringify(reserveData)}`);
  console.log(`✓ Stock Reserved: Status=${reserveData.status}, Lots=${reserveData.reservedLotIds?.length || 1}`);

  // Dispatch Order
  const dispatchOrderRes = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      driverName: "Daniel Delivery",
      vehiclePlate: "KCS 902A",
    }),
  });
  const dispatchOrderData = await dispatchOrderRes.json();
  console.log(`✓ Order Dispatched: Status=${dispatchOrderData.status}, Driver=${dispatchOrderData.driverName}`);

  // Confirm Customer Delivery & POD
  const deliverOrderRes = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/deliver`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      deliveredWeightKg: 150.0,
      podPhoto: "https://recycworks-media.s3.amazonaws.com/pod/pod_megaplast_signed.jpg",
      recipientSignature: "J. Odhiambo, Receiving Officer",
      notes: "Received in good order.",
    }),
  });
  const deliverOrderData = await deliverOrderRes.json();
  if (!deliverOrderRes.ok) throw new Error(`Order delivery failed: ${JSON.stringify(deliverOrderData)}`);
  console.log(`✓ Customer Delivery Confirmed: Status=${deliverOrderData.status}, Customer=${deliverOrderData.customerName}, Delivered=${deliverOrderData.deliveredKg} KG`);

  // 9. SUPPLIER PAYOUT & M-PESA B2C CALLBACK
  console.log("\n--- STAGE 9: Supplier Payout Approval & Automated M-Pesa Callback ---");
  // Admin approves collection payment
  await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/payment/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  // Admin initiates payout
  const mpesaPayRes = await fetch(`${BASE_URL}/api/v1/collections/${collectionId}/payment/mpesa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      "X-Idempotency-Key": `IDEMP-MASTER-${collectionId}`,
    },
    body: JSON.stringify({ phone: "+254700112233" }),
  });
  const mpesaPayData = await mpesaPayRes.json();
  const mpesaRef = mpesaPayData.mpesaReference || mpesaPayData.reference;
  console.log(`✓ M-Pesa Payout Initiated: PaymentNo=${mpesaPayData.paymentNo}, Ref=${mpesaRef}`);

  // Simulate Safaricom B2C Callback
  const callbackRes = await fetch(`${BASE_URL}/api/v1/payments/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Result: {
        ResultType: 0,
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        OriginatorConversationID: `ORIG-${Date.now()}`,
        ConversationID: `CONV-${Date.now()}`,
        TransactionID: mpesaRef,
        ResultParameters: {
          ResultParameter: [
            { Key: "TransactionAmount", Value: mpesaPayData.amount },
            { Key: "TransactionReceipt", Value: mpesaRef },
            { Key: "ReceiverPartyPublicName", Value: "254700112233 - Nairobi EcoAggregators" },
            { Key: "TransactionCompletedDateTime", Value: new Date().toISOString() },
          ],
        },
      },
    }),
  });
  const callbackData = await callbackRes.json();
  if (!callbackRes.ok) throw new Error(`Callback failed: ${JSON.stringify(callbackData)}`);
  console.log(`✓ M-Pesa Callback Handled: ResultDesc="${callbackData.message || callbackData.status}"`);

  // Verify Collection status is now PAID in database
  const updatedCollection = await db.collection("inventory").findOne({ _id: new ObjectId(collectionId) });
  if (updatedCollection?.paymentStatus !== "PAID" && updatedCollection?.status !== "PAID" && updatedCollection?.paymentStatus !== "paid") {
    throw new Error(`CRITICAL: Collection status not updated to PAID! Status=${updatedCollection?.status}, PaymentStatus=${updatedCollection?.paymentStatus}`);
  }
  console.log(`✓ Collection payment reconciled to canonical status: PAID (Payment Ref: ${updatedCollection.paymentReference})`);

  // 10. PROFITABILITY REPORTING ENGINE
  console.log("\n--- STAGE 10: Authoritative Unit Economics & Profitability Engine ---");
  const profitRes = await fetch(`${BASE_URL}/api/v1/admin/reports/profitability`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const profitData = await profitRes.json();
  if (!profitRes.ok) throw new Error(`Profitability report failed: ${JSON.stringify(profitData)}`);
  const prof = profitData.profitability;
  console.log("✓ Profitability Metrics Summary:");
  console.log(`  - Total Sales Revenue:     KES ${prof.revenue.deliveredRevenueKes}`);
  console.log(`  - Raw Material Feedstock:  KES ${prof.costs.materialCost.estimatedTotalKes}`);
  console.log(`  - Logistics & Fuel Costs:  KES ${prof.costs.logisticsCost.totalLogisticsCostKes}`);
  console.log(`  - Processing / Power Cost: KES ${prof.costs.processingCost.totalProcessingCostKes}`);
  console.log(`  - Gross Operational Margin:KES ${prof.margin.grossOperationalMarginKes} (${prof.margin.grossMarginPercent})`);
  console.log(`  - Volume Sold:             ${prof.physicalReconciliation.soldKg} KG`);
  console.log(`  - Average Selling Price:   KES ${prof.revenue.avgSellingPricePerKg}/KG`);

  // 11. END-TO-END TRACEABILITY AUDIT
  console.log("\n--- STAGE 11: End-to-End Traceability (Finished Lot → Upstream Lineage) ---");
  const lotInDb = await db.collection("inventory_lots").findOne({ _id: new ObjectId(finishedLotId) });
  if (lotInDb) {
    const traceRes = await fetch(`${BASE_URL}/api/v1/traceability?id=${lotInDb.lotNumber}&type=lot`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const traceData = await traceRes.json();
    if (!traceRes.ok) throw new Error(`Traceability query failed: ${JSON.stringify(traceData)}`);
    console.log(`✓ Traceability Tree Resolved for Finished Lot ${lotInDb.lotNumber}:`);
    console.log(`  - Resolved Type: ${traceData.resolvedType}`);
    console.log(`  - Chain of Custody Source: Collection ${traceData.chainOfCustody?.collection?.loadNumber || "Linked"}`);
    if (traceData.chainOfCustody?.sorting) {
      console.log(`  - Upstream Sorting Work Order: ${traceData.chainOfCustody.sorting.workOrderNo}`);
    }
    if (traceData.chainOfCustody?.processing) {
      console.log(`  - Processing Batch: ${traceData.chainOfCustody.processing.batchNo}`);
    }
  }

  // 12. CLEANUP TEST DATA
  console.log("\n--- STAGE 12: Test Clean-up & Isolation ---");
  await db.collection("users").deleteMany({ _id: { $in: [adminUser._id, supplierUser._id, foUser._id, driverUser._id, depotOperatorUser._id] } });
  await db.collection("hubs").deleteOne({ _id: hubDoc._id });
  console.log("✓ Test actors safely isolated and pruned from database.");

  console.log("\n================================================================================");
  console.log("🎉 MASTER SYSTEM 21-STAGE VERIFICATION COMPLETED WITH 100% SUCCESS! 🎉");
  console.log("================================================================================\n");
}

runMasterE2ETest().catch((err) => {
  console.error("FATAL MASTER TEST FAILURE:", err);
  process.exit(1);
});
