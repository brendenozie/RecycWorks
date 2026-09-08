import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  apiSuccess,
  apiError,
} from "@/lib/api-auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/materials/:id/grades?active=true
 * Returns valid quality grades for the specified material
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();

    let matObjId: ObjectId | null = null;
    try {
      matObjId = new ObjectId(id);
    } catch {}

    const material = matObjId
      ? await db.collection("feedstockCategories").findOne({ _id: matObjId })
      : await db.collection("feedstockCategories").findOne({
          name: { $regex: new RegExp(`^${id}$`, "i") },
        });

    if (!material) {
      return apiError("MATERIAL_NOT_FOUND", "Specified material was not found.", 404, "id");
    }

    const rawGrades: any[] = Array.isArray(material.grades) ? material.grades : [];
    const items = rawGrades.map((g, idx) => {
      const name = typeof g === "string" ? g : g.name || String(g);
      const code = typeof g === "object" && g.code ? g.code : `G${idx + 1}`;
      return {
        id: typeof g === "object" && g.id ? g.id : `${material._id.toString()}_${idx + 1}`,
        code,
        name,
        isActive: typeof g === "object" && g.isActive !== undefined ? g.isActive : true,
      };
    });

    return apiSuccess({
      materialId: material._id.toString(),
      materialName: material.name,
      items,
      count: items.length,
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch grades for material", 500);
  }
}
