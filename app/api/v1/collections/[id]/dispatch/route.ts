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
 * POST /api/v1/collections/:id/dispatch
 * Dispatches a collection: assigns Driver, Vehicle Plate, Destination Hub, and marks status ASSIGNED.
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
    const { driverId, vehiclePlate, hubId, notes } = body;

    if (!driverId || !driverId.trim()) {
      return apiError("VALIDATION_ERROR", "Driver ID is required for dispatch.", 422, "driverId");
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

    // Verify driver exists
    let driverObjId: ObjectId;
    try {
      driverObjId = new ObjectId(driverId);
    } catch {
      return apiError("INVALID_DRIVER_ID", "Driver ID format is invalid.", 422, "driverId");
    }

    const driver = await db.collection("users").findOne({ _id: driverObjId });
    if (!driver || driver.role !== "driver") {
      return apiError("DRIVER_NOT_FOUND", "Specified driver does not exist or is not a driver.", 404, "driverId");
    }

    const driverName = `${driver.firstName || ""} ${driver.lastName || ""}`.trim() || driver.name || "Driver";
    const assignedPlate = (vehiclePlate || driver.driverProfile?.vehiclePlate || driver.vehiclePlate || "RW-TRUCK-01").toUpperCase();

    // Verify or look up hub if provided
    let destinationHubName = col.hubName || "Central Processing Hub";
    let destinationHubId = col.hubId;
    if (hubId) {
      try {
        const hub = await db.collection("hubs").findOne({ _id: new ObjectId(hubId) });
        if (hub) {
          destinationHubId = hub._id.toString();
          destinationHubName = hub.name;
        }
      } catch {
        // use default
      }
    }

    const now = new Date();
    const updateDoc: any = {
      driverId: driver._id.toString(),
      driverName,
      vehiclePlate: assignedPlate,
      assignedVehiclePlate: assignedPlate,
      hubId: destinationHubId,
      hubName: destinationHubName,
      status: "ASSIGNED",
      dispatchedAt: now,
      updatedAt: now,
    };

    if (notes) {
      updateDoc.notes = col.notes ? `${col.notes}\n[Dispatch Note]: ${notes}` : `[Dispatch Note]: ${notes}`;
    }

    await db.collection("inventory").updateOne({ _id: colObjId }, { $set: updateDoc });

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "COLLECTION_DISPATCHED",
      entityType: "COLLECTION",
      entityId: id,
      details: {
        driverId: driver._id.toString(),
        driverName,
        vehiclePlate: assignedPlate,
        hubId: destinationHubId,
        hubName: destinationHubName,
        dispatchedAt: now.toISOString(),
      },
    });

    return apiSuccess({
      message: "Collection dispatched successfully.",
      collectionId: id,
      driverName,
      vehiclePlate: assignedPlate,
      hubName: destinationHubName,
      status: "ASSIGNED",
      dispatchedAt: now.toISOString(),
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to dispatch collection", 500);
  }
}
