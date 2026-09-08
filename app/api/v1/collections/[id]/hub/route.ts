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
 * PATCH /api/v1/collections/:id/hub
 * Assigns or updates the destination hub for a collection
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin", "operations"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { hubId } = body;

    if (!hubId || !hubId.trim()) {
      return apiError("VALIDATION_ERROR", "Hub ID is required.", 422, "hubId");
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

    // Verify hub exists
    let hubObjId: ObjectId | null = null;
    try {
      hubObjId = new ObjectId(hubId);
    } catch {}

    const hub = hubObjId
      ? await db.collection("hubs").findOne({ _id: hubObjId })
      : await db.collection("hubs").findOne({ code: hubId });

    if (!hub) {
      return apiError("HUB_NOT_FOUND", "Specified destination hub does not exist.", 404, "hubId");
    }

    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          hubId: hub._id.toString(),
          hubName: hub.name,
          updatedAt: new Date(),
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "COLLECTION_HUB_ASSIGNED",
      entityType: "COLLECTION",
      entityId: id,
      after: { hubId: hub._id.toString(), hubName: hub.name },
    });

    return apiSuccess({
      id,
      hubId: hub._id.toString(),
      hubName: hub.name,
      message: "Destination hub assigned successfully.",
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to assign hub", 500);
  }
}
