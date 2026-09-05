import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

// Type definition for safe PrismaClient access
let PrismaClientClass: any = null;
try {
  const prismaModule = require("@prisma/client");
  PrismaClientClass = prismaModule.PrismaClient;
} catch (e) {
  // Prisma client will be generated after schema validation
}

declare global {
  var prismaInstance: any | undefined;
}

let realPrisma: any = null;
if (PrismaClientClass) {
  if (process.env.NODE_ENV === "production") {
    realPrisma = new PrismaClientClass();
  } else {
    if (!global.prismaInstance) {
      global.prismaInstance = new PrismaClientClass();
    }
    realPrisma = global.prismaInstance;
  }
}

/**
 * Unified Prisma & MongoDB Client
 * Provides full Prisma MongoDB API alongside backwards-compatible helpers.
 */
export const prisma = realPrisma || {
  user: {
    findUnique: async ({ where }: { where: { email?: string; id?: string; supplierCode?: string } }) => {
      const db = await getDatabase();
      let query: any = {};

      if (where.email) {
        query.email = where.email.toLowerCase();
      } else if (where.supplierCode) {
        query.supplierCode = where.supplierCode;
      } else if (where.id && ObjectId.isValid(where.id)) {
        query._id = new ObjectId(where.id);
      }

      const user = await db.collection("users").findOne(query);
      if (!user) return null;

      return {
        id: user._id.toString(),
        _id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role || "supplier",
        isAdmin: !!user.isAdmin,
        supplierCode: user.supplierCode,
        businessName: user.businessName,
        county: user.county,
        subCounty: user.subCounty,
        hubId: user.hubId,
        hubName: user.hubName,
        fieldOfficerId: user.fieldOfficerId,
        status: user.status || "active",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    },

    findMany: async (args: any = {}) => {
      const db = await getDatabase();
      const query = args.where || {};
      const users = await db.collection("users").find(query).sort({ createdAt: -1 }).toArray();
      return users.map((u: any) => ({
        ...u,
        id: u._id.toString(),
        _id: u._id.toString(),
      }));
    },

    update: async ({ where, data }: { where: { id?: string; email?: string }; data: any }) => {
      const db = await getDatabase();
      let query: any = {};

      if (where.id && ObjectId.isValid(where.id)) {
        query._id = new ObjectId(where.id);
      } else if (where.email) {
        query.email = where.email;
      }

      const result = await db.collection("users").updateOne(
        query,
        { $set: { ...data, updatedAt: new Date() } }
      );
      return result;
    },

    create: async ({ data }: { data: any }) => {
      const db = await getDatabase();
      const userData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection("users").insertOne(userData);
      return {
        ...userData,
        id: result.insertedId.toString(),
        _id: result.insertedId.toString(),
      };
    },
  },

  load: {
    findMany: async (args: any = {}) => {
      const db = await getDatabase();
      const query = args.where || {};
      const loads = await db.collection("inventory").find(query).sort({ timestamp: -1 }).toArray();
      return loads.map((l: any) => ({
        ...l,
        id: l._id.toString(),
        _id: l._id.toString(),
      }));
    },
    findUnique: async ({ where }: { where: { id?: string; loadNumber?: string } }) => {
      const db = await getDatabase();
      let query: any = {};
      if (where.id && ObjectId.isValid(where.id)) query._id = new ObjectId(where.id);
      if (where.loadNumber) query.loadNumber = where.loadNumber;
      const load = await db.collection("inventory").findOne(query);
      if (!load) return null;
      return { ...load, id: load._id.toString(), _id: load._id.toString() };
    },
    create: async ({ data }: { data: any }) => {
      const db = await getDatabase();
      const loadData = { ...data, timestamp: new Date(), createdAt: new Date(), updatedAt: new Date() };
      const res = await db.collection("inventory").insertOne(loadData);
      return { ...loadData, id: res.insertedId.toString(), _id: res.insertedId.toString() };
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const db = await getDatabase();
      return db.collection("inventory").updateOne(
        { _id: new ObjectId(where.id) },
        { $set: { ...data, updatedAt: new Date() } }
      );
    },
  },

  hub: {
    findMany: async () => {
      const db = await getDatabase();
      const hubs = await db.collection("hubs").find({}).toArray();
      return hubs.map((h: any) => ({
        ...h,
        id: h._id.toString(),
        _id: h._id.toString(),
      }));
    },
  },

  passwordReset: {
    create: async ({ data }: { data: any }) => {
      const db = await getDatabase();
      const resetData = { ...data, createdAt: new Date() };
      const result = await db.collection("passwordResets").insertOne(resetData);
      return { id: result.insertedId.toString(), ...resetData };
    },
    findFirst: async ({ where }: { where: any }) => {
      const db = await getDatabase();
      let query: any = {};
      if (where.email) query.email = where.email;
      if (where.token) query.token = where.token;
      if (where.expiresAt?.gt) query.expiresAt = { $gt: where.expiresAt.gt };
      const reset = await db.collection("passwordResets").findOne(query);
      if (!reset) return null;
      return { id: reset._id.toString(), email: reset.email, token: reset.token, expiresAt: reset.expiresAt, createdAt: reset.createdAt };
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const db = await getDatabase();
      return db.collection("passwordResets").deleteOne({ _id: new ObjectId(where.id) });
    },
    deleteMany: async ({ where }: { where: any }) => {
      const db = await getDatabase();
      return db.collection("passwordResets").deleteMany(where);
    },
  },

  emailVerification: {
    create: async ({ data }: { data: any }) => {
      const db = await getDatabase();
      const verificationData = { ...data, createdAt: new Date() };
      const result = await db.collection("emailVerifications").insertOne(verificationData);
      return { id: result.insertedId.toString(), ...verificationData };
    },
    findFirst: async ({ where }: { where: any }) => {
      const db = await getDatabase();
      let query: any = {};
      if (where.email) query.email = where.email;
      if (where.token) query.token = where.token;
      const verification = await db.collection("emailVerifications").findOne(query);
      if (!verification) return null;
      return { id: verification._id.toString(), email: verification.email, token: verification.token, expiresAt: verification.expiresAt, createdAt: verification.createdAt };
    },
    deleteMany: async ({ where }: { where: any }) => {
      const db = await getDatabase();
      return db.collection("emailVerifications").deleteMany(where);
    },
  },
};

export default prisma;
