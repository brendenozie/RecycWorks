import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  apiSuccess,
  apiError,
} from "@/lib/api-auth";

/**
 * GET /api/v1/hubs
 * Lists operational hubs
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const hubs = await db
      .collection("hubs")
      .find({})
      .sort({ name: 1 })
      .toArray();

    const items = hubs.map((h) => ({
      id: h._id.toString(),
      code: h.code || `HUB-${h._id.toString().slice(-4).toUpperCase()}`,
      name: h.name,
      county: h.county || "Nairobi",
      subCounty: h.subCounty || "",
      physicalAddress: h.physicalAddress || "",
      status: h.status || "Optimal",
      capacityTonnes: h.capacityTonnes || 100,
    }));

    return apiSuccess({ items, count: items.length });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch hubs", 500);
  }
}
