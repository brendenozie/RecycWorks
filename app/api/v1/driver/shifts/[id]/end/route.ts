import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { isNightTravel } from "@/lib/night-travel";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/driver/shifts/:id/end
 * Ends a driver shift, calculates distance traveled, checks night travel, and closes shift.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["driver", "admin", "super_admin", "operations"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { endOdometer, endFuelPercent, notes } = body;

    const endOdo = Number(endOdometer);
    if (isNaN(endOdo) || endOdo < 0) {
      return apiError("VALIDATION_ERROR", "A valid ending odometer reading is required.", 422, "endOdometer");
    }

    const db = await getDatabase();

    let shiftObjId: ObjectId;
    try {
      shiftObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Shift identifier is not valid.", 422, "id");
    }

    const shift = await db.collection("driver_shifts").findOne({ _id: shiftObjId });
    if (!shift) {
      return apiError("SHIFT_NOT_FOUND", "Shift not found.", 404, "id");
    }

    if (shift.status !== "active") {
      return apiError("SHIFT_ALREADY_COMPLETED", "This shift has already been completed.", 400);
    }

    // Driver can only end their own shift unless admin
    if (user!.role === "driver" && shift.driverId.toString() !== user!.userId) {
      return apiError("FORBIDDEN", "You cannot end another driver's shift.", 403);
    }

    if (endOdo < shift.startOdometer) {
      return apiError(
        "INVALID_ODOMETER",
        `Ending odometer (${endOdo} km) cannot be less than starting odometer (${shift.startOdometer} km).`,
        422,
        "endOdometer"
      );
    }

    const now = new Date();
    const distanceKm = Math.round((endOdo - shift.startOdometer) * 10) / 10;
    const nightTravelFlag = shift.nightTravel || isNightTravel(new Date(shift.startedAt), now);

    const updateDoc: any = {
      status: "completed",
      endedAt: now,
      endOdometer: endOdo,
      distanceKm,
      endFuelPercent: endFuelPercent !== undefined ? Number(endFuelPercent) : null,
      nightTravel: nightTravelFlag,
      updatedAt: now,
    };

    if (notes) {
      updateDoc.notes = shift.notes ? `${shift.notes}\n[End Note]: ${notes}` : notes;
    }

    await db.collection("driver_shifts").updateOne({ _id: shiftObjId }, { $set: updateDoc });

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "DRIVER_SHIFT_ENDED",
      entityType: "DRIVER_SHIFT",
      entityId: id,
      details: {
        driverId: shift.driverId.toString(),
        distanceKm,
        endOdometer: endOdo,
        nightTravel: nightTravelFlag,
      },
    });

    return apiSuccess({
      message: "Shift ended successfully.",
      shift: {
        id,
        driverId: shift.driverId.toString(),
        driverName: shift.driverName,
        vehiclePlate: shift.vehiclePlate,
        startedAt: shift.startedAt,
        endedAt: now,
        startOdometer: shift.startOdometer,
        endOdometer: endOdo,
        distanceKm,
        startFuelPercent: shift.startFuelPercent,
        endFuelPercent: updateDoc.endFuelPercent,
        nightTravel: nightTravelFlag,
        status: "completed",
      },
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to end shift", 500);
  }
}
