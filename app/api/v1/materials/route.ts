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
 * GET /api/v1/materials?active=true
 * Lists materials. Lightweight response for field officer mobile UI and internal catalogs.
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    let query: Record<string, any> = {};
    if (activeOnly) {
      query.status = { $ne: "Inactive" };
    }

    const categories = await db
      .collection("feedstockCategories")
      .find(query)
      .sort({ name: 1 })
      .toArray();

    const items = categories.map((c) => ({
      id: c._id.toString(),
      code: c.name.toUpperCase().replace(/[^A-Z0-9]/g, "_"),
      name: c.name,
      group: c.group || "Polymers & Synthetics",
      isActive: c.status !== "Inactive",
      gradeCount: Array.isArray(c.grades) ? c.grades.length : 0,
    }));

    return apiSuccess({ items, count: items.length });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch materials", 500);
  }
}

/**
 * POST /api/v1/materials
 * Admin/Super Admin creates an authoritative material category
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const { name, group, grades, description } = body;

    if (!name || !name.trim()) {
      return apiError("VALIDATION_ERROR", "Material name is required.", 422, "name");
    }

    const db = await getDatabase();
    const existing = await db.collection("feedstockCategories").findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existing) {
      return apiError("CONFLICT", `Material '${name}' already exists.`, 409, "name");
    }

    const formattedGrades = Array.isArray(grades)
      ? grades.map((g: any) => (typeof g === "string" ? g.trim() : g.name || String(g)))
      : ["Standard Grade"];

    const newMaterial = {
      name: name.trim(),
      group: group || "Polymers & Synthetics",
      grades: formattedGrades,
      description: description || "",
      totalWeight: "0 kg",
      activeOrders: 0,
      status: "Stable",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection("feedstockCategories").insertOne(newMaterial);
    const materialId = insertResult.insertedId.toString();

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "MATERIAL_CREATED",
      entityType: "MATERIAL",
      entityId: materialId,
      after: { name: newMaterial.name, group: newMaterial.group, grades: formattedGrades },
    });

    return apiSuccess(
      {
        id: materialId,
        code: newMaterial.name.toUpperCase().replace(/[^A-Z0-9]/g, "_"),
        name: newMaterial.name,
        group: newMaterial.group,
        grades: formattedGrades,
        isActive: true,
      },
      201
    );
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to create material", 500);
  }
}
