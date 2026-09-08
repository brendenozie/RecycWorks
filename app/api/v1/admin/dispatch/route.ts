import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
} from "@/lib/api-auth";
import { formatWeight, formatCurrency } from "@/lib/decimal";

/**
 * GET /api/v1/admin/dispatch
 * Fetches dispatch console data: ready collections, available drivers, fleet vehicles, and hubs.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["admin", "super_admin", "operations"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const db = await getDatabase();

    // 1. Ready collections (status "captured", "finalized", "READY_FOR_COLLECTION", etc.)
    const readyStatuses = [
      "captured",
      "finalized",
      "ready_for_collection",
      "CAPTURED",
      "FINALIZED",
      "READY_FOR_COLLECTION",
    ];
    const rawCollections = await db
      .collection("inventory")
      .find({
        status: { $in: readyStatuses },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const readyCollections = rawCollections.map((col) => {
      const items = Array.isArray(col.items) ? col.items : [];
      let totalSacks = Number(col.totalSacks || 0);
      if (totalSacks === 0 && items.length > 0) {
        totalSacks = items.reduce((acc, g) => acc + (Number(g.sackCount) || (Array.isArray(g.sacks) ? g.sacks.length : 0)), 0);
      }

      return {
        id: col._id.toString(),
        loadNumber: col.loadNumber || `RWL-${col._id.toString().slice(-6).toUpperCase()}`,
        status: (col.status || "CAPTURED").toUpperCase(),
        supplier: {
          id: col.supplierId ? col.supplierId.toString() : "",
          name: col.supplierName || "Unknown Supplier",
          code: col.supplierCode || "",
          phone: col.supplierPhone || "",
        },
        material: col.material || (items[0]?.material) || "Mixed Recyclables",
        grade: col.grade || (items[0]?.grade) || "Standard",
        totalSacks,
        normalizedWeightKg: formatWeight(col.normalizedWeightKg || col.quantity || 0),
        estimatedValueKes: formatCurrency(col.netValueKes || col.grossValueKes || 0),
        pickupLocation: col.pickupLocation || {
          county: col.county || "Nairobi",
          subCounty: col.subCounty || "",
          landmark: col.pickupAddress || "",
        },
        fieldOfficer: {
          id: col.fieldOfficerId ? col.fieldOfficerId.toString() : "",
          name: col.fieldOfficerName || "Field Officer",
        },
        createdAt: col.createdAt || col.timestamp,
      };
    });

    // 2. Active drivers & check their current shift
    const drivers = await db
      .collection("users")
      .find({ role: "driver", status: { $ne: "suspended" } })
      .project({ passwordHash: 0 })
      .toArray();

    // Check active shifts for these drivers
    const activeShifts = await db
      .collection("driver_shifts")
      .find({ status: "active" })
      .toArray();

    const shiftMap = new Map<string, any>();
    activeShifts.forEach((s) => {
      shiftMap.set(s.driverId?.toString(), s);
    });

    const availableDrivers = drivers.map((d) => {
      const activeShift = shiftMap.get(d._id.toString());
      return {
        id: d._id.toString(),
        name: `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.name || "Driver",
        phone: d.phone || d.phoneNumber || "",
        email: d.email || "",
        currentVehiclePlate: activeShift?.vehiclePlate || d.driverProfile?.vehiclePlate || d.vehiclePlate || null,
        isOnShift: !!activeShift,
        shiftStartedAt: activeShift?.startedAt || null,
      };
    });

    // 3. Vehicles
    const rawVehicles = await db
      .collection("vehicles")
      .find({})
      .sort({ plate: 1 })
      .toArray();

    const availableVehicles = rawVehicles.map((v) => ({
      id: v._id.toString(),
      plate: v.plate,
      makeModel: v.makeModel || "Truck",
      capacityTonnes: v.capacity || 5,
      status: v.status || "Available",
      assignedDriver: v.driver?.name || null,
      location: v.location || "Nairobi",
    }));

    // 4. Hubs
    const rawHubs = await db
      .collection("hubs")
      .find({})
      .sort({ name: 1 })
      .toArray();

    const hubs = rawHubs.map((h) => ({
      id: h._id.toString(),
      name: h.name,
      code: h.code || `HUB-${h._id.toString().slice(-4).toUpperCase()}`,
      county: h.county || "Nairobi",
      subCounty: h.subCounty || "",
      address: h.physicalAddress || "",
    }));

    return apiSuccess({
      readyCollections,
      readyCount: readyCollections.length,
      availableDrivers,
      availableVehicles,
      hubs,
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch dispatch data", 500);
  }
}
