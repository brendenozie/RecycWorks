/**
 * Centralized Pricing Engine & Load Value Calculator
 * 
 * Defines authoritative price benchmarks for materials and grades,
 * calculates load values on the backend, and validates adjustments.
 */

export interface PricingRule {
  material: string;
  grade: string;
  unit: "KG" | "TONNES";
  basePricePerKg: number; // in KES
  description: string;
}

export const CANONICAL_PRICING_CATALOG: PricingRule[] = [
  // Rigid Plastics (HDPE)
  {
    material: "Rigid HDPE",
    grade: "Blow Moulding Grade (Crates, Drums)",
    unit: "KG",
    basePricePerKg: 42,
    description: "Sorted, washed HDPE crates, oil-free drums and jerrycans",
  },
  {
    material: "Rigid HDPE",
    grade: "Standard Regrind",
    unit: "KG",
    basePricePerKg: 38,
    description: "Flaked/shredded mixed HDPE feedstock",
  },
  {
    material: "Rigid HDPE",
    grade: "Mixed Scrap Grade",
    unit: "KG",
    basePricePerKg: 32,
    description: "Unsorted bulk HDPE scrap",
  },

  // Polypropylene (PP)
  {
    material: "Polypropylene (PP)",
    grade: "Injection Grade (Chairs, Basins)",
    unit: "KG",
    basePricePerKg: 36,
    description: "Solid sorted PP furniture, buckets, and clean basins",
  },
  {
    material: "Polypropylene (PP)",
    grade: "Woven Bag Scrap",
    unit: "KG",
    basePricePerKg: 28,
    description: "Clean woven polypropylene sacks/bulk bags",
  },
  {
    material: "Polypropylene (PP)",
    grade: "Battery Casings",
    unit: "KG",
    basePricePerKg: 45,
    description: "Clean drained black/grey PP automotive battery cases",
  },

  // Flexible Films (HDPE / LDPE)
  {
    material: "Flexible HDPE/LDPE",
    grade: "Clear Film / Grade A",
    unit: "KG",
    basePricePerKg: 34,
    description: "Transparent post-industrial stretch film & clean pallet wrap",
  },
  {
    material: "Flexible HDPE/LDPE",
    grade: "Colored Film / Grade B",
    unit: "KG",
    basePricePerKg: 24,
    description: "Clean post-consumer printed shopping bags and shrink film",
  },
  {
    material: "Flexible HDPE/LDPE",
    grade: "Industrial Mixed Film",
    unit: "KG",
    basePricePerKg: 18,
    description: "Baled agricultural or industrial protective film",
  },

  // Non-Ferrous Metals (Aluminum)
  {
    material: "Aluminum Caps & Cans",
    grade: "UBC Scrap (Beverage Cans)",
    unit: "KG",
    basePricePerKg: 140,
    description: "Flattened or baled used beverage cans",
  },
  {
    material: "Aluminum Caps & Cans",
    grade: "Bottletop Caps & Closures",
    unit: "KG",
    basePricePerKg: 125,
    description: "Sorted aluminum bottle closures and seal caps",
  },
  {
    material: "Aluminum Caps & Cans",
    grade: "Extrusion / Light Offcuts",
    unit: "KG",
    basePricePerKg: 165,
    description: "Clean architectural offcuts and aluminum profiles",
  },
];

/**
 * Normalizes weight into Kilograms
 */
export function normalizeWeightToKg(quantity: number, unit: string): number {
  const cleanUnit = (unit || "KG").toUpperCase().trim();
  if (cleanUnit.includes("TON") || cleanUnit === "T") {
    return quantity * 1000;
  }
  return quantity;
}

/**
 * Finds the authoritative unit price per KG for a given material and grade
 */
export function getApplicablePricePerKg(material: string, grade: string): number {
  const normMat = (material || "").toLowerCase().trim();
  const normGrd = (grade || "").toLowerCase().trim();

  // Try exact match
  const exact = CANONICAL_PRICING_CATALOG.find(
    (p) =>
      p.material.toLowerCase() === normMat &&
      p.grade.toLowerCase() === normGrd
  );
  if (exact) return exact.basePricePerKg;

  // Partial grade match within same material
  const matMatch = CANONICAL_PRICING_CATALOG.filter((p) =>
    normMat.includes(p.material.toLowerCase()) || p.material.toLowerCase().includes(normMat)
  );
  if (matMatch.length > 0) {
    const gradeMatch = matMatch.find(
      (p) =>
        normGrd.includes(p.grade.toLowerCase()) ||
        p.grade.toLowerCase().includes(normGrd)
    );
    if (gradeMatch) return gradeMatch.basePricePerKg;
    return matMatch[0].basePricePerKg;
  }

  // Fallback defaults based on broad family
  if (normMat.includes("aluminum") || normMat.includes("can") || normMat.includes("metal")) {
    return 130;
  }
  if (normMat.includes("pp") || normMat.includes("polypropylene")) {
    return 35;
  }
  if (normMat.includes("film") || normMat.includes("flexible") || normMat.includes("ldpe")) {
    return 28;
  }
  return 38; // General HDPE default
}

export interface CalculatedLoadValue {
  quantity: number;
  unit: "KG" | "TONNES";
  normalizedWeightKg: number;
  unitPricePerKg: number;
  grossValueKes: number;
  adjustmentKes: number;
  netValueKes: number;
}

/**
 * Server-side calculation of load value:
 * Quantity(in KG) × Applicable Price = Load Value
 */
export function calculateLoadValue(
  quantity: number,
  unit: string,
  material: string,
  grade: string,
  adjustmentKes: number = 0
): CalculatedLoadValue {
  const validQuantity = Math.max(0, Number(quantity) || 0);
  const normalizedWeightKg = normalizeWeightToKg(validQuantity, unit);
  const unitPricePerKg = getApplicablePricePerKg(material, grade);
  const grossValueKes = Math.round(normalizedWeightKg * unitPricePerKg);
  const netValueKes = Math.max(0, grossValueKes + (Number(adjustmentKes) || 0));

  return {
    quantity: validQuantity,
    unit: (unit || "KG").toUpperCase().includes("TON") ? "TONNES" : "KG",
    normalizedWeightKg,
    unitPricePerKg,
    grossValueKes,
    adjustmentKes: Number(adjustmentKes) || 0,
    netValueKes,
  };
}
