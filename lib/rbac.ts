import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export type UserRole =
  | "Super Admin"
  | "Lead Logistics"
  | "Hub Manager"
  | "Supplier Tier 1"
  | "Driver";

export function withRole(allowedRoles: UserRole[], handler: Function) {
  return async (request: Request, ...args: any[]) => {
    try {
      // 1. Identify the user (In a real app, you'd get this from a JWT/Cookie session)
      // For this implementation, we'll look for a 'x-user-role' header for testing
      const headerList = headers();
      const userRole = (await headerList).get("x-user-role") as UserRole;

      if (!userRole) {
        return NextResponse.json(
          { error: "Authentication Required" },
          { status: 401 },
        );
      }

      // 2. Check Permissions
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
          {
            error: `Access Denied: ${userRole} is not authorized for this action.`,
          },
          { status: 403 },
        );
      }

      // 3. Authorized -> Proceed to the actual API logic
      return handler(request, ...args);
    } catch (error) {
      return NextResponse.json(
        { error: "Internal Security Error" },
        { status: 500 },
      );
    }
  };
}
