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
 * GET /api/v1/driver/shifts
 * Lists shifts for driver or all for admin/operations.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck =  authorizeRoles(user, ["driver", "admin", "super_admin", "operations"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { searchParams } = new URL(request.url);
    const queryDriverId = searchParams.get("driverId");
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

    const filter: any = {};

    if (user!.role === "driver") {
      filter.driverId = new ObjectId(user!.userId);
    } else if (queryDriverId) {
      filter.driverId = new ObjectId(queryDriverId);
    }

    if (status) {
      filter.status = status;
    }

    const db = await getDatabase();
    const rawShifts = await db
      .collection("driver_shifts")
      .find(filter)
      .sort({ startedAt: -1 })
      .limit(limit)
      .toArray();

    const shifts = rawShifts.map((s) => ({
      id: s._id.toString(),
      driverId: s.driverId?.toString(),
      driverName: s.driverName,
      vehiclePlate: s.vehiclePlate,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      startOdometer: s.startOdometer,
      endOdometer: s.endOdometer,
      distanceKm: s.distanceKm || 0,
      startFuelPercent: s.startFuelPercent,
      endFuelPercent: s.endFuelPercent,
      nightTravel: s.nightTravel || false,
      status: s.status,
      notes: s.notes,
    }));

    return apiSuccess({ shifts, count: shifts.length });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to list shifts", 500);
  }
}
