import { NextRequest, NextResponse } from "next/server";
import { findUser, verifyPassword, generateToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const db = await getDatabase();

    // 1. Check the 'admins' collection (System-wide Super Admins)
    const admin = await db.collection("admins").findOne({ email });

    if (admin) {
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

      return NextResponse.json({
        message: "Admin login successful",
        token,
        user: {
          ...adminData,
          _id: admin._id.toString(),
          role: "admin",
          isAdmin: true,
        },
      });
    }

    // 2. Check the 'users' collection (Operations, Suppliers, Drivers)
    const user = await findUser(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isValidPassword = await verifyPassword(password, user.password!);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 3. Status Verification (Important for the RecycWorks onboarding flow)
    if (user.status === "suspended") {
      return NextResponse.json(
        {
          error:
            "Your account has been suspended. Please contact your Hub manager.",
        },
        { status: 403 },
      );
    }

    if (user.status === "pending_verification") {
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

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        ...userWithoutPassword,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (error) {
    console.error("RecycWorks Login error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred" },
      { status: 500 },
    );
  }
}
