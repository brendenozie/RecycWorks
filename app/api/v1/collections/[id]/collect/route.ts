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
 * POST /api/v1/collections/:id/collect
 * Driver logs cargo loading and departures into IN_TRANSIT
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
    const { proofPhoto, loadPhoto, condition, discrepancyKg, notes } = body;

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

    if (user!.role === "driver" && col.driverId && col.driverId !== user!.userId) {
      return apiError("FORBIDDEN", "You are not the assigned driver for this collection.", 403);
    }

    const photoToSave = proofPhoto || loadPhoto;

    const updateSet: Record<string, any> = {
      status: "IN_TRANSIT",
      collectedAt: new Date(),
      updatedAt: new Date(),
    };
    if (photoToSave) {
      updateSet.proofOfCollectionPhoto = photoToSave;
    }
    if (condition) {
      updateSet.pickupCondition = condition;
    }
    if (discrepancyKg !== undefined && discrepancyKg !== null) {
      updateSet.pickupDiscrepancyKg = Number(discrepancyKg);
    }
    if (notes) {
      updateSet.driverNotes = notes;
    }

    await db.collection("inventory").updateOne({ _id: colObjId }, { $set: updateSet });

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "CARGO_COLLECTED_IN_TRANSIT",
      entityType: "COLLECTION",
      entityId: id,
      details: { proofPhoto: !!proofPhoto },
    });

    return apiSuccess({ id, status: "IN_TRANSIT", message: "Cargo collected and now in transit." });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to log cargo collection", 500);
  }
}
