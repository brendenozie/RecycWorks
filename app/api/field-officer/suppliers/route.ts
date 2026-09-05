import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken, hashPassword } from "@/lib/auth";
import { getDefaultHubForCounty } from "@/lib/locations";
import { ObjectId } from "mongodb";

function extractOfficer(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Generates next unique Supplier Code: RW-1001, RW-1002, etc.
 */
async function generateSupplierCode(db: any): Promise<string> {
  const latestSupplier = await db
    .collection("users")
    .find({ supplierCode: { $regex: /^RW-\d+$/ } })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  if (latestSupplier.length > 0 && latestSupplier[0].supplierCode) {
    const numPart = parseInt(latestSupplier[0].supplierCode.replace("RW-", ""), 10);
    if (!isNaN(numPart)) {
      return `RW-${numPart + 1}`;
    }
  }

  // Count existing suppliers fallback
  const count = await db.collection("users").countDocuments({ role: "supplier" });
  return `RW-${1000 + count + 1}`;
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const officer = extractOfficer(request);
    
    // Optional filter by officer or return all active suppliers for field selection
    const { searchParams } = new URL(request.url);
    const queryTerm = searchParams.get("q");

    let filter: Record<string, any> = { role: "supplier" };
    if (queryTerm) {
      filter.$or = [
        { firstName: { $regex: queryTerm, $options: "i" } },
        { lastName: { $regex: queryTerm, $options: "i" } },
        { businessName: { $regex: queryTerm, $options: "i" } },
        { supplierCode: { $regex: queryTerm, $options: "i" } },
        { phoneNumber: { $regex: queryTerm, $options: "i" } },
      ];
    }

    const suppliers = await db
      .collection("users")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const clean = suppliers.map((s: any) => ({
      _id: s._id.toString(),
      id: s._id.toString(),
      name: `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.businessName || "Unnamed Supplier",
      businessName: s.businessName || "",
      supplierCode: s.supplierCode || "RW-NEW",
      phoneNumber: s.phoneNumber || "",
      county: s.county || "Nairobi",
      subCounty: s.subCounty || "",
      supplierType: s.supplierType || "Aggregator",
      hubId: s.hubId || "",
      fieldOfficerId: s.fieldOfficerId || "",
      createdAt: s.createdAt,
    }));

    return NextResponse.json(clean);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const officer = extractOfficer(request);
    const db = await getDatabase();
    const body = await request.json();

    const {
      name,
      phoneNumber,
      businessName,
      county,
      subCounty,
      gpsCoordinates,
      supplierType,
      notes,
    } = body;

    if (!name || !phoneNumber || !county) {
      return NextResponse.json(
        { error: "Name, Phone Number, and County are required" },
        { status: 400 }
      );
    }

    // Split name into first and last
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "Supplier";
    const lastName = nameParts.slice(1).join(" ") || (businessName || "Partner");

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\s+/g, "").trim();

    // Check for existing supplier with same phone
    const existing = await db.collection("users").findOne({
      phoneNumber: cleanPhone,
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `A supplier with phone ${cleanPhone} is already registered (${existing.supplierCode || "Existing"}).`,
          existingSupplierId: existing._id.toString(),
          supplierCode: existing.supplierCode,
        },
        { status: 409 }
      );
    }

    // Generate automatic Supplier Code: RW-XXXX
    const supplierCode = await generateSupplierCode(db);

    // Initial password default for instant onboarding (e.g. Recyc@2026 or last 4 digits of phone)
    const initialPlainPassword = `Recyc@${cleanPhone.slice(-4) || "2026"}`;
    const hashedPassword = await hashPassword(initialPlainPassword);

    // Resolve default hub for this county
    const defaultHubName = getDefaultHubForCounty(county);
    const matchedHub = await db.collection("hubs").findOne({
      $or: [
        { name: { $regex: county, $options: "i" } },
        { "location.city": { $regex: county, $options: "i" } },
        { name: defaultHubName },
      ],
    });

    const newSupplier = {
      email: `${supplierCode.toLowerCase()}@recycworks.ke`,
      password: hashedPassword,
      firstName,
      lastName,
      businessName: businessName || `${firstName}'s Yard`,
      phoneNumber: cleanPhone,
      role: "supplier",
      isAdmin: false,
      supplierCode,
      county,
      subCounty: subCounty || "",
      gpsCoordinates: gpsCoordinates || "",
      supplierType: supplierType || "Aggregator",
      status: "active",
      initialPassword: initialPlainPassword,
      fieldOfficerId: officer?.userId ? officer.userId : null,
      fieldOfficerName: officer?.email ? officer.email : "Field Operations",
      hubId: matchedHub ? matchedHub._id.toString() : null,
      hubName: matchedHub ? matchedHub.name : defaultHubName,
      notes: notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newSupplier);

    // Also register audit log
    await db.collection("audit_logs").insertOne({
      userId: officer?.userId || "field_officer",
      action: "SUPPLIER_ONBOARDED",
      entityType: "user",
      entityId: result.insertedId.toString(),
      details: {
        supplierCode,
        name: `${firstName} ${lastName}`,
        phone: cleanPhone,
        county,
      },
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Supplier successfully registered and activated.",
        supplier: {
          id: result.insertedId.toString(),
          supplierCode,
          name: `${firstName} ${lastName}`.trim(),
          businessName: newSupplier.businessName,
          phoneNumber: cleanPhone,
          initialPassword: initialPlainPassword,
          hubName: newSupplier.hubName,
          county,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Field Officer Supplier Onboarding Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to onboard supplier" },
      { status: 500 }
    );
  }
}
