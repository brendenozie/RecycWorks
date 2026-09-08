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
 * GET /api/v1/driver/shifts/current
 * Returns the currently active shift for the driver, or null if off-shift.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["driver", "admin", "super_admin", "operations"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { searchParams } = new URL(request.url);
    const queryDriverId = searchParams.get("driverId");

    const effectiveDriverId = user!.role === "driver" ? user!.userId : (queryDriverId || user!.userId);

    const db = await getDatabase();

    const shift = await db.collection("driver_shifts").findOne({
      driverId: new ObjectId(effectiveDriverId),
      status: "active",
    });

    if (!shift) {
      return apiSuccess({
        activeShift: null,
        isOnShift: false,
      });
    }

    return apiSuccess({
      activeShift: {
        id: shift._id.toString(),
        driverId: shift.driverId.toString(),
        driverName: shift.driverName,
        vehiclePlate: shift.vehiclePlate,
        startedAt: shift.startedAt,
        startOdometer: shift.startOdometer,
        startFuelPercent: shift.startFuelPercent,
        nightTravel: shift.nightTravel,
        status: shift.status,
        notes: shift.notes,
      },
      isOnShift: true,
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch current shift", 500);
  }
}
