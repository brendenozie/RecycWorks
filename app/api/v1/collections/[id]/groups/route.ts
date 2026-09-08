import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { formatWeight } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/collections/:id/groups
 * Adds a new material/grade group to a collection or resumes an existing one
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const materialName = (body.material || body.materialId || "").trim();
    const gradeName = (body.grade || body.gradeId || "").trim();

    if (!materialName) {
      return apiError("VALIDATION_ERROR", "Material name/ID is required.", 422, "material");
    }
    if (!gradeName) {
      return apiError("VALIDATION_ERROR", "Grade name/ID is required.", 422, "grade");
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

    const currentStatus = (col.status || "").toUpperCase();
    if (currentStatus !== "CAPTURING" && currentStatus !== "DRAFT") {
      return apiError(
        "COLLECTION_NOT_EDITABLE",
        `Collection in status '${currentStatus}' cannot accept new groups.`,
        409
      );
    }

    const currentItems: any[] = Array.isArray(col.items) ? col.items : [];

    // Check if matching group already exists (auto-resume to prevent fragmentation)
    const existingGroup = currentItems.find(
      (g) =>
        g.material.toLowerCase() === materialName.toLowerCase() &&
        g.grade.toLowerCase() === gradeName.toLowerCase()
    );

    if (existingGroup) {
      return apiSuccess({
        id: existingGroup.id,
        material: existingGroup.material,
        grade: existingGroup.grade,
        sackCount: Number(existingGroup.sackCount || 0),
        totalWeightKg: formatWeight(existingGroup.totalWeightKg || 0),
        resumed: true,
      });
    }

    // Create new group
    const newGroupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newGroup = {
      id: newGroupId,
      material: materialName,
      grade: gradeName,
      sacks: [], // Array of numbers
      sackRecords: [], // Detailed sack entries
      sackCount: 0,
      totalWeightKg: 0,
      unitPricePerKg: 0,
      estimatedValueKes: 0,
      photos: [],
      notes: body.notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedItems = [...currentItems, newGroup];

    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          items: updatedItems,
          updatedAt: new Date(),
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "COLLECTION_GROUP_ADDED",
      entityType: "COLLECTION",
      entityId: id,
      after: { groupId: newGroupId, material: materialName, grade: gradeName },
    });

    return apiSuccess(
      {
        id: newGroupId,
        material: materialName,
        grade: gradeName,
        sackCount: 0,
        totalWeightKg: "0.000",
        resumed: false,
      },
      201
    );
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to add group", 500);
  }
}
