import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: "admin" | "operations" | "supplier" | "driver";
      hubId?: string | null; // The specific Kenya Hub they belong to
      status: string;
      emailVerified?: boolean;
      createdAt?: Date | string;
      driverProfile?: {
        vehiclePlate?: string;
        licenseNumber?: string;
        assignedHubId?: string;
      } | null;
    } & DefaultSession["user"];
    appToken: string;
  }

  interface User extends DefaultUser {
    firstName?: string;
    lastName?: string;
    role?: string;
    hubId?: string | null;
    status?: string;
    driverProfile?: {
      vehiclePlate?: string;
      licenseNumber?: string;
      assignedHubId?: string;
    } | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: string;
    firstName: string;
    lastName: string;
    role: "admin" | "operations" | "supplier" | "driver";
    hubId?: string | null;
    emailVerified?: boolean;
    createdAt?: Date | string;
    appToken: string;
  }
}
