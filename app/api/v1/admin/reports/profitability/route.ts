import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { authenticateApiUser, authorizeRoles, apiSuccess, apiError } from "@/lib/api-auth";
import { formatCurrency, formatWeight } from "@/lib/decimal";

/**
 * GET /api/v1/admin/reports/profitability
 * Authoritative Physical-Financial Performance and Gross Operational Margin Reconciliation.
 * Connects:
 *   KG Purchased  -> Supplier Material Cost
 *   KG Transported -> Logistics & Fuel Cost
 *   KG Processed   -> Machine & Processing Cost
 *   KG Sold        -> Sales Revenue
 * Calculates:
 *   Revenue - Material Cost - Logistics/Fuel Cost - Processing Cost = Gross Operational Margin
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["admin", "super_admin", "accounts", "finance", "operations"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const db = await getDatabase();

    // 1. Raw Collections & Supplier Costs
    const loads = await db.collection("inventory").find({}).toArray();
    const payments = await db.collection("payments").find({}).toArray();

    let totalKgPurchased = 0;
    let totalKgReceived = 0;
    let estimatedSupplierCostKes = 0;

    loads.forEach((l) => {
      const kg = Number(l.normalizedWeightKg || l.quantity || 0);
      const val = Number(l.netValueKes || l.grossValueKes || 0);
      totalKgPurchased += kg;
      estimatedSupplierCostKes += val;
      if (l.receivedWeightKg || l.status === "RECEIVED_AT_DEPOT" || l.status === "VERIFIED" || l.status === "delivered") {
        totalKgReceived += Number(l.receivedWeightKg || l.actualWeightKg || kg);
      }
    });

    const supplierPaymentsCompleted = payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const supplierPaymentsPending = payments
      .filter((p) => p.status === "pending" || p.status === "approved" || p.status === "initiated")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // 2. Logistics & Fuel Costs
    const fuelRecords = await db.collection("fuel_records").find({}).toArray();
    const shifts = await db.collection("driver_shifts").find({}).toArray();

    const totalFuelCostKes = fuelRecords.reduce((sum, f) => sum + Number(f.amountKes || 0), 0);
    const totalFuelLitres = fuelRecords.reduce((sum, f) => sum + Number(f.litres || 0), 0);
    const totalDistanceKm = shifts.reduce((sum, s) => sum + Number(s.distanceKm || 0), 0);

    // Completed transport trips (800 KES allowance per completed bulk trip)
    const completedTripsCount = loads.filter((l) => l.status === "delivered" || l.status === "RECEIVED_AT_DEPOT" || l.status === "VERIFIED").length;
    const driverTripAllowancesKes = completedTripsCount * 800;
    const totalLogisticsCostKes = totalFuelCostKes + driverTripAllowancesKes;

    // 3. Sorting & Processing Costs
    const procBatches = await db.collection("processing_batches").find({}).toArray();
    const completedProcBatches = procBatches.filter((p) => p.status === "COMPLETED");

    const totalKgProcessed = completedProcBatches.reduce((sum, p) => sum + Number(p.totalOutputKg || p.inputQuantityKg || 0), 0);
    // Standard industrial crushing, washing & handling cost benchmark: KES 4.50 / KG
    const processingCostPerKg = 4.5;
    const totalProcessingCostKes = Math.round(totalKgProcessed * processingCostPerKg);

    // 4. Customer Sales Orders & Revenue
    const orders = await db.collection("customer_orders").find({}).toArray();
    const completedOrders = orders.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED");

    const totalKgSold = completedOrders.reduce((sum, o) => sum + Number(o.requiredQuantityKg || 0), 0);
    const totalRevenueReceivedKes = completedOrders.reduce((sum, o) => sum + Number(o.totalAmountKes || 0), 0);
    const totalInvoicedRevenueKes = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + Number(o.totalAmountKes || 0), 0);

    // 5. Authoritative Profitability & Margin Reconciliation
    const effectiveMaterialCostKes = supplierPaymentsCompleted > 0 ? supplierPaymentsCompleted : estimatedSupplierCostKes;
    const totalOperationalCostKes = effectiveMaterialCostKes + totalLogisticsCostKes + totalProcessingCostKes;
    const grossOperationalMarginKes = totalRevenueReceivedKes - totalOperationalCostKes;
    const grossMarginPercent =
      totalRevenueReceivedKes > 0
        ? Math.round((grossOperationalMarginKes / totalRevenueReceivedKes) * 1000) / 10
        : 0;

    // Unit Economics
    const avgPurchasePricePerKg = totalKgPurchased > 0 ? Math.round((estimatedSupplierCostKes / totalKgPurchased) * 100) / 100 : 0;
    const avgSellingPricePerKg = totalKgSold > 0 ? Math.round((totalRevenueReceivedKes / totalKgSold) * 100) / 100 : 0;
    const avgTransportCostPerKg = totalKgPurchased > 0 ? Math.round((totalLogisticsCostKes / totalKgPurchased) * 100) / 100 : 0;
    const avgProcessingCostPerKg = totalKgProcessed > 0 ? Math.round((totalProcessingCostKes / totalKgProcessed) * 100) / 100 : processingCostPerKg;

    return apiSuccess({
      profitability: {
        revenue: {
          deliveredRevenueKes: formatCurrency(totalRevenueReceivedKes),
          invoicedRevenueKes: formatCurrency(totalInvoicedRevenueKes),
          totalKgSold: formatWeight(totalKgSold),
          avgSellingPricePerKg: formatCurrency(avgSellingPricePerKg),
        },
        costs: {
          materialCost: {
            actualPaidKes: formatCurrency(supplierPaymentsCompleted),
            pendingPayableKes: formatCurrency(supplierPaymentsPending),
            estimatedTotalKes: formatCurrency(estimatedSupplierCostKes),
            totalKgPurchased: formatWeight(totalKgPurchased),
            avgPurchasePricePerKg: formatCurrency(avgPurchasePricePerKg),
          },
          logisticsCost: {
            fuelCostKes: formatCurrency(totalFuelCostKes),
            driverAllowancesKes: formatCurrency(driverTripAllowancesKes),
            totalLogisticsCostKes: formatCurrency(totalLogisticsCostKes),
            fuelLitres: Math.round(totalFuelLitres * 10) / 10,
            distanceKm: Math.round(totalDistanceKm * 10) / 10,
            avgCostPerKg: formatCurrency(avgTransportCostPerKg),
          },
          processingCost: {
            totalKgProcessed: formatWeight(totalKgProcessed),
            batchesCompleted: completedProcBatches.length,
            costPerKg: formatCurrency(avgProcessingCostPerKg),
            totalProcessingCostKes: formatCurrency(totalProcessingCostKes),
          },
          totalOperationalCostKes: formatCurrency(totalOperationalCostKes),
        },
        margin: {
          grossOperationalMarginKes: formatCurrency(grossOperationalMarginKes),
          grossMarginPercent: `${grossMarginPercent}%`,
          isProfitable: grossOperationalMarginKes >= 0,
        },
        physicalReconciliation: {
          purchasedKg: formatWeight(totalKgPurchased),
          depotReceivedKg: formatWeight(totalKgReceived),
          processedKg: formatWeight(totalKgProcessed),
          soldKg: formatWeight(totalKgSold),
          retainedInventoryKg: formatWeight(Math.max(totalKgReceived - totalKgSold, 0)),
        },
      },
    });
  } catch (error: any) {
    console.error("[Profitability Engine Error]:", error);
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to calculate profitability report", 500);
  }
}
