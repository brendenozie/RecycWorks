import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
} from "@/lib/api-auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/depot/incoming
 * Lists loads that are dispatched, in-transit, or delivered at depot, awaiting receiving confirmation.
 * Query params: hubId, status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "hub-manager", "driver"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hubId");
    const statusParam = searchParams.get("status");

    const db = await getDatabase();

    const query: any = {};
    if (hubId) {
      if (ObjectId.isValid(hubId)) {
        query.$or = [{ hubId }, { hubId: new ObjectId(hubId) }];
      } else {
        query.hubId = hubId;
      }
    }

    if (statusParam) {
      query.status = statusParam;
    } else {
      query.status = { $in: ["dispatched", "in-transit", "DELIVERED", "delivered", "RECEIVED_AT_DEPOT"] };
    }

    const loads = await db
      .collection("inventory")
      .find(query)
      .sort({ updatedAt: -1, timestamp: -1 })
      .limit(100)
      .toArray();

    const mapped = loads.map((l: any) => ({
      id: l._id.toString(),
      loadNumber: l.loadNumber || `RWL-${l._id.toString().slice(-6)}`,
      status: l.status,
      supplierName: l.supplierName || "Aggregator",
      driverName: l.driverName || "Assigned Driver",
      vehiclePlate: l.vehiclePlate || l.assignedVehiclePlate || "KDA 892M",
      hubId: l.hubId ? l.hubId.toString() : null,
      hubName: l.hubName || "Central Depot",
      material: l.material,
      grade: l.grade,
      capturedWeightKg: l.normalizedWeightKg || l.quantity || 0,
      collectedWeightKg: l.actualWeightKg || l.normalizedWeightKg || l.quantity || 0,
      receivedWeightKg: l.receivedWeightKg || null,
      receivingDiscrepancyKg: l.receivingDiscrepancyKg ?? null,
      receivingDiscrepancyReason: l.receivingDiscrepancyReason || null,
      totalSacks: l.totalSacks || (l.items ? l.items.length : 1),
      items: l.items || [],
      nightTravel: Boolean(l.nightTravel),
      dispatchedAt: l.dispatchedAt || null,
      arrivedAt: l.arrivedAt || null,
      deliveredAt: l.deliveredAt || null,
      receivedAt: l.receivedAt || null,
      receivedBy: l.receivedBy || null,
      sortingRequired: Boolean(l.sortingRequired),
      sortingStatus: l.sortingStatus || "not_required",
      processingStatus: l.processingStatus || "none",
    }));

    return apiSuccess({
      total: mapped.length,
      incoming: mapped.filter((m) => m.status !== "RECEIVED_AT_DEPOT"),
      receivedToday: mapped.filter((m) => m.status === "RECEIVED_AT_DEPOT"),
      loads: mapped,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to fetch incoming depot loads", 500);
  }
}
