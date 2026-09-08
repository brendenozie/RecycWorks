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
 * POST /api/v1/materials/:id/activate
 * Activates a material category
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
    const db = await getDatabase();

    let matObjId: ObjectId;
    try {
      matObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Material identifier is not valid.", 422, "id");
    }

    await db.collection("feedstockCategories").updateOne(
      { _id: matObjId },
      { $set: { status: "Stable", updatedAt: new Date() } }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "MATERIAL_ACTIVATED",
      entityType: "MATERIAL",
      entityId: id,
    });

    return apiSuccess({ id, status: "Stable", isActive: true });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to activate material", 500);
  }
}
