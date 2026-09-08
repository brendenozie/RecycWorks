import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  apiSuccess,
  apiError,
} from "@/lib/api-auth";
import { getApplicablePricePerKg } from "@/lib/pricing";
import { formatCurrency } from "@/lib/decimal";

/**
 * GET /api/v1/pricing/resolve?material=...&grade=...&supplierId=...&hubId=...
 * Authoritative price resolution endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const material = searchParams.get("material") || searchParams.get("materialId") || "";
    const grade = searchParams.get("grade") || searchParams.get("gradeId") || "";

    if (!material.trim()) {
      return apiError("VALIDATION_ERROR", "Material parameter is required.", 422, "material");
    }
    if (!grade.trim()) {
      return apiError("VALIDATION_ERROR", "Grade parameter is required.", 422, "grade");
    }

    const db = await getDatabase();

    // Check custom benchmark override stored in database
    const customBenchmark = await db.collection("feedstock_pricing").findOne({
      material: { $regex: new RegExp(`^${material.trim()}$`, "i") },
      grade: { $regex: new RegExp(`^${grade.trim()}$`, "i") },
    });

    const unitPrice = customBenchmark ? customBenchmark.basePricePerKg : getApplicablePricePerKg(material, grade);

    return apiSuccess({
      material,
      grade,
      unit: "KG",
      currency: "KES",
      pricePerKg: formatCurrency(unitPrice),
      isDefaultBenchmark: !customBenchmark,
      effectiveFrom: customBenchmark?.effectiveFrom || new Date("2026-01-01"),
    });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to resolve price", 500);
  }
}
