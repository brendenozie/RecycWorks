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
 * PATCH /api/v1/materials/:id
 * Admin/Super Admin updates material metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { name, group, description } = body;

    const db = await getDatabase();

    let matObjId: ObjectId;
    try {
      matObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Material identifier is not valid.", 422, "id");
    }

    const material = await db.collection("feedstockCategories").findOne({ _id: matObjId });
    if (!material) {
      return apiError("MATERIAL_NOT_FOUND", "Material not found.", 404, "id");
    }

    const updateFields: Record<string, any> = { updatedAt: new Date() };
    if (name && name.trim()) updateFields.name = name.trim();
    if (group && group.trim()) updateFields.group = group.trim();
    if (description !== undefined) updateFields.description = description;

    await db.collection("feedstockCategories").updateOne({ _id: matObjId }, { $set: updateFields });

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "MATERIAL_UPDATED",
      entityType: "MATERIAL",
      entityId: id,
      before: material,
      after: updateFields,
    });

    return apiSuccess({ id, message: "Material updated successfully." });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to update material", 500);
  }
}
