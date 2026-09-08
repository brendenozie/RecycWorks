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
 * POST /api/v1/collections/:id/arrive
 * Driver logs arrival at the supplier collection yard
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

    // If caller is driver, verify assignment
    if (user!.role === "driver" && col.driverId && col.driverId !== user!.userId) {
      return apiError("FORBIDDEN", "You are not the assigned driver for this collection.", 403);
    }

    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          status: "ARRIVED",
          arrivedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "DRIVER_ARRIVED_AT_COLLECTION",
      entityType: "COLLECTION",
      entityId: id,
    });

    return apiSuccess({ id, status: "ARRIVED", message: "Arrival logged successfully." });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to log arrival", 500);
  }
}
