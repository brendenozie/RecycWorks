import { getDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { hashPassword, generateLoginCode } from "@/lib/auth";

// Helper to normalize status values for storage
function normalizeStatus(status?: string): "active" | "suspended" | "pending_verification" {
  if (!status) return "active";
  const s = status.toLowerCase();
  if (s === "suspended") return "suspended";
  if (s === "reviewing" || s === "pending_verification" || s === "pending") return "pending_verification";
  return "active";
}

// --- GET: Fetch Accounts (Filtered by Pipeline Role or Global Matrix) ---
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role"); // "supplier" | "driver"

    // Construct reactive query structure based on parsed URL search criteria
    const query: Record<string, any> = {};
    if (roleFilter) {
      query.role = roleFilter;
    }

    const rawUsers = await db.collection("users").find(query).sort({ createdAt: -1 }).toArray();

    // Map fields so the data model matches front-end constraints and backfill loginCode if missing
    const cleanUsers = await Promise.all(
      rawUsers.map(async (user) => {
        let code = user.loginCode || user.supplierCode;
        if (!code) {
          code = await generateLoginCode(db);
          // Auto-backfill in MongoDB so every existing user has a login code
          await db.collection("users").updateOne(
            { _id: user._id },
            { $set: { loginCode: code } },
          );
        }

        const s = (user.status || "active").toLowerCase();
        const uiStatus =
          s === "suspended" ? "Suspended" :
          s === "pending_verification" || s === "reviewing" ? "Reviewing" :
          "Active";

        return {
          _id: user._id.toString(),
          id: user._id.toString(),
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.name ||
            "Unnamed Node",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          role: user.role || "operations",
          loginCode: code,
          status: uiStatus,
          rawStatus: user.status || "active",
          area: user.area || user.hubId || "Nairobi Central",
          hubId: user.hubId || user.area || "Nairobi Central",
          verified: user.verified !== false,
          provider: user.provider || (user.password ? "credentials" : "google"),
          createdAt: user.createdAt,
        };
      }),
    );

    return NextResponse.json(cleanUsers);
  } catch (error) {
    console.error("[RecycWorks Users Engine Error]:", error);
    return NextResponse.json(
      { error: "Failed to query relational identity nodes" },
      { status: 500 },
    );
  }
}

// --- POST: Provision New Security Access Manually ---
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phoneNumber = (body.phoneNumber || "").trim();
    const role = body.role || "hub-manager";
    const area = (body.area || body.hubId || "Nairobi Central").trim();
    const rawPassword = body.password;

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 },
      );
    }

    // Require valid password for credentials login
    if (!rawPassword || typeof rawPassword !== "string" || rawPassword.trim().length < 8) {
      return NextResponse.json(
        { error: "Password is required and must be at least 8 characters long for system security" },
        { status: 400 },
      );
    }

    // Check if account already exists
    const existing = await db.collection("users").findOne({
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 },
      );
    }

    // Securely hash password using bcrypt (12 rounds)
    const hashedPassword = await hashPassword(rawPassword.trim());
    const status = normalizeStatus(body.status);
    const isAdmin = role === "admin" || role === "super_admin" || !!body.isAdmin;
    const loginCode = (body.loginCode && typeof body.loginCode === "string" && body.loginCode.trim() !== "")
      ? body.loginCode.trim().toUpperCase()
      : await generateLoginCode(db);

    const newUser: Record<string, any> = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim() || email.split("@")[0],
      email,
      phoneNumber,
      password: hashedPassword,
      loginCode,
      role,
      isAdmin,
      area,
      hubId: area,
      status,
      verified: body.verified !== false,
      emailVerified: true, // Ensures user is not locked out by email verification
      provider: "credentials",
      onboardingStep: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
      supplierProfile:
        role === "supplier"
          ? {
              hubId: area,
              totalWeightSupplied: 0,
              totalEarnings: 0,
              activeBatches: 0,
              primaryMaterial: "N/A",
            }
          : null,
      driverProfile:
        role === "driver"
          ? {
              licenseNumber: "",
              vehiclePlate: "",
              assignedHubId: area,
              verifiedLoads: 0,
              rating: 5,
            }
          : null,
    };

    const result = await db.collection("users").insertOne(newUser);
    const { password: _, ...cleanNewUser } = newUser;

    return NextResponse.json(
      {
        message: "User account created successfully",
        _id: result.insertedId.toString(),
        id: result.insertedId.toString(),
        loginCode,
        ...cleanNewUser,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[RecycWorks User Creation Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Provision workflow failure" },
      { status: 500 },
    );
  }
}

