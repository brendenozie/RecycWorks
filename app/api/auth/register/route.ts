import { NextRequest, NextResponse } from "next/server";
import { createUser, findUser } from "@/lib/auth";
import jwt from "jsonwebtoken";
import { sendEmail, emailTemplates } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role, // supplier | driver | hub-manager
      hubId, // Associated Kenyan Hub (e.g., Nairobi Central, Mombasa East)
    } = await request.json();

    // 1. RecycWorks Validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !password ||
      !role
    ) {
      return NextResponse.json(
        { error: "All operational fields are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters for system security" },
        { status: 400 },
      );
    }

    // 2. Check for existing account
    const existingUser = await findUser(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "An account already exists with this email" },
        { status: 400 },
      );
    }

    // 3. Create User with RecycWorks specific defaults
    const user = await createUser({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      role: role as any,
      hubId: hubId || null,
      status: role === "driver" ? "pending_verification" : "active", // Drivers require manual vetting
      isAdmin: false,
      provider: "credentials",
      onboardingStep: 1, // For future multi-step onboarding processes
    });

    // 4. Verification Token Generation
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "48h" },
    );

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

    // 5. Send RecycWorks Branded Verification Email
    try {
      const emailSent = await sendEmail({
        to: user.email,
        // Using a cleaner template aligned with your "Waste to Wealth" branding
        ...emailTemplates.emailVerification(user.firstName, verificationUrl),
      });

      if (!emailSent) {
        console.warn("[RecycWorks] Verification email delivery failed");
      }
    } catch (emailError) {
      console.error("[RecycWorks] Email service error:", emailError);
    }

    return NextResponse.json(
      {
        message:
          "Registration successful. Please verify your email to access the dashboard.",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
          onboardingStep: user.onboardingStep,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[RecycWorks Registration Error]:", error);
    return NextResponse.json(
      { error: "A system error occurred during registration" },
      { status: 500 },
    );
  }
}
