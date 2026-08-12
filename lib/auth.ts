import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "RecycWorks-secure-key-2026";

// Roles aligned with the RecycWorks model
export type UserRole = "admin" | "operations" | "supplier" | "driver";

/** 📦 16-PRODUCT STREAM LEDGER (Replaces Affiliate Stats) */
export interface SupplierLedger {
  hubId: string;
  totalWeightSupplied: number; // in kg
  totalEarnings: number; // KES
  activeBatches: number;
  primaryMaterial: string; // e.g., "PET-A" or "HDPE"
}

/** 🚚 FLEET & LOGISTICS PROFILE */
export interface DriverProfile {
  licenseNumber: string;
  vehiclePlate: string;
  assignedHubId: string;
  verifiedLoads: number;
  rating: number;
}

export interface User {
  _id?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;

  /** 🔑 ROLE & SECURITY */
  role: UserRole;
  isAdmin: boolean;
  hubId?: string | null; // The Kenya CBC-aligned Hub they operate from

  /** 🧩 OPERATIONAL PROFILES */
  supplierProfile?: SupplierLedger | null;
  driverProfile?: DriverProfile | null;

  /** 📈 PERFORMANCE TRACKING (Replaces Subscriptions) */
  status: "active" | "suspended" | "pending_verification";
  onboardingStep: number; // 1 to 4

  emailVerified?: boolean;
  provider: "credentials" | "google";
  googleId?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* --- UTILS --- */

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(
  userId: string,
  email: string,
  role: string,
  isAdmin: boolean,
): string {
  return jwt.sign({ userId, email, role, isAdmin }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(
  token: string,
): { userId: string; email: string; role: UserRole; isAdmin: boolean } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

/* --- CORE FUNCTIONS --- */

export async function createUser(
  userData: Omit<User, "_id" | "createdAt" | "updatedAt">,
): Promise<User> {
  const db = await getDatabase();
  let hashedPassword = userData.password;

  if (userData.provider === "credentials" && userData.password) {
    hashedPassword = await hashPassword(userData.password);
  }

  const user: Omit<User, "_id"> = {
    ...userData,
    password: hashedPassword,
    role: userData.role || "supplier",
    isAdmin: userData.role === "admin",
    status: userData.role === "driver" ? "pending_verification" : "active",
    supplierProfile:
      userData.role === "supplier"
        ? {
            hubId: userData.hubId || "GENERAL",
            totalWeightSupplied: 0,
            totalEarnings: 0,
            activeBatches: 0,
            primaryMaterial: "N/A",
          }
        : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("users").insertOne(user);
  return { ...user, _id: result.insertedId.toString() };
}

export async function findUser(email: string): Promise<User | null> {
  const db = await getDatabase();
  const user = await db.collection("users").findOne({ email });
  if (!user) return null;

  return {
    _id: user._id.toString(),
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    role: user.role || "supplier",
    isAdmin: user.role === "admin" || !!user.isAdmin,
    hubId: user.hubId,
    supplierProfile: user.supplierProfile,
    driverProfile: user.driverProfile,
    status: user.status,
    emailVerified: user.emailVerified,
    provider: user.provider,
    googleId: user.googleId,
    image: user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    onboardingStep: user.onboardingStep || 1,
  };
}

/**
 * findUserById checks both collections and formats for the RecycWorks Dashboard
 */
export async function findUserById(id: string): Promise<User | null> {
  const db = await getDatabase();

  const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
  if (!user) return null;

  return {
    ...user,
    _id: user._id.toString(),
    role: user.role || "supplier",
    isAdmin: user.role === "admin" || !!user.isAdmin,
  } as User;
}

/**
 * Replaces 'trackReferralCommission'.
 * Tracks the "Wealth from Waste" flow when a load is verified.
 */
export async function processBatchCompletion(
  supplierId: string,
  batchData: { weight: number; rate: number; material: string },
) {
  const db = await getDatabase();
  const earning = batchData.weight * batchData.rate;

  // 1. Update Supplier's Ledger
  await db.collection("users").updateOne(
    { _id: new ObjectId(supplierId) },
    {
      $inc: {
        "supplierProfile.totalWeightSupplied": batchData.weight,
        "supplierProfile.totalEarnings": earning,
        "supplierProfile.activeBatches": 1,
      },
      $set: {
        "supplierProfile.primaryMaterial": batchData.material,
        updatedAt: new Date(),
      },
    },
  );

  // 2. Create the Dividend Record for the Dashboard
  await db.collection("dividends").insertOne({
    supplierId: new ObjectId(supplierId),
    weight: batchData.weight,
    amount: earning,
    material: batchData.material,
    timestamp: new Date(),
  });
}
