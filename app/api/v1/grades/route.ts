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
 * POST /api/v1/grades
 * Admin/Super Admin adds a new quality grade to a material
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const { materialId, material, name, code } = body;
    const targetMat = materialId || material;

    if (!targetMat || !targetMat.trim()) {
      return apiError("VALIDATION_ERROR", "Material ID or name is required.", 422, "materialId");
    }
    if (!name || !name.trim()) {
      return apiError("VALIDATION_ERROR", "Grade name is required.", 422, "name");
    }

    const db = await getDatabase();

    let matObjId: ObjectId | null = null;
    try {
      matObjId = new ObjectId(targetMat);
    } catch {}

    const matDoc = matObjId
      ? await db.collection("feedstockCategories").findOne({ _id: matObjId })
      : await db.collection("feedstockCategories").findOne({
          name: { $regex: new RegExp(`^${targetMat.trim()}$`, "i") },
        });

    if (!matDoc) {
      return apiError("MATERIAL_NOT_FOUND", "Specified material was not found.", 404, "materialId");
    }

    const currentGrades: string[] = Array.isArray(matDoc.grades) ? matDoc.grades : [];
    const cleanGradeName = name.trim();

    if (currentGrades.some((g) => g.toLowerCase() === cleanGradeName.toLowerCase())) {
      return apiError("CONFLICT", `Grade '${cleanGradeName}' already exists for material '${matDoc.name}'.`, 409, "name");
    }

    const updatedGrades = [...currentGrades, cleanGradeName];

    await db.collection("feedstockCategories").updateOne(
      { _id: matDoc._id },
      {
        $set: {
          grades: updatedGrades,
          updatedAt: new Date(),
        },
      }
    );

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "GRADE_CREATED",
      entityType: "GRADE",
      entityId: `${matDoc._id.toString()}_${cleanGradeName}`,
      after: { material: matDoc.name, grade: cleanGradeName },
    });

    return apiSuccess(
      {
        id: `${matDoc._id.toString()}_${cleanGradeName}`,
        materialId: matDoc._id.toString(),
        materialName: matDoc.name,
        code: code || `G${updatedGrades.length}`,
        name: cleanGradeName,
        isActive: true,
      },
      201
    );
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to create grade", 500);
  }
}