// --- DELETE: Revoke Security Access ---
export async function DELETE(request: Request) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Target account token ID parameter required" },
        { status: 400 },
      );
    }

    await db.collection("users").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      success: true,
      message: "Security matrix link detached",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Revoke operational failure" },
      { status: 500 },
    );
  }
}

// --- PUT: Update Existing User & Credentials ---
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = await getDatabase();

    const { id, _id, password, ...updateData } = body;
    const userId = id || _id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch {
      return NextResponse.json(
        { error: "Invalid User ID format" },
        { status: 400 },
      );
    }

    const existingUser = await db.collection("users").findOne({ _id: userObjectId });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update payload
    const setPayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    // If updating email, ensure it's not a duplicate
    if (updateData.email && typeof updateData.email === "string") {
      const cleanEmail = updateData.email.trim().toLowerCase();
      const duplicate = await db.collection("users").findOne({
        _id: { $ne: userObjectId },
        email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Another account is already using this email address" },
          { status: 409 },
        );
      }
      setPayload.email = cleanEmail;
    }

    if (updateData.firstName !== undefined) {
      setPayload.firstName = updateData.firstName.trim();
    }
    if (updateData.lastName !== undefined) {
      setPayload.lastName = updateData.lastName.trim();
    }
    if (updateData.firstName !== undefined || updateData.lastName !== undefined) {
      const fName = updateData.firstName !== undefined ? updateData.firstName.trim() : (existingUser.firstName || "");
      const lName = updateData.lastName !== undefined ? updateData.lastName.trim() : (existingUser.lastName || "");
      setPayload.name = `${fName} ${lName}`.trim();
    }

    if (updateData.phoneNumber !== undefined) {
      setPayload.phoneNumber = updateData.phoneNumber.trim();
    }

    if (updateData.role !== undefined) {
      setPayload.role = updateData.role;
      setPayload.isAdmin = updateData.role === "admin" || updateData.role === "super_admin" || !!updateData.isAdmin;
    }

    if (updateData.area !== undefined) {
      setPayload.area = updateData.area.trim();
      setPayload.hubId = updateData.area.trim();
    }

    if (updateData.status !== undefined) {
      setPayload.status = normalizeStatus(updateData.status);
    }

    if (updateData.verified !== undefined) {
      setPayload.verified = updateData.verified !== false;
    }

    // If user does not have a loginCode, or admin requested regeneration, assign one
    if (!existingUser.loginCode || body.regenerateLoginCode) {
      setPayload.loginCode = await generateLoginCode(db);
    } else if (body.loginCode && typeof body.loginCode === "string" && body.loginCode.trim() !== "") {
      setPayload.loginCode = body.loginCode.trim().toUpperCase();
    }

    // If password is being updated, enforce strength rules and hash it
    if (password && typeof password === "string" && password.trim() !== "") {
      if (password.trim().length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters for system security" },
          { status: 400 },
        );
      }

      // Hash the new password securely and ensure provider allows credentials login
      setPayload.password = await hashPassword(password.trim());
      setPayload.provider = "credentials";
      setPayload.emailVerified = true;
    }

    const result = await db.collection("users").updateOne(
      { _id: userObjectId },
      { $set: setPayload },
    );

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      modified: result.modifiedCount,
      loginCode: setPayload.loginCode || existingUser.loginCode,
    });
  } catch (error: any) {
    console.error("[RecycWorks Update Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update user payload configuration" },
      { status: 500 },
    );
  }
}