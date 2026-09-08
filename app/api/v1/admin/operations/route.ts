import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
} from "@/lib/api-auth";

/**
 * GET /api/v1/admin/operations
 * Comprehensive operational pipeline, metrics, exception alerts, and physical-financial reconciliation.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "accounts"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const db = await getDatabase();

    // 1. Collections query
    const loads = await db.collection("inventory").find().toArray();
    const lots = await db.collection("inventory_lots").find().toArray();
    const sortOrders = await db.collection("sorting_work_orders").find().toArray();
    const procBatches = await db.collection("processing_batches").find().toArray();
    const orders = await db.collection("customer_orders").find().toArray();
    const payments = await db.collection("payments").find().toArray();
    const fuelRecords = await db.collection("fuel_records").find().toArray();
    const shifts = await db.collection("driver_shifts").find().toArray();

    // Today's metrics
    const totalCollections = loads.length;
    const totalKgCollected = loads.reduce((acc, l) => acc + (l.normalizedWeightKg || l.quantity || 0), 0);
    const inTransitCount = loads.filter((l) => l.status === "in-transit" || l.status === "dispatched").length;
    const receivedAtDepotCount = loads.filter((l) => l.status === "RECEIVED_AT_DEPOT" || l.status === "delivered").length;

    const rawLots = lots.filter((l) => (l.stage || "RAW") === "RAW");
    const awaitingSortingKg = rawLots.reduce((acc, l) => acc + (l.availableQuantityKg || 0), 0);

    const activeSortingOrders = sortOrders.filter((s) => s.status === "IN_PROGRESS");
    const sortingInProgressKg = activeSortingOrders.reduce((acc, s) => acc + (s.inputQuantityKg || 0), 0);

    const activeProcBatches = procBatches.filter((p) => p.status === "IN_PROGRESS");
    const processingKg = activeProcBatches.reduce((acc, p) => acc + (p.inputQuantityKg || 0), 0);

    const finishedLots = lots.filter((l) => l.stage === "PROCESSED" || l.stage === "FINISHED");
    const readyForSaleKg = finishedLots.reduce((acc, l) => acc + (l.availableQuantityKg || 0), 0);

    const customerDeliveriesCount = orders.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED").length;
    const pendingSupplierPayments = payments.filter((p) => p.status === "pending" || p.status === "approved").reduce((acc, p) => acc + (p.amount || 0), 0);

    const totalFuelKes = fuelRecords.reduce((acc, f) => acc + (f.amountKes || 0), 0);
    const totalDistanceKm = shifts.reduce((acc, s) => acc + (s.distanceKm || 0), 0);

    // 9-Stage Pipeline (Section 163)
    const pipeline = [
      { id: "supplier", name: "Supplier Captured", count: loads.filter((l) => l.status === "captured" || l.status === "draft").length },
      { id: "dispatch", name: "Dispatched", count: loads.filter((l) => l.status === "assigned" || l.status === "dispatched").length },
      { id: "pickup", name: "Picked Up / In-Transit", count: loads.filter((l) => l.status === "in-transit" || l.status === "arrived" || l.status === "loaded").length },
      { id: "depot", name: "Depot Received", count: loads.filter((l) => l.status === "RECEIVED_AT_DEPOT" || l.status === "delivered").length },
      { id: "sorting", name: "Sorting", count: sortOrders.filter((s) => s.status === "IN_PROGRESS" || s.status === "PLANNED").length },
      { id: "processing", name: "Processing", count: procBatches.filter((p) => p.status === "IN_PROGRESS" || p.status === "PLANNED").length },
      { id: "ready_stock", name: "Ready Stock", count: finishedLots.filter((l) => (l.availableQuantityKg || 0) > 0).length },
      { id: "orders", name: "Customer Orders", count: orders.filter((o) => o.status === "PENDING" || o.status === "RESERVED" || o.status === "DISPATCHED").length },
      { id: "delivered", name: "Delivered", count: customerDeliveriesCount },
    ];

    // Attention Required Exceptions (Section 164)
    const exceptions: { id: string; severity: "high" | "medium" | "low"; message: string }[] = [];

    const loadsWithDiscrepancy = loads.filter((l) => (l.receivingDiscrepancyKg && Math.abs(l.receivingDiscrepancyKg) > 2) || (l.pickupDiscrepancyKg && Math.abs(l.pickupDiscrepancyKg) > 2));
    if (loadsWithDiscrepancy.length > 0) {
      exceptions.push({
        id: "receiving_discrepancies",
        severity: "medium",
        message: `${loadsWithDiscrepancy.length} Load(s) have weight discrepancies > 2 KG requiring inspection.`,
      });
    }

    const pendingPaymentsCount = payments.filter((p) => p.status === "pending").length;
    if (pendingPaymentsCount > 0) {
      exceptions.push({
        id: "pending_payments",
        severity: "high",
        message: `${pendingPaymentsCount} Supplier payment(s) pending authorization.`,
      });
    }

    const awaitingDepotCount = loads.filter((l) => l.status === "DELIVERED" && !l.receivedAt).length;
    if (awaitingDepotCount > 0) {
      exceptions.push({
        id: "awaiting_depot",
        severity: "high",
        message: `${awaitingDepotCount} Load(s) delivered by driver awaiting depot gate offload & receiving.`,
      });
    }

    const sortingWithVariance = sortOrders.filter((s) => s.varianceKg && Math.abs(s.varianceKg) > 5);
    if (sortingWithVariance.length > 0) {
      exceptions.push({
        id: "sorting_variances",
        severity: "medium",
        message: `${sortingWithVariance.length} Sorting batch(es) have unexplained variance > 5 KG.`,
      });
    }

    // Financial & Physical Reconciliation (Section 165)
    const totalKgPurchased = totalKgCollected;
    const totalSupplierPayable = loads.reduce((acc, l) => acc + (l.netValueKes || l.grossValueKes || 0), 0);
    const totalKgReceived = loads.reduce((acc, l) => acc + (l.receivedWeightKg || l.actualWeightKg || l.normalizedWeightKg || 0), 0);
    const totalKgSorted = sortOrders.filter((s) => s.status === "COMPLETED").reduce((acc, s) => acc + (s.totalOutputKg || 0), 0);
    const totalKgProcessed = procBatches.filter((p) => p.status === "COMPLETED").reduce((acc, p) => acc + (p.totalOutputKg || 0), 0);
    const totalKgSold = orders.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED").reduce((acc, o) => acc + (o.requiredQuantityKg || 0), 0);
    const totalCustomerRevenue = orders.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED").reduce((acc, o) => acc + (o.totalAmountKes || 0), 0);

    return apiSuccess({
      todayMetrics: {
        totalCollections,
        totalKgCollected: Math.round(totalKgCollected * 100) / 100,
        inTransitCount,
        receivedAtDepotCount,
        awaitingSortingKg: Math.round(awaitingSortingKg * 100) / 100,
        sortingInProgressKg: Math.round(sortingInProgressKg * 100) / 100,
        processingKg: Math.round(processingKg * 100) / 100,
        readyForSaleKg: Math.round(readyForSaleKg * 100) / 100,
        customerDeliveriesCount,
        pendingSupplierPayments: Math.round(pendingSupplierPayments * 100) / 100,
        totalFuelKes: Math.round(totalFuelKes * 100) / 100,
        totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      },
      pipeline,
      exceptions,
      reconciliation: {
        totalKgPurchased: Math.round(totalKgPurchased * 100) / 100,
        totalSupplierPayable: Math.round(totalSupplierPayable * 100) / 100,
        totalKgReceived: Math.round(totalKgReceived * 100) / 100,
        totalKgSorted: Math.round(totalKgSorted * 100) / 100,
        totalKgProcessed: Math.round(totalKgProcessed * 100) / 100,
        totalKgSold: Math.round(totalKgSold * 100) / 100,
        totalCustomerRevenue: Math.round(totalCustomerRevenue * 100) / 100,
        estimatedGrossMarginKes: Math.round((totalCustomerRevenue - totalSupplierPayable - totalFuelKes) * 100) / 100,
      },
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to fetch operations dashboard", 500);
  }
}
