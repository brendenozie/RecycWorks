import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
} from "@/lib/api-auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/inventory/lots
 * Retrieves authoritative physical stock lots with optional filters:
 * hubId, material, grade, stage (RAW, SORTED, PROCESSED, FINISHED), status (AVAILABLE, RESERVED, DEPLETED)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "hub-manager"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hubId");
    const material = searchParams.get("material");
    const grade = searchParams.get("grade");
    const stage = searchParams.get("stage");
    const status = searchParams.get("status");

    const query: any = {};
    if (hubId) {
      if (ObjectId.isValid(hubId)) {
        query.$or = [{ hubId }, { hubId: new ObjectId(hubId) }];
      } else {
        query.hubId = hubId;
      }
    }
    if (material) query.material = { $regex: new RegExp(`^${material}$`, "i") };
    if (grade) query.grade = { $regex: new RegExp(`^${grade}$`, "i") };
    if (stage) query.stage = stage.toUpperCase();
    if (status) query.status = status.toUpperCase();

    const db = await getDatabase();
    const lots = await db
      .collection("inventory_lots")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    const mapped = lots.map((l: any) => ({
      id: l._id.toString(),
      lotNumber: l.lotNumber,
      hubId: l.hubId ? l.hubId.toString() : null,
      hubName: l.hubName || "Central Depot",
      material: l.material,
      grade: l.grade,
      stage: l.stage,
      quantityKg: l.quantityKg,
      availableQuantityKg: l.availableQuantityKg,
      reservedQuantityKg: l.reservedQuantityKg || 0,
      unit: l.unit || "KG",
      sourceType: l.sourceType,
      sourceId: l.sourceId,
      status: l.status,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    return apiSuccess({
      total: mapped.length,
      lots: mapped,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to fetch inventory lots", 500);
  }
}
