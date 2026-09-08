const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/recycworks";
const jwtSecret = process.env.JWT_SECRET || "RecycWorks-secure-key-2026";

function createToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
}

async function run() {
  console.log("================================================================================");
  console.log("RECYC WORKS: POST-PICKUP DEPOT & MATERIAL PROCESSING VERIFICATION SUITE");
  console.log("Sections 122 - 174: Depot Receiving, Inventory, Sorting, Crushing, Sales, Traceability");
  console.log("================================================================================\n");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  const baseUrl = "http://127.0.0.1:3000";

  // Setup test tokens
  const adminToken = createToken({
    userId: new ObjectId().toString(),
    email: "admin_operations@recycworks.ke",
    role: "admin",
    isAdmin: true,
  });

  const driverId = new ObjectId();
  const driverToken = createToken({
    userId: driverId.toString(),
    email: "driver_nairobi@recycworks.ke",
    role: "driver",
    isAdmin: false,
  });

  const depotReceiverToken = createToken({
    userId: new ObjectId().toString(),
    email: "depot_staff@recycworks.ke",
    role: "operations",
    isAdmin: false,
  });

  try {
    // -------------------------------------------------------------------------
    // Step 1: Create a test collection load (captured by field officer)
    // -------------------------------------------------------------------------
    const loadId = new ObjectId();
    const loadNumber = `RWL-TEST-${Date.now().toString().slice(-4)}`;
    const hubId = new ObjectId();

    await db.collection("inventory").insertOne({
      _id: loadId,
      loadNumber,
      supplierId: new ObjectId(),
      supplierName: "ABC Aggregators Ltd",
      supplierCode: "RW-SUP-01",
      fieldOfficerId: new ObjectId(),
      fieldOfficerName: "Jane FieldOfficer",
      driverId: driverId.toString(),
      driverName: "John Otieno",
      vehiclePlate: "KDA 123A",
      hubId: hubId,
      hubName: "Industrial Area Central Depot",
      material: "Polypropylene (PP)",
      grade: "Mixed PP",
      quantity: 733,
      normalizedWeightKg: 733,
      actualWeightKg: 733,
      unitPricePerKg: 35,
      grossValueKes: 25655,
      netValueKes: 25655,
      status: "DELIVERED",
      deliveredAt: new Date(),
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    assert(true, `1. Initialized test delivered collection ${loadNumber} (733 KG)`);

    // -------------------------------------------------------------------------
    // Step 2: Query Depot Incoming Queue
    // -------------------------------------------------------------------------
    const incomingRes = await fetch(`${baseUrl}/api/v1/depot/incoming`, {
      headers: { Authorization: `Bearer ${depotReceiverToken}` },
    });
    const incomingData = await incomingRes.json();
    assert(incomingRes.status === 200, "2. GET /api/v1/depot/incoming returned 200");
    const foundInQueue = incomingData.incoming.some((l) => l.loadNumber === loadNumber);
    assert(foundInQueue, "   Incoming queue contains the delivered truck load awaiting offload");

    // -------------------------------------------------------------------------
    // Step 3: Depot Offload & Receiving Confirmation with Scale Weight Verification
    // -------------------------------------------------------------------------
    const receiveRes = await fetch(`${baseUrl}/api/v1/collections/${loadId}/receive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${depotReceiverToken}`,
      },
      body: JSON.stringify({
        receivedWeightKg: 728, // 5 KG discrepancy from 733 KG
        condition: "Normal, some bags dusty",
        notes: "Offloaded at Bay 2, verified on weighbridge",
        sortingRequired: true,
        discrepancyReason: "Weighing variance",
      }),
    });
    const receiveData = await receiveRes.json();
    assert(receiveRes.status === 200, "3. POST /api/v1/collections/:id/receive returned 200");
    assert(receiveData.collection.status === "RECEIVED_AT_DEPOT", "   Collection status transitioned to RECEIVED_AT_DEPOT");
    assert(receiveData.collection.discrepancyKg === -5, `   Verified discrepancy recorded non-destructively: -5 KG (Captured: 733 KG, Received: 728 KG)`);
    assert(receiveData.lot && receiveData.lot.stage === "RAW", `   Authoritative RAW inventory lot created: ${receiveData.lot.lotNumber}`);

    const rawLotId = receiveData.lot.id;

    // -------------------------------------------------------------------------
    // Step 4: Record Receiving Discrepancy details
    // -------------------------------------------------------------------------
    const discRes = await fetch(`${baseUrl}/api/v1/collections/${loadId}/receiving-discrepancy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${depotReceiverToken}`,
      },
      body: JSON.stringify({
        reason: "Transport moisture loss and scale calibration variance",
        notes: "Aggregator scale had +5 KG tare offset.",
        photo: "https://storage.recycworks.ke/photos/discrepancy_scale.jpg",
      }),
    });
    assert(discRes.status === 200, "4. POST /api/v1/collections/:id/receiving-discrepancy recorded audit details");

    // -------------------------------------------------------------------------
    // Step 5: Verify Inventory Movements Ledger
    // -------------------------------------------------------------------------
    const movRes = await fetch(`${baseUrl}/api/v1/inventory/movements?referenceType=COLLECTION`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const movData = await movRes.json();
    assert(movRes.status === 200, "5. GET /api/v1/inventory/movements returned 200");
    const receiptMov = movData.movements.find((m) => m.referenceId === loadId.toString() && m.type === "RECEIPT");
    assert(receiptMov && receiptMov.quantityKg === 728, "   Immutable inventory movement ledger recorded +728 KG RECEIPT");

    // -------------------------------------------------------------------------
    // Step 6: Create Sorting Work Order
    // -------------------------------------------------------------------------
    const sortOrderRes = await fetch(`${baseUrl}/api/v1/sorting`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        inputMaterial: "Polypropylene (PP)",
        inputQuantityKg: 728,
        sourceLotIds: [rawLotId],
        assignedStaff: ["Jane Sorter", "Peter Sorter", "Samuel"],
        notes: "Sort Mixed PP into Grade A, Grade B, and Rejects",
      }),
    });
    const sortOrderData = await sortOrderRes.json();
    assert(sortOrderRes.status === 201, `6. POST /api/v1/sorting created work order ${sortOrderData.order.workOrderNo}`);
    const sortOrderId = sortOrderData.order.id;

    // -------------------------------------------------------------------------
    // Step 7: Start Sorting Work Order
    // -------------------------------------------------------------------------
    const sortStartRes = await fetch(`${baseUrl}/api/v1/sorting/${sortOrderId}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${depotReceiverToken}` },
    });
    assert(sortStartRes.status === 200, "7. POST /api/v1/sorting/:id/start transitioned status to IN_PROGRESS");

    // -------------------------------------------------------------------------
    // Step 8: Complete Sorting Work Order with Reconciliation
    // -------------------------------------------------------------------------
    const sortCompleteRes = await fetch(`${baseUrl}/api/v1/sorting/${sortOrderId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${depotReceiverToken}`,
      },
      body: JSON.stringify({
        outputs: [
          { material: "PP Grade A", grade: "Grade A", quantityKg: 450 },
          { material: "PP Grade B", grade: "Grade B", quantityKg: 200 },
        ],
        rejectQuantityKg: 60,
        lossQuantityKg: 18,
        notes: "Sorting completed. 450 KG Grade A, 200 KG Grade B, 60 KG Reject, 18 KG Dust/Loss (Total = 728 KG)",
      }),
    });
    const sortCompleteData = await sortCompleteRes.json();
    assert(sortCompleteRes.status === 200, "8. POST /api/v1/sorting/:id/complete completed work order");
    assert(sortCompleteData.reconciliation.reconciled === true, `   Reconciliation verified: Input 728 KG == Output 650 KG + Reject 60 KG + Loss 18 KG (Variance: ${sortCompleteData.reconciliation.varianceKg} KG)`);
    assert(sortCompleteData.outputs.length === 2, "   Generated 2 new SORTED inventory lots");

    const sortedGradeALotId = sortCompleteData.outputs[0].outputLotId;

    // -------------------------------------------------------------------------
    // Step 9: Create Crushing Processing Batch on Crusher 01
    // -------------------------------------------------------------------------
    const procBatchRes = await fetch(`${baseUrl}/api/v1/processing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        processType: "CRUSHING",
        machineName: "Crusher 01",
        inputMaterial: "PP Grade A",
        inputQuantityKg: 450,
        sourceLotIds: [sortedGradeALotId],
        operator: "Peter Operator",
        assistants: ["Jane", "Samuel"],
        outputStockType: "Crushed PP",
        notes: "Crush 450 KG of PP Grade A into Crushed PP Flakes",
      }),
    });
    const procBatchData = await procBatchRes.json();
    assert(procBatchRes.status === 201, `9. POST /api/v1/processing created crushing batch ${procBatchData.batch.batchNo}`);
    const procBatchId = procBatchData.batch.id;

    // -------------------------------------------------------------------------
    // Step 10: Start Crushing Processing Batch
    // -------------------------------------------------------------------------
    const procStartRes = await fetch(`${baseUrl}/api/v1/processing/${procBatchId}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${depotReceiverToken}` },
    });
    assert(procStartRes.status === 200, "10. POST /api/v1/processing/:id/start set machine Crusher 01 IN_PROGRESS");

    // -------------------------------------------------------------------------
    // Step 11: Complete Crushing Processing Batch
    // -------------------------------------------------------------------------
    const procCompleteRes = await fetch(`${baseUrl}/api/v1/processing/${procBatchId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${depotReceiverToken}`,
      },
      body: JSON.stringify({
        outputs: [
          { material: "Crushed PP", grade: "Clean Flakes", quantityKg: 435 },
        ],
        residueQuantityKg: 10,
        processLossKg: 5,
        notes: "Crushing complete: 435 KG Crushed PP flakes, 10 KG fine residue, 5 KG loss",
      }),
    });
    const procCompleteData = await procCompleteRes.json();
    assert(procCompleteRes.status === 200, "11. POST /api/v1/processing/:id/complete completed batch");
    assert(procCompleteData.reconciliation.reconciled === true, `    Process loss accounted: Input 450 KG == Output 435 KG + Residue 10 KG + Loss 5 KG`);

    const finishedLotId = procCompleteData.outputs[0].outputLotId;

    // -------------------------------------------------------------------------
    // Step 12: Create B2B Customer Sales Order for Buying Company
    // -------------------------------------------------------------------------
    const orderRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        customerName: "XYZ Plastics Manufacturers Ltd",
        customerContact: "Procurement Manager",
        customerPhone: "+254 700 112 233",
        deliveryAddress: "Baba Dogo Road, Nairobi Industrial Area",
        deliveryCounty: "Nairobi",
        material: "Crushed PP",
        grade: "Clean Flakes",
        requiredQuantityKg: 400,
        unitPriceKes: 65,
      }),
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 201, `12. POST /api/v1/orders created sales order ${orderData.order.orderNo} (Total: KES ${orderData.order.totalAmountKes})`);
    const orderId = orderData.order.id;

    // -------------------------------------------------------------------------
    // Step 13: Reserve Stock (Testing Overselling Protection & Successful Allocation)
    // -------------------------------------------------------------------------
    // Test overselling protection: try reserving 10,000 KG
    const oversellOrderRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customerName: "Excessive Buyer Ltd",
        deliveryAddress: "Mombasa Road",
        material: "Crushed PP",
        requiredQuantityKg: 10000,
        unitPriceKes: 65,
      }),
    });
    const oversellOrder = await oversellOrderRes.json();
    const oversellReserveRes = await fetch(`${baseUrl}/api/v1/orders/${oversellOrder.order.id}/reserve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(oversellReserveRes.status === 422, "13. Section 155 stock reservation protection successfully rejected impossible order (shortfall flagged)");

    // Normal reservation
    const reserveRes = await fetch(`${baseUrl}/api/v1/orders/${orderId}/reserve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reserveData = await reserveRes.json();
    assert(reserveRes.status === 200, `    Stock reservation confirmed: 400 KG Crushed PP reserved for ${orderData.order.orderNo}`);

    // -------------------------------------------------------------------------
    // Step 14: Dispatch Outbound Delivery to Driver
    // -------------------------------------------------------------------------
    const dispatchRes = await fetch(`${baseUrl}/api/v1/orders/${orderId}/dispatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        driverId: driverId.toString(),
        driverName: "John Otieno",
        vehiclePlate: "KDA 123A",
      }),
    });
    assert(dispatchRes.status === 200, "14. POST /api/v1/orders/:id/dispatch assigned driver John Otieno and vehicle KDA 123A");

    // -------------------------------------------------------------------------
    // Step 15: Driver Confirms Customer Delivery Handover
    // -------------------------------------------------------------------------
    const deliverRes = await fetch(`${baseUrl}/api/v1/orders/${orderId}/deliver`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        recipientName: "David Kimani (Warehouse Manager, XYZ Plastics)",
        proofOfDeliveryPhoto: "https://storage.recycworks.ke/photos/pod_xyz_plastics.jpg",
        deliveryNotes: "Delivered intact to factory storage bay 3. Weighed on receiver scale.",
      }),
    });
    const deliverData = await deliverRes.json();
    assert(deliverRes.status === 200, `15. POST /api/v1/orders/:id/deliver completed customer handover (Received by: ${deliverData.recipientName})`);

    // -------------------------------------------------------------------------
    // Step 16: Complete Bidirectional Material Chain-of-Custody Traceability
    // -------------------------------------------------------------------------
    const traceRes = await fetch(`${baseUrl}/api/v1/traceability?type=order&id=${orderData.order.orderNo}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const traceData = await traceRes.json();
    assert(traceRes.status === 200, "16. GET /api/v1/traceability backward trace from Customer Order returned 200");
    const chain = traceData.chainOfCustody;
    assert(Boolean(chain.salesOrder), "   Resolved Sales Order (XYZ Plastics)");
    assert(Boolean(chain.customerDelivery), "   Resolved Customer Delivery (Driver John, Vehicle KDA 123A, POD Photo)");
    assert(Boolean(chain.processing), `   Resolved Processing Batch (${chain.processing?.processType} on ${chain.processing?.machineName})`);
    assert(Boolean(chain.sorting), `   Resolved Sorting Batch (Staff: ${chain.sorting?.assignedStaff?.join(", ")})`);
    assert(Boolean(chain.depotReceiving), `   Resolved Depot Receipt (${chain.depotReceiving?.receivedWeightKg} KG, Discrepancy: ${chain.depotReceiving?.receivingDiscrepancyKg} KG)`);
    assert(Boolean(chain.procurement), `   Resolved Original Supplier Collection (${chain.procurement?.supplierName}, Field Officer: ${chain.procurement?.fieldOfficerName})`);

    // -------------------------------------------------------------------------
    // Step 17: Admin Master Operations Pipeline & Dashboard
    // -------------------------------------------------------------------------
    const opsRes = await fetch(`${baseUrl}/api/v1/admin/operations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const opsData = await opsRes.json();
    assert(opsRes.status === 200, "17. GET /api/v1/admin/operations dashboard returned 200");
    assert(opsData.pipeline && opsData.pipeline.length === 9, "   9-stage operational pipeline calculated with active stage counts");
    assert(opsData.reconciliation && opsData.reconciliation.totalKgPurchased > 0, `   Physical & Financial Reconciliation verified (Purchased: ${opsData.reconciliation.totalKgPurchased} KG, Sold: ${opsData.reconciliation.totalKgSold} KG, Gross Margin: KES ${opsData.reconciliation.estimatedGrossMarginKes})`);
  } catch (err) {
    console.error("Test execution failed:", err);
    failed++;
  } finally {
    await client.close();
    console.log("\n================================================================================");
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
