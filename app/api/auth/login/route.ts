import { NextRequest, NextResponse } from "next/server";
import { findUser, verifyPassword, generateToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (body.loginCode || body.email || body.identifier || "").trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/Login Code and password are required" },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const safeRegex = new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

    // 1. Check the 'admins' collection (System-wide Super Admins)
    const admin = await db.collection("admins").findOne({
      $or: [
        { email: safeRegex },
        { loginCode: safeRegex },
      ],
    });

    if (admin) {
      if (!admin.password) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 },
        );
      }

      const isValidPassword = await verifyPassword(password, admin.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 },
        );
      }

      // Generate token with Super Admin role
      const token = generateToken(
        admin._id.toString(),
        admin.email,
        "admin",
        true,
      );

      const { password: _, ...adminData } = admin;

      const response = NextResponse.json({
        message: "Admin login successful",
        token,
        user: {
          ...adminData,
          _id: admin._id.toString(),
          role: "admin",
          isAdmin: true,
        },
      });

      response.cookies.set("token", token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return response;
    }

    // 2. Check the 'users' collection (Operations, Suppliers, Drivers, Hub Managers, etc.)
    const user = await findUser(identifier);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!user.password) {
      if (user.provider === "google") {
        return NextResponse.json(
          {
            error:
              "This account was registered using Google Sign-In. Please sign in with Google.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 3. Status Verification (Important for the RecycWorks onboarding flow)
    const normalizedStatus = (user.status || "active").toLowerCase();
    if (normalizedStatus === "suspended") {
      return NextResponse.json(
        {
          error:
            "Your account has been suspended. Please contact your Hub manager.",
        },
        { status: 403 },
      );
    }

    if (normalizedStatus === "pending_verification" || normalizedStatus === "reviewing") {
      return NextResponse.json(
        {
          error:
            "Your account is currently under review by the operations team.",
        },
        { status: 403 },
      );
    }

    // 4. Generate token with operational context (Role + Hub)
    const token = generateToken(
      user._id!,
      user.email!,
      user.role,
      user.isAdmin || false,
    );

    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      message: "Login successful",
      token,
      user: {
        ...userWithoutPassword,
        isAdmin: user.isAdmin || false,
      },
    });

    response.cookies.set("token", token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("RecycWorks Login error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred" },
      { status: 500 },
    );
  }
}
