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
 * GET /api/v1/inventory/movements
 * Auditable ledger of physical stock movements across all lifecycle events.
 * Query params: lotId, hubId, type, referenceType, limit, skip
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "hub-manager"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { searchParams } = new URL(request.url);
    const lotId = searchParams.get("lotId");
    const hubId = searchParams.get("hubId");
    const type = searchParams.get("type");
    const referenceType = searchParams.get("referenceType");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const query: any = {};
    if (lotId) {
      if (ObjectId.isValid(lotId)) {
        query.$or = [{ lotId }, { lotId: new ObjectId(lotId) }];
      } else {
        query.lotId = lotId;
      }
    }
    if (hubId) {
      if (ObjectId.isValid(hubId)) {
        query.$or = [{ hubId }, { hubId: new ObjectId(hubId) }];
      } else {
        query.hubId = hubId;
      }
    }
    if (type) query.type = type.toUpperCase();
    if (referenceType) query.referenceType = referenceType.toUpperCase();

    const db = await getDatabase();
    const movements = await db
      .collection("inventory_movements")
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const mapped = movements.map((m: any) => ({
      id: m._id.toString(),
      movementNumber: m.movementNumber,
      lotId: m.lotId ? m.lotId.toString() : null,
      hubId: m.hubId ? m.hubId.toString() : null,
      type: m.type,
      quantityKg: m.quantityKg,
      balanceAfterKg: m.balanceAfterKg,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      performedBy: m.performedBy,
      notes: m.notes,
      timestamp: m.timestamp,
    }));

    return apiSuccess({
      total: mapped.length,
      movements: mapped,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to fetch inventory movements", 500);
  }
}
