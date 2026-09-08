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
 * POST /api/v1/master-data-requests/:id/reject
 * Admin/Super Admin rejects request with reason notes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason, adminNotes } = body;

    const db = await getDatabase();

    let reqObjId: ObjectId;
    try {
      reqObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Request identifier is not valid.", 422, "id");
    }

    const reqDoc = await db.collection("material_requests").findOne({ _id: reqObjId });
    if (!reqDoc) {
      return apiError("REQUEST_NOT_FOUND", "Master data request not found.", 404, "id");
    }

    await db.collection("material_requests").updateOne(
      { _id: reqObjId },
      {
        $set: {
          status: "REJECTED",
          reviewedBy: user!.email || user!.userId,
          reviewedAt: new Date(),
          adminNotes: reason || adminNotes || "Rejected by Administrator",
          updatedAt: new Date(),
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "MASTER_DATA_REQUEST_REJECTED",
      entityType: "MASTER_DATA_REQUEST",
      entityId: id,
      after: { status: "REJECTED", reason: reason || adminNotes },
    });

    return apiSuccess({
      id,
      status: "REJECTED",
      message: "Master data request rejected.",
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to reject request", 500);
  }
}
