import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { isNightTime } from "@/lib/night-travel";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/driver/shifts/start
 * Starts a new driver shift, recording vehicle, starting odometer, fuel, and night travel flag.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["driver", "admin", "super_admin", "operations"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const { vehiclePlate, startOdometer, startFuelPercent, notes, driverId: targetDriverId } = body;

    // Determine target driver ID (drivers can only start their own; admins can start on behalf)
    const effectiveDriverId = user!.role === "driver" ? user!.userId : (targetDriverId || user!.userId);

    if (!vehiclePlate || !vehiclePlate.trim()) {
      return apiError("VALIDATION_ERROR", "Vehicle plate is required.", 422, "vehiclePlate");
    }

    const odo = Number(startOdometer);
    if (isNaN(odo) || odo < 0) {
      return apiError("VALIDATION_ERROR", "A valid starting odometer reading is required.", 422, "startOdometer");
    }

    const db = await getDatabase();

    // Check if an active shift is already running for this driver
    const activeShift = await db.collection("driver_shifts").findOne({
      driverId: new ObjectId(effectiveDriverId),
      status: "active",
    });

    if (activeShift) {
      return apiError(
        "ALREADY_ACTIVE_SHIFT",
        `Driver already has an active shift (#${activeShift._id.toString().slice(-6).toUpperCase()}) started at ${new Date(activeShift.startedAt).toLocaleTimeString()}. End the current shift before starting a new one.`,
        409
      );
    }

    // Look up driver name
    const driverUser = await db.collection("users").findOne({ _id: new ObjectId(effectiveDriverId) });
    const driverName = driverUser
      ? `${driverUser.firstName || ""} ${driverUser.lastName || ""}`.trim() || driverUser.name || "Driver"
      : "Driver";

    const now = new Date();
    const nightTravelFlag = isNightTime(now);

    const newShift = {
      driverId: new ObjectId(effectiveDriverId),
      driverName,
      vehiclePlate: vehiclePlate.trim().toUpperCase(),
      startedAt: now,
      endedAt: null,
      startOdometer: odo,
      endOdometer: null,
      distanceKm: 0,
      startFuelPercent: startFuelPercent !== undefined ? Number(startFuelPercent) : null,
      endFuelPercent: null,
      nightTravel: nightTravelFlag,
      status: "active",
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("driver_shifts").insertOne(newShift);

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "DRIVER_SHIFT_STARTED",
      entityType: "DRIVER_SHIFT",
      entityId: result.insertedId.toString(),
      details: {
        driverId: effectiveDriverId,
        vehiclePlate: vehiclePlate.trim().toUpperCase(),
        startOdometer: odo,
        nightTravel: nightTravelFlag,
      },
    });

    return apiSuccess({
      message: "Shift started successfully.",
      shift: {
        id: result.insertedId.toString(),
        ...newShift,
        driverId: effectiveDriverId,
      },
    }, 201);
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to start shift", 500);
  }
}
