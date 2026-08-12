import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "RecycWorks-secure-key-2026";

export enum UserRole {
  SUPER_ADMIN = "super_admin", // Full system access
  OPERATIONS = "operations", // Hub management & Logistics verification
  SUPPLIER = "supplier", // Aggregators & SME recyclers
  DRIVER = "driver", // Transit & Mobile verification
}

export enum AppPermission {
  // Logistics & Fleet
  VIEW_FLEET = "view_fleet",
  VERIFY_LOAD = "verify_load",
  UPDATE_TRANSIT = "update_transit",

  // Inventory & Products (The 16 streams)
  MANAGE_INVENTORY = "manage_inventory",
  UPDATE_PRICING = "update_pricing",

  // Financials
  VIEW_DIVIDENDS = "view_dividends",
  APPROVE_PAYMENTS = "approve_payments",

  // User & Hub Management
  MANAGE_HUBS = "manage_hubs",
  MANAGE_USERS = "manage_users",

  // Analytics (100T Goal)
  VIEW_ANALYTICS = "view_analytics",
  VIEW_AUDIT_LOGS = "view_logs",
}

// Role-based permissions mapping for RecycWorks
export const rolePermissions: { [key in UserRole]: AppPermission[] } = {
  [UserRole.SUPER_ADMIN]: Object.values(AppPermission),
  [UserRole.OPERATIONS]: [
    AppPermission.VIEW_FLEET,
    AppPermission.VERIFY_LOAD,
    AppPermission.MANAGE_INVENTORY,
    AppPermission.VIEW_ANALYTICS,
    AppPermission.UPDATE_TRANSIT,
  ],
  [UserRole.SUPPLIER]: [
    AppPermission.VIEW_DIVIDENDS,
    AppPermission.MANAGE_INVENTORY, // Only their own
    AppPermission.VIEW_ANALYTICS, // Their personal impact
  ],
  [UserRole.DRIVER]: [
    AppPermission.UPDATE_TRANSIT,
    AppPermission.VIEW_FLEET, // Limited to their own vehicle
  ],
};

export interface RecycUser {
  _id?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  hubId?: string | null; // Critical for Operations/Suppliers
  permissions: AppPermission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generates a scoped JWT for the application
 */
export function generateToken(
  userId: string,
  email: string,
  role: string,
): string {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Hashes a password for manual driver/supplier credentials if not using Google
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Records an operational audit (e.g., "Load Verified", "Payment Triggered")
 */
export async function recordAction(
  userId: string,
  action: string,
  details: any = {},
): Promise<void> {
  const db = await getDatabase();
  await db.collection("audit_logs").insertOne({
    userId,
    action,
    details,
    timestamp: new Date(),
  });
}

// Helper to check permissions on the fly
export async function canPerform(
  userId: string,
  requiredPermission: AppPermission,
): Promise<boolean> {
  const db = await getDatabase();
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userId) });
  if (!user || !user.isActive) return false;

  // Super admins bypass all checks
  if (user.role === UserRole.SUPER_ADMIN) return true;

  return user.permissions.includes(requiredPermission);
}
