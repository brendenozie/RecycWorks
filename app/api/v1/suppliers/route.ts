import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

/**
 * GET /api/v1/suppliers
 * Lists registered suppliers
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin", "operations", "accounts"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const queryTerm = searchParams.get("q");

    let filter: Record<string, any> = { role: "supplier" };
    if (queryTerm && queryTerm.trim()) {
      filter.$or = [
        { businessName: { $regex: queryTerm.trim(), $options: "i" } },
        { firstName: { $regex: queryTerm.trim(), $options: "i" } },
        { lastName: { $regex: queryTerm.trim(), $options: "i" } },
        { supplierCode: { $regex: queryTerm.trim(), $options: "i" } },
        { phoneNumber: { $regex: queryTerm.trim(), $options: "i" } },
      ];
    }

    const suppliers = await db
      .collection("users")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const items = suppliers.map((s) => ({
      id: s._id.toString(),
      name: s.businessName || `${s.firstName} ${s.lastName}`.trim(),
      code: s.supplierCode || `RW-${s._id.toString().slice(-4).toUpperCase()}`,
      phone: s.phoneNumber || "",
      county: s.county || "Nairobi",
      subCounty: s.subCounty || "",
      supplierType: s.supplierType || "Aggregator",
      status: s.status || "active",
      createdAt: s.createdAt,
    }));

    return apiSuccess({ items, count: items.length });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch suppliers", 500);
  }
}

/**
 * POST /api/v1/suppliers
 * Field Officer or Admin registers a new supplier.
 * Server attributes createdById and generates supplierCode authoritatively.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const { name, businessName, phone, phoneNumber, county, subCounty, supplierType, initialPassword } = body;

    const officialName = (businessName || name || "").trim();
    const cleanPhone = (phoneNumber || phone || "").trim();

    if (!officialName) {
      return apiError("VALIDATION_ERROR", "Supplier / business name is required.", 422, "name");
    }
    if (!cleanPhone) {
      return apiError("VALIDATION_ERROR", "Contact phone number is required.", 422, "phone");
    }

    const db = await getDatabase();

    // Check duplicate phone
    const existing = await db.collection("users").findOne({ phoneNumber: cleanPhone });
    if (existing) {
      return apiError("CONFLICT", `Supplier with phone number '${cleanPhone}' already exists.`, 409, "phone");
    }

    const count = await db.collection("users").countDocuments({ role: "supplier" });
    const supplierCode = `RW-${1001 + count}`;
    const syntheticEmail = `supplier_${cleanPhone.replace(/[^0-9]/g, "").slice(-9)}@recycworks.ke`;

    const defaultPwd = initialPassword || "Recyc2026!";
    const hashedPassword = await hashPassword(defaultPwd);

    const newSupplierDoc = {
      email: syntheticEmail,
      password: hashedPassword,
      firstName: officialName.split(" ")[0] || officialName,
      lastName: officialName.split(" ").slice(1).join(" ") || "Yard",
      businessName: officialName,
      phoneNumber: cleanPhone,
      role: "supplier",
      isAdmin: false,
      supplierCode,
      county: county || "Nairobi",
      subCounty: subCounty || "",
      supplierType: supplierType || "Aggregator",
      status: "active",
      initialPassword: defaultPwd,
      fieldOfficerId: user!.userId, // Authoritative server attribution (Section 72)
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection("users").insertOne(newSupplierDoc);
    const supplierId = insertResult.insertedId.toString();

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "SUPPLIER_REGISTERED",
      entityType: "SUPPLIER",
      entityId: supplierId,
      after: { name: officialName, supplierCode, phone: cleanPhone },
    });

    return apiSuccess(
      {
        id: supplierId,
        code: supplierCode,
        name: officialName,
        phone: cleanPhone,
        supplierType: newSupplierDoc.supplierType,
        status: "active",
        createdAt: newSupplierDoc.createdAt,
      },
      201
    );
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to register supplier", 500);
  }
}
