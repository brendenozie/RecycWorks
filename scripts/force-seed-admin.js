#!/usr/bin/env node

/**
 * Force Admin Seeder Script
 * This script DELETES and recreates a default super admin user in the database
 * Run with: node scripts/force-seed-admin.js
 */

require("dotenv").config();
const mongodb = require("mongodb");
const bcrypt = require("bcryptjs");

async function forceSeededAdmin() {
  let client;
  try {
    // console.log("🌱 Starting FORCE admin seeder...\n");

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    client = new mongodb.MongoClient(mongoUri);
    await client.connect();

    const db = client.db(process.env.MONGODB_DB_NAME || "ready-pips");

    // DELETE existing admin if it exists
    // console.log("🗑️  Deleting existing admin account...");
    const deleteResult = await db.collection("admins").deleteMany({ email: "admin@RecycWorks.com" });
    if (deleteResult.deletedCount > 0) {
      // console.log(`✅ Deleted ${deleteResult.deletedCount} existing admin(s)\n`);
    } else {
      // console.log("ℹ️  No existing admin found\n");
    }

    // Set fixed password for easy access during development
    const tempPassword = "1234567890";
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Define super admin permissions
    const allPermissions = [
      "view_users",
      "create_user",
      "edit_user",
      "delete_user",
      "view_admins",
      "create_admin",
      "edit_admin",
      "delete_admin",
      "view_subscriptions",
      "manage_subscriptions",
      "manage_payments",
      "view_tools",
      "manage_tools",
      "manage_announcements",
      "manage_campaigns",
      "view_analytics",
      "manage_settings",
    ];

    // Create new super admin
    const superAdmin = {
      email: "admin@RecycWorks.com",
      password: hashedPassword,
      firstName: "GiF",
      lastName: "Tech",
      role: "super_admin",
      permissions: allPermissions,
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
    };

    const result = await db.collection("admins").insertOne(superAdmin);

    // console.log("✨ Super Admin Created Successfully!\n");
    // console.log("━".repeat(50));
    // console.log("📊 ADMIN CREDENTIALS");
    // console.log("━".repeat(50));
    // console.log(`Email:    ${superAdmin.email}`);
    // console.log(`Password: ${tempPassword}`);
    // console.log(`Role:     ${superAdmin.role}`);
    // console.log("━".repeat(50));
    // console.log("\n⚠️  IMPORTANT:");
    // console.log("1. Save these credentials in a secure location");
    // console.log("2. Login to the admin dashboard at: /admin/login");
    // console.log("3. Change the password after first login");
    // console.log("\n✅ Admin account created successfully!");

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

forceSeededAdmin();
