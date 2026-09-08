import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { CANONICAL_PRICING_CATALOG } from "@/lib/pricing";
import { toCurrency, formatCurrency } from "@/lib/decimal";

/**
 * GET /api/v1/pricing
 * Lists all active price benchmarks
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const customPrices = await db.collection("feedstock_pricing").find({}).toArray();

    // Merge database overrides with canonical pricing catalog
    const merged = CANONICAL_PRICING_CATALOG.map((item, idx) => {
      const override = customPrices.find(
        (p) =>
          p.material.toLowerCase() === item.material.toLowerCase() &&
          p.grade.toLowerCase() === item.grade.toLowerCase()
      );

      const price = override ? override.basePricePerKg : item.basePricePerKg;
      return {
        id: override ? override._id.toString() : `bench_${idx + 1}`,
        material: item.material,
        grade: item.grade,
        unit: item.unit || "KG",
        pricePerKg: formatCurrency(price),
        currency: "KES",
        isActive: override ? override.isActive !== false : true,
        effectiveFrom: override?.effectiveFrom || new Date("2026-01-01"),
      };
    });

    return apiSuccess({ items: merged, count: merged.length });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch pricing", 500);
  }
}

/**
 * POST /api/v1/pricing
 * Admin/Super Admin defines or updates a benchmark price
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const { material, grade, pricePerKg, effectiveFrom } = body;

    if (!material || !material.trim()) {
      return apiError("VALIDATION_ERROR", "Material name is required.", 422, "material");
    }
    if (!grade || !grade.trim()) {
      return apiError("VALIDATION_ERROR", "Grade name is required.", 422, "grade");
    }

    const price = toCurrency(pricePerKg);
    if (price < 0) {
      return apiError("VALIDATION_ERROR", "Price per KG cannot be negative.", 422, "pricePerKg");
    }

    const db = await getDatabase();
    const cleanMaterial = material.trim();
    const cleanGrade = grade.trim();

    const existing = await db.collection("feedstock_pricing").findOne({
      material: { $regex: new RegExp(`^${cleanMaterial}$`, "i") },
      grade: { $regex: new RegExp(`^${cleanGrade}$`, "i") },
    });

    let resultId: string;
    if (existing) {
      await db.collection("feedstock_pricing").updateOne(
        { _id: existing._id },
        {
          $set: {
            basePricePerKg: price,
            effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
            updatedBy: user!.userId,
            updatedAt: new Date(),
          },
        }
      );
      resultId = existing._id.toString();
    } else {
      const insert = await db.collection("feedstock_pricing").insertOne({
        material: cleanMaterial,
        grade: cleanGrade,
        unit: "KG",
        basePricePerKg: price,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        isActive: true,
        createdBy: user!.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      resultId = insert.insertedId.toString();
    }

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "PRICING_BENCHMARK_SET",
      entityType: "PRICING",
      entityId: resultId,
      before: existing ? { pricePerKg: existing.basePricePerKg } : null,
      after: { material: cleanMaterial, grade: cleanGrade, pricePerKg: price },
    });

    return apiSuccess(
      {
        id: resultId,
        material: cleanMaterial,
        grade: cleanGrade,
        pricePerKg: formatCurrency(price),
        currency: "KES",
        message: "Pricing benchmark saved successfully.",
      },
      201
    );
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to set pricing", 500);
  }
}
