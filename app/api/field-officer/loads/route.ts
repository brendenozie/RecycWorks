import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { calculateLoadValue, calculateMultiGroupLoad, LoadGroupInput } from "@/lib/pricing";
import { ObjectId } from "mongodb";

function extractOfficer(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

async function generateLoadNumber(db: any): Promise<string> {
  const count = await db.collection("inventory").countDocuments();
  const year = new Date().getFullYear();
  return `RWL-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const officer = extractOfficer(request);

    const { searchParams } = new URL(request.url);
    const officerOnly = searchParams.get("mine");

    let query: Record<string, any> = {};
    if (officerOnly === "true" && officer?.userId) {
      query.fieldOfficerId = officer.userId;
    }

    const loads = await db
      .collection("inventory")
      .find(query)
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json(loads);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch loads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const officer = extractOfficer(request);
    const db = await getDatabase();
    const body = await request.json();

    const {
      supplierId,
      material,
      grade,
      quantity,
      unit,
      photos,
      notes,
      county,
      subCounty,
      landmark,
      gps,
      groups,
      items,
    } = body;

    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier is required to record a collection" },
        { status: 400 }
      );
    }

    // Determine if this is a modern multi-group collection or legacy single item
    const rawGroups: LoadGroupInput[] = groups || items || [];
    const isMultiGroup = Array.isArray(rawGroups) && rawGroups.length > 0;

    if (!isMultiGroup && (!material || !grade || !quantity)) {
      return NextResponse.json(
        { error: "Supplier, Material, Grade, and Quantity (or multi-material groups) are required" },
        { status: 400 }
      );
    }

    // Resolve supplier details
    let supplierRecord = null;
    if (ObjectId.isValid(supplierId)) {
      supplierRecord = await db.collection("users").findOne({ _id: new ObjectId(supplierId) });
    } else {
      supplierRecord = await db.collection("users").findOne({ supplierCode: supplierId });
    }

    const supplierName = supplierRecord
      ? `${supplierRecord.firstName || ""} ${supplierRecord.lastName || ""}`.trim() || supplierRecord.businessName
      : body.supplierName || "Direct Yard Supplier";
    const supplierCode = supplierRecord?.supplierCode || "";
    const hubId = supplierRecord?.hubId || body.hubId || null;
    const hubName = supplierRecord?.hubName || body.hubName || "Nairobi Core Hub";

    const loadNumber = await generateLoadNumber(db);

    let newLoad: Record<string, any>;

    if (isMultiGroup) {
      // Validate groups
      for (let i = 0; i < rawGroups.length; i++) {
        const g = rawGroups[i];
        if (!g.material || !g.grade) {
          return NextResponse.json(
            { error: `Group #${i + 1} is missing material or grade` },
            { status: 400 }
          );
        }
        if (!Array.isArray(g.sacks) || g.sacks.length === 0) {
          return NextResponse.json(
            { error: `Group "${g.material} (${g.grade})" has no sack weights entered` },
            { status: 400 }
          );
        }
        const hasInvalid = g.sacks.some((w) => isNaN(parseFloat(String(w))) || parseFloat(String(w)) <= 0);
        if (hasInvalid) {
          return NextResponse.json(
            { error: `Group "${g.material} (${g.grade})" contains non-positive or invalid sack weights` },
            { status: 400 }
          );
        }
      }

      // Authoritative multi-group calculation
      const multiValuation = calculateMultiGroupLoad(rawGroups, 0);

      newLoad = {
        loadNumber,
        name: multiValuation.summaryMaterial,
        material: multiValuation.summaryMaterial,
        grade: multiValuation.summaryGrade,
        weight: `${multiValuation.totalWeightKg}kg`,
        quantity: multiValuation.totalWeightKg,
        unit: "KG",
        normalizedWeightKg: multiValuation.totalWeightKg,
        unitPricePerKg: multiValuation.items[0]?.unitPricePerKg || 0,
        grossValueKes: multiValuation.grossValueKes,
        adjustmentKes: 0,
        netValueKes: multiValuation.netValueKes,
        totalSacks: multiValuation.totalSacks,
        items: multiValuation.items,
        supplier: supplierName,
        supplierName,
        supplierId: supplierRecord ? supplierRecord._id.toString() : supplierId,
        supplierCode,
        fieldOfficerId: officer?.userId || body.fieldOfficerId || null,
        fieldOfficerName: officer?.email || body.fieldOfficerName || "Field Operations",
        driver: "",
        driverId: "",
        hubId,
        hubName,
        status: "captured", // captured -> assigned -> in-transit -> delivered -> verified -> valued -> payment_pending -> paid
        pickupLocation: {
          county: county || supplierRecord?.county || "Nairobi",
          subCounty: subCounty || supplierRecord?.subCounty || "",
          landmark: landmark || "",
          gps: gps || supplierRecord?.gpsCoordinates || "",
        },
        photos: Array.isArray(photos) ? photos : (photos ? [photos] : []),
        notes: notes || "",
        paymentStatus: "pending",
        paymentReference: null,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      // Legacy single material/grade calculation
      const numQty = parseFloat(quantity) || 0;
      const cleanUnit = (unit || "KG").toUpperCase();
      const valuation = calculateLoadValue(numQty, cleanUnit, material, grade, 0);

      const singleItem = {
        id: "grp-1",
        material,
        grade,
        sacks: [valuation.normalizedWeightKg],
        sackCount: 1,
        totalWeightKg: valuation.normalizedWeightKg,
        unitPricePerKg: valuation.unitPricePerKg,
        estimatedValueKes: valuation.grossValueKes,
        photos: Array.isArray(photos) ? photos : (photos ? [photos] : []),
        notes: notes || "",
      };

      newLoad = {
        loadNumber,
        name: material,
        material,
        grade,
        weight: `${valuation.quantity}${valuation.unit === "TONNES" ? "t" : "kg"}`,
        quantity: valuation.quantity,
        unit: valuation.unit,
        normalizedWeightKg: valuation.normalizedWeightKg,
        unitPricePerKg: valuation.unitPricePerKg,
        grossValueKes: valuation.grossValueKes,
        adjustmentKes: 0,
        netValueKes: valuation.netValueKes,
        totalSacks: 1,
        items: [singleItem],
        supplier: supplierName,
        supplierName,
        supplierId: supplierRecord ? supplierRecord._id.toString() : supplierId,
        supplierCode,
        fieldOfficerId: officer?.userId || body.fieldOfficerId || null,
        fieldOfficerName: officer?.email || body.fieldOfficerName || "Field Operations",
        driver: "",
        driverId: "",
        hubId,
        hubName,
        status: "captured",
        pickupLocation: {
          county: county || supplierRecord?.county || "Nairobi",
          subCounty: subCounty || supplierRecord?.subCounty || "",
          landmark: landmark || "",
          gps: gps || supplierRecord?.gpsCoordinates || "",
        },
        photos: Array.isArray(photos) ? photos : (photos ? [photos] : []),
        notes: notes || "",
        paymentStatus: "pending",
        paymentReference: null,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const result = await db.collection("inventory").insertOne(newLoad);

    // Update active orders count for involved feedstock categories
    try {
      if (newLoad.items && Array.isArray(newLoad.items)) {
        const uniqueMaterials = Array.from(new Set(newLoad.items.map((it: any) => it.material)));
        for (const mat of uniqueMaterials) {
          await db.collection("feedstockCategories").updateOne(
            { name: mat },
            {
              $inc: { activeOrders: 1 },
              $set: { updatedAt: new Date() },
            }
          );
        }
      }
    } catch (catErr) {
      console.warn("Feedstock update skipped:", catErr);
    }

    // Audit log entry
    await db.collection("audit_logs").insertOne({
      userId: officer?.userId || "field_officer",
      action: "LOAD_CAPTURED",
      entityType: "load",
      entityId: result.insertedId.toString(),
      details: {
        loadNumber,
        material: newLoad.material,
        grade: newLoad.grade,
        totalSacks: newLoad.totalSacks,
        normalizedWeightKg: newLoad.normalizedWeightKg,
        grossValueKes: newLoad.grossValueKes,
        supplierName,
        itemsCount: newLoad.items?.length || 1,
      },
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Collection captured and registered into operational matrix.",
        load: {
          ...newLoad,
          id: result.insertedId.toString(),
          _id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Field Officer Load Capture Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to capture load" },
      { status: 500 }
    );
  }
}

