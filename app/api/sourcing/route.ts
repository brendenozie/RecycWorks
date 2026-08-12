import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

function extractTokenUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;
  return token ? verifyToken(token) : null;
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    const tokenUser = extractTokenUser(request);

    const {
      // Material specs
      materialName,
      grade,
      materialGroup,
      estimatedWeightKg,
      pricePerKg,

      // Hub details
      hubId,
      hubName,
      city,
      neighborhood,

      // Supplier details (for unauthenticated or new suppliers)
      supplierEmail,
      supplierPhone,
      supplierFirstName,
      supplierLastName,

      pickupAddress,
      notes,
    } = body;

    // Basic Validation
    if (!materialName || !grade || !estimatedWeightKg || !pickupAddress) {
      return NextResponse.json(
        {
          error:
            "Missing required core fields (materialName, grade, estimatedWeightKg, pickupAddress)",
        },
        { status: 400 },
      );
    }

    // =========================================================================
    // STEP 1: RESOLVE OR AUTO-CREATE SUPPLIER
    // =========================================================================
    let resolvedSupplierId: ObjectId;
    let supplierDisplayName = "Guest Supplier";

    if (tokenUser && tokenUser.userId) {
      resolvedSupplierId = new ObjectId(tokenUser.userId);
      supplierDisplayName = tokenUser.email || "Authenticated Supplier";
    } else if (supplierEmail || supplierPhone) {
      // Search for existing user by email or phone
      const queryOr = [];
      if (supplierEmail)
        queryOr.push({ email: supplierEmail.toLowerCase().trim() });
      if (supplierPhone) queryOr.push({ phoneNumber: supplierPhone.trim() });

      const existingSupplier = await db
        .collection("users")
        .findOne({ $or: queryOr });

      if (existingSupplier) {
        resolvedSupplierId = existingSupplier._id;
        supplierDisplayName =
          `${existingSupplier.firstName} ${existingSupplier.lastName}`.trim() ||
          existingSupplier.email;
      } else {
        // Auto-provision new provisional supplier
        const newSupplierResult = await db.collection("users").insertOne({
          firstName: supplierFirstName || "Provisional",
          lastName: supplierLastName || "Supplier",
          email: supplierEmail
            ? supplierEmail.toLowerCase().trim()
            : `provisional_${Date.now()}@recycworks.local`,
          phoneNumber: supplierPhone ? supplierPhone.trim() : "",
          role: "supplier",
          status: "provisional", // Requires password setup later
          onboardingStep: 1,
          createdAt: new Date(),
        });
        resolvedSupplierId = newSupplierResult.insertedId;
        supplierDisplayName = `${supplierFirstName || "Provisional"} ${supplierLastName || "Supplier"}`;
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Supplier authentication token or contact information (email/phone) is required",
        },
        { status: 400 },
      );
    }

    // =========================================================================
    // STEP 2: RESOLVE OR AUTO-CREATE HUB
    // =========================================================================
    let resolvedHubId: ObjectId;
    let resolvedHubName = hubName || "Default Hub";

    if (hubId && ObjectId.isValid(hubId)) {
      const existingHub = await db
        .collection("hubs")
        .findOne({ _id: new ObjectId(hubId) });
      if (existingHub) {
        resolvedHubId = existingHub._id;
        resolvedHubName = existingHub.name;
      }
    }

    // If hub is not resolved via ID, attempt lookup by name or provision a new hub
    if (!resolvedHubId!) {
      const targetHubName = (
        hubName || `${city || "Nairobi"} Processing Hub`
      ).trim();

      const existingHubByName = await db.collection("hubs").findOne({
        name: { $regex: new RegExp(`^${targetHubName}$`, "i") },
      });

      if (existingHubByName) {
        resolvedHubId = existingHubByName._id;
        resolvedHubName = existingHubByName.name;

        // Ensure supplier is listed under hub's supplierIds
        await db
          .collection("hubs")
          .updateOne(
            { _id: resolvedHubId },
            { $addToSet: { supplierIds: resolvedSupplierId.toString() } },
          );
      } else {
        // Auto-provision new Hub
        const newHubResult = await db.collection("hubs").insertOne({
          name: targetHubName,
          location: {
            country: "Kenya",
            city: city || "Nairobi",
            neighborhood: neighborhood || "Industrial Area",
          },
          load: 0,
          status: "Optimal",
          supplierIds: [resolvedSupplierId.toString()],
          coords: {
            x: `${Math.floor(Math.random() * 60 + 20)}%`,
            y: `${Math.floor(Math.random() * 50 + 25)}%`,
          },
          createdAt: new Date(),
        });
        resolvedHubId = newHubResult.insertedId;
        resolvedHubName = targetHubName;
      }
    }

    // =========================================================================
    // STEP 3: RESOLVE OR AUTO-CREATE MATERIAL & GRADE STREAM
    // =========================================================================
    const cleanMaterialName = materialName.trim();
    const cleanGradeName = grade.trim();

    const existingCategory = await db
      .collection("feedstockCategories")
      .findOne({
        name: { $regex: new RegExp(`^${cleanMaterialName}$`, "i") },
      });

    if (existingCategory) {
      // Category exists — append grade if missing
      if (!existingCategory.grades.includes(cleanGradeName)) {
        await db.collection("feedstockCategories").updateOne(
          { _id: existingCategory._id },
          {
            $addToSet: { grades: cleanGradeName },
            $set: { updatedAt: new Date() },
          },
        );
      }
    } else {
      // Auto-provision new feedstock category
      await db.collection("feedstockCategories").insertOne({
        name: cleanMaterialName,
        group: materialGroup || "Polymers & Synthetics",
        grades: [cleanGradeName],
        totalWeight: "0 kg",
        activeOrders: 1,
        status: "Stable",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // =========================================================================
    // STEP 4: CREATE SOURCING ORDER
    // =========================================================================
    const requestNo = `SRC-${Math.floor(100000 + Math.random() * 900000)}`;
    const ratePerKg = Number(pricePerKg) || 18; // Default KES rate

    const newSourcingRequest = {
      requestNo,
      supplierId: resolvedSupplierId,
      supplierName: supplierDisplayName,
      hubId: resolvedHubId,
      hubName: resolvedHubName,
      materialName: cleanMaterialName,
      grade: cleanGradeName,
      estimatedWeightKg: Number(estimatedWeightKg),
      actualWeightKg: null,
      pricePerKg: ratePerKg,
      pickupAddress,
      notes: notes || "",
      status: "pending",
      driverId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection("sourcing_requests")
      .insertOne(newSourcingRequest);

    return NextResponse.json(
      {
        message: "Sourcing request provisioned and committed successfully",
        sourcingOrder: {
          id: result.insertedId.toString(),
          ...newSourcingRequest,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[RecycWorks Sourcing Dynamic Provision Error]:", error);
    return NextResponse.json(
      { error: "Failed to process dynamic sourcing dispatch pipeline" },
      { status: 500 },
    );
  }
}
