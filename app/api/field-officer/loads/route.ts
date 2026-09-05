import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { calculateLoadValue } from "@/lib/pricing";
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
    } = body;

    if (!supplierId || !material || !grade || !quantity) {
      return NextResponse.json(
        { error: "Supplier, Material, Grade, and Quantity are required" },
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

    // Server-side authoritative load value calculation
    const numQty = parseFloat(quantity) || 0;
    const cleanUnit = (unit || "KG").toUpperCase();
    const valuation = calculateLoadValue(numQty, cleanUnit, material, grade, 0);

    const loadNumber = await generateLoadNumber(db);

    const newLoad = {
      loadNumber,
      name: material, // Feedstock category
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
      },
      photos: Array.isArray(photos) ? photos : (photos ? [photos] : []),
      notes: notes || "",
      paymentStatus: "pending",
      paymentReference: null,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("inventory").insertOne(newLoad);

    // Update category active orders count
    try {
      await db.collection("feedstockCategories").updateOne(
        { name: material },
        {
          $inc: { activeOrders: 1 },
          $set: { updatedAt: new Date() },
        }
      );
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
        material,
        grade,
        normalizedWeightKg: valuation.normalizedWeightKg,
        grossValueKes: valuation.grossValueKes,
        supplierName,
      },
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Load captured and registered into operational matrix.",
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
