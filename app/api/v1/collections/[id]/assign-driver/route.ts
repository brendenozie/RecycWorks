import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/collections/:id/assign-driver
 * Assigns an active verified driver to a collection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["admin", "super_admin", "operations"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { driverId, vehiclePlate } = body;

    if (!driverId || !driverId.trim()) {
      return apiError("VALIDATION_ERROR", "Driver ID is required.", 422, "driverId");
    }

    const db = await getDatabase();

    let colObjId: ObjectId;
    try {
      colObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Collection identifier is not valid.", 422, "id");
    }

    const col = await db.collection("inventory").findOne({ _id: colObjId });
    if (!col) {
      return apiError("COLLECTION_NOT_FOUND", "Collection not found.", 404, "id");
    }

    // Verify driver exists and has role driver
    let driverObjId: ObjectId;
    try {
      driverObjId = new ObjectId(driverId);
    } catch {
      return apiError("INVALID_DRIVER_ID", "Driver ID is not a valid identifier.", 422, "driverId");
    }

    const driver = await db.collection("users").findOne({ _id: driverObjId });
    if (!driver || driver.role !== "driver") {
      return apiError("DRIVER_NOT_FOUND", "Specified user is not a registered driver.", 404, "driverId");
    }

    const driverName = `${driver.firstName} ${driver.lastName}`.trim();
    const plate = vehiclePlate || driver.driverProfile?.vehiclePlate || driver.vehiclePlate || "UNKNOWN";

    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          driverId: driver._id.toString(),
          driverName,
          vehiclePlate: plate,
          status: "ASSIGNED",
          updatedAt: new Date(),
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "COLLECTION_DRIVER_ASSIGNED",
      entityType: "COLLECTION",
      entityId: id,
      after: { driverId: driver._id.toString(), driverName, vehiclePlate: plate },
    });

    return apiSuccess({
      id,
      status: "ASSIGNED",
      driver: {
        id: driver._id.toString(),
        name: driverName,
        vehiclePlate: plate,
      },
      message: "Driver assigned successfully.",
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to assign driver", 500);
  }
}
