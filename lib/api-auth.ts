import { NextRequest, NextResponse } from "next/server";
import { verifyToken, UserRole } from "./auth";
import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    field?: string | null;
    requestId: string;
  };
}

/**
 * Generates a unique request ID for tracing and error debugging
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Standardized JSON success response helper
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Standardized JSON error response helper conforming to:
 * { error: { code, message, field, requestId } }
 */
export function apiError(
  code: string,
  message: string,
  status: number = 400,
  field: string | null = null,
  customRequestId?: string
): NextResponse {
  const requestId = customRequestId || generateRequestId();
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      field: field || null,
      requestId,
    },
  };
  return NextResponse.json(body, { status });
}

/**
 * Extracts and verifies authenticated user from Request Authorization header or cookies
 */
export async function authenticateApiUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    // Check cookies fallback
    token = request.cookies.get("token")?.value || request.cookies.get("next-auth.session-token")?.value || null;
  }

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return null;

  return {
    userId: decoded.userId,
    email: decoded.email,
    role: ((decoded.role as string) || "supplier").toLowerCase(),
    isAdmin: !!decoded.isAdmin || (decoded.role as string) === "admin" || (decoded.role as string) === "super_admin",
  };
}

/**
 * Enforces role-based authorization matrix
 */
export function authorizeRoles(
  user: AuthenticatedUser | null,
  allowedRoles: string[]
): { authorized: boolean; errorResponse?: NextResponse } {
  if (!user) {
    return {
      authorized: false,
      errorResponse: apiError("UNAUTHORIZED", "Authentication required to access this resource.", 401),
    };
  }

  const normalizedRole = user.role.toLowerCase();
  const isSuperAdmin = normalizedRole === "super_admin";
  const isAdmin = normalizedRole === "admin" || user.isAdmin;

  // Super admin always has access
  if (isSuperAdmin) {
    return { authorized: true };
  }

  // Admin allowed if admin in allowedRoles
  if (isAdmin && (allowedRoles.includes("admin") || allowedRoles.includes("super_admin"))) {
    return { authorized: true };
  }

  // Exact role match
  if (allowedRoles.includes(normalizedRole)) {
    return { authorized: true };
  }

  return {
    authorized: false,
    errorResponse: apiError(
      "FORBIDDEN",
      `Role '${user.role}' is not authorized to perform this operation.`,
      403
    ),
  };
}

/**
 * Writes an immutable audit trail entry
 */
export async function logAuditEvent(entry: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  details?: any;
  metadata?: any;
}): Promise<void> {
  try {
    const db = await getDatabase();
    await db.collection("audit_logs").insertOne({
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before || null,
      after: entry.after || null,
      details: entry.details || entry.metadata || null,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

/**
 * Idempotency verification and persistence
 * Returns existing record if key has already been executed for the given scope.
 */
export async function checkAndStoreIdempotency(
  key: string | null,
  scope: string,
  resultProducer: () => Promise<any>
): Promise<{ result: any; fromCache: boolean }> {
  if (!key || !key.trim()) {
    const result = await resultProducer();
    return { result, fromCache: false };
  }

  const cleanKey = key.trim();
  const db = await getDatabase();
  const collection = db.collection("idempotency_keys");

  // Check if idempotency record already exists
  const existing = await collection.findOne({ key: cleanKey, scope });
  if (existing) {
    return { result: existing.response, fromCache: true };
  }

  // Produce result
  const result = await resultProducer();

  // Store result
  try {
    await collection.insertOne({
      key: cleanKey,
      scope,
      response: result,
      createdAt: new Date(),
    });
  } catch (err) {
    // If concurrent insert occurred, fetch the winning one
    const concurrent = await collection.findOne({ key: cleanKey, scope });
    if (concurrent) {
      return { result: concurrent.response, fromCache: true };
    }
  }

  return { result, fromCache: false };
}
