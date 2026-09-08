import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { CANONICAL_PRICING_CATALOG, getApplicablePricePerKg } from "@/lib/pricing";
import { ObjectId } from "mongodb";

// --- GET: Fetch all Materials, Grades, Active Status & Current Prices ---
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();

    // 1. Fetch Feedstocks from DB
    const feedstocks = await db
      .collection("feedstockCategories")
      .find({})
      .sort({ group: 1, name: 1 })
      .toArray();

    // 2. Fetch any dynamic price overrides from DB
    const overrides = await db
      .collection("pricing_overrides")
      .find({})
      .toArray();

    const overridesMap: Record<string, number> = {};
    const inactiveGrades = new Set<string>();

    overrides.forEach((o: any) => {
      const key = `${(o.material || "").toLowerCase()}::${(o.grade || "").toLowerCase()}`;
      if (typeof o.pricePerKg === "number") {
        overridesMap[key] = o.pricePerKg;
      }
      if (o.active === false) {
        inactiveGrades.add(key);
      }
    });

    // 3. Merge feedstocks with pricing
    const catalog = feedstocks.map((cat: any) => {
      const grades = (cat.grades || []).map((gradeName: string) => {
        const key = `${(cat.name || "").toLowerCase()}::${(gradeName || "").toLowerCase()}`;
        const currentPrice = overridesMap[key] !== undefined
          ? overridesMap[key]
          : getApplicablePricePerKg(cat.name, gradeName);
        const isActive = !inactiveGrades.has(key);

        return {
          name: gradeName,
          pricePerKg: currentPrice,
          active: isActive,
        };
      });

      return {
        _id: cat._id,
        name: cat.name,
        group: cat.group,
        totalWeight: cat.totalWeight || "0 kg",
        activeOrders: cat.activeOrders || 0,
        status: cat.status || "Stable",
        grades,
      };
    });

    // 4. Fetch pending material/grade requests count
    const pendingRequestsCount = await db
      .collection("material_requests")
      .countDocuments({ status: "pending" });

    return NextResponse.json({
      catalog,
      pendingRequestsCount,
      canonicalFallback: CANONICAL_PRICING_CATALOG,
    });
  } catch (error: any) {
    console.error("Admin Pricing GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing and feedstock catalog" },
      { status: 500 }
    );
  }
}

// --- PUT: Update Grade Pricing or Active Status (Admin Only) ---
export async function PUT(request: NextRequest) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    const { material, grade, pricePerKg, active } = body;

    if (!material || !grade) {
      return NextResponse.json(
        { error: "Material and Grade are required" },
        { status: 400 }
      );
    }

    const normMat = material.trim();
    const normGrd = grade.trim();
    const newGrd = typeof body.newGrade === "string" ? body.newGrade.trim() : "";
    const finalGrd = newGrd && newGrd !== normGrd ? newGrd : normGrd;

    const oldKey = `${normMat.toLowerCase()}::${normGrd.toLowerCase()}`;
    const key = `${normMat.toLowerCase()}::${finalGrd.toLowerCase()}`;

    // 1. If grade name changed, update feedstockCategories array element
    if (finalGrd !== normGrd) {
      const categoryUpdate = await db.collection("feedstockCategories").updateOne(
        { name: { $regex: new RegExp(`^${normMat}$`, "i") }, grades: normGrd },
        { 
          $set: { "grades.$": finalGrd, updatedAt: new Date() } 
        }
      );

      // If key changed, purge the old override key
      if (oldKey !== key) {
        await db.collection("pricing_overrides").deleteOne({ key: oldKey });
      }
    }

    const updateDoc: Record<string, any> = {
      material: normMat,
      grade: finalGrd,
      key,
      updatedAt: new Date(),
    };

    if (pricePerKg !== undefined && !isNaN(parseFloat(pricePerKg))) {
      updateDoc.pricePerKg = parseFloat(pricePerKg);
    }
    if (active !== undefined) {
      updateDoc.active = Boolean(active);
    }

    await db.collection("pricing_overrides").updateOne(
      { key },
      { $set: updateDoc },
      { upsert: true }
    );

    // Audit log
    await db.collection("audit_logs").insertOne({
      action: "PRICING_UPDATED",
      entityType: "pricing",
      details: {
        material: normMat,
        grade: finalGrd,
        previousGrade: finalGrd !== normGrd ? normGrd : undefined,
        pricePerKg: updateDoc.pricePerKg,
        active: updateDoc.active,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Updated configuration for ${normMat} - ${finalGrd}`,
      rule: updateDoc,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update pricing rule" },
      { status: 500 }
    );
  }
}

// --- PATCH: Approve or Reject a Field Officer Material/Grade Request ---
export async function PATCH(request: NextRequest) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    const { requestId, action, approvedPrice, adminNotes } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "requestId and action ('approve' | 'reject') are required" },
        { status: 400 }
      );
    }

    const reqDoc = await db.collection("material_requests").findOne({
      _id: new ObjectId(requestId),
    });

    if (!reqDoc) {
      return NextResponse.json(
        { error: "Material request not found" },
        { status: 404 }
      );
    }

    if (action === "reject") {
      await db.collection("material_requests").updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: "rejected",
            adminNotes: adminNotes || "",
            reviewedAt: new Date(),
          },
        }
      );
      return NextResponse.json({ success: true, message: "Request rejected" });
    }

    if (action === "approve") {
      const price = parseFloat(approvedPrice) || reqDoc.suggestedPrice || 35;
      const matName = reqDoc.materialName.trim();
      const grdName = (reqDoc.gradeName || "Standard Grade").trim();

      // 1. Ensure material exists or create it in feedstockCategories
      const existingFeedstock = await db
        .collection("feedstockCategories")
        .findOne({ name: matName });

      if (existingFeedstock) {
        // Add grade if not already in grades array
        if (!existingFeedstock.grades?.includes(grdName)) {
          await db.collection("feedstockCategories").updateOne(
            { _id: existingFeedstock._id },
            {
              $push: { grades: grdName },
              $set: { updatedAt: new Date() },
            }
          );
        }
      } else {
        // Create new feedstock
        await db.collection("feedstockCategories").insertOne({
          name: matName,
          group: reqDoc.notes?.toLowerCase().includes("metal") ? "Metals" : "Polymers",
          grades: [grdName],
          totalWeight: "0 kg",
          activeOrders: 0,
          status: "Stable",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 2. Set the initial price in pricing_overrides
      const key = `${matName.toLowerCase()}::${grdName.toLowerCase()}`;
      await db.collection("pricing_overrides").updateOne(
        { key },
        {
          $set: {
            material: matName,
            grade: grdName,
            key,
            pricePerKg: price,
            active: true,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      // 3. Mark request as approved
      await db.collection("material_requests").updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: "approved",
            adminNotes: adminNotes || "",
            configuredPrice: price,
            reviewedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: `Approved: "${matName} - ${grdName}" is now active in the collection matrix at KES ${price}/KG.`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
