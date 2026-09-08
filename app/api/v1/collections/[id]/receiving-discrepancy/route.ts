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
 * POST /api/v1/collections/:id/receiving-discrepancy
 * Records or updates the reason, notes, and verification photo for receiving weight discrepancy.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "hub-manager"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason, notes, photo } = body;

    if (!reason && !notes && !photo) {
      return apiError("VALIDATION_ERROR", "At least one of reason, notes, or photo must be provided.", 422);
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

    const updateFields: any = { updatedAt: new Date() };
    if (reason) updateFields.receivingDiscrepancyReason = reason;
    if (notes) updateFields.receivingNotes = notes;
    if (photo) updateFields.receivingPhoto = photo;

    await db.collection("inventory").updateOne({ _id: colObjId }, { $set: updateFields });

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "RECEIVING_DISCREPANCY_RECORDED",
      entityType: "load",
      entityId: col._id.toString(),
      metadata: {
        loadNumber: col.loadNumber,
        reason,
        hasPhoto: Boolean(photo),
      },
    });

    return apiSuccess({
      message: "Receiving discrepancy documentation recorded.",
      loadNumber: col.loadNumber,
      discrepancyReason: reason || col.receivingDiscrepancyReason,
      discrepancyKg: col.receivingDiscrepancyKg,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to record receiving discrepancy", 500);
  }
}
