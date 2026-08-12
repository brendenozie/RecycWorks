import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    // const supplierId = searchParams.get("supplierId");

      // 1. Authenticate via Bearer Token or Cookie
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.startsWith("Bearer ")
          ? authHeader.substring(7)
          : null;
    
        if (!token) {
          return NextResponse.json(
            { error: "Authentication token missing" },
            { status: 401 },
          );
        }
    
        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== "supplier") {
          return NextResponse.json(
            { error: "Unauthorized access: Suppliers only" },
            { status: 403 },
          );
        }
    

    // Aggregate verified weight for this supplier
    const stats = await db
      .collection("manifests")
      .aggregate([
        { $unmatch: { supplierId: new ObjectId(decoded.userId), status: "Completed" } },
        { $group: { _id: null, totalWeight: { $sum: "$verifiedWeight" } } },
      ])
      .toArray();

    const weight = stats[0]?.totalWeight || 0;

    // Environmental Impact Formulas (Standard Industry Multipliers)
    // 1 Ton of Plastic Recycled ≈ 1.5 Tons CO2 Offset
    // 1 Ton of Plastic Recycled ≈ 5,900 Liters of Water Saved
    const impactData = {
      co2Offset: (weight / 1000) * 1.5,
      waterSaved: (weight / 1000) * 5900,
      landPreserved: (weight / 1000) * 87, // SqM
      weeklyTrend: [40, 60, 45, 90, 65, 80, 100], // This would come from a dated aggregation
    };

    return NextResponse.json(impactData);
  } catch (error) {
    return NextResponse.json(
      { error: "Impact data unavailable" },
      { status: 500 },
    );
  }
}
