#!/usr/bin/env node

/**
 * Admin Password Reset Script
 * This script resets the super admin password and displays the new credentials
 * Run with: node scripts/get-admin-password.js
 */

require("dotenv").config();
const mongodb = require("mongodb");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

async function resetAdminPassword() {
  let client;
  try {
    // console.log("🔑 Admin Password Reset Script\n");

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set in environment variables");
    }

    client = new mongodb.MongoClient(mongoUri);
    await client.connect();

    const db = client.db("RecycWorks");

    // Find super admin
    const superAdmin = await db
      .collection("admins")
      .findOne({ role: "super_admin" });

    if (!superAdmin) {
      // console.log("❌ No super admin found. Please run: node scripts/seed-admin.js\n");
      await client.close();
      process.exit(1);
    }

    // console.log("✅ Found super admin:");
    // console.log(`   Email: ${superAdmin.email}`);
    // console.log(`   Name: ${superAdmin.firstName} ${superAdmin.lastName}\n`);

    // Set fixed password for easy access
    const fixedPassword = "1234567890";
    const hashedPassword = await bcrypt.hash(fixedPassword, 12);

    // Update password
    const result = await db
      .collection("admins")
      .updateOne(
        { _id: superAdmin._id },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        }
      );

    if (result.modifiedCount === 0) {
      throw new Error("Failed to update password");
    }

    // console.log("✅ Password has been set!\n");
    // console.log("🔐 LOGIN CREDENTIALS:");
    // console.log("───────────────────────────────────");
    // console.log(`📧 Email:    ${superAdmin.email}`);
    // console.log(`🔑 Password: ${fixedPassword}`);
    // console.log("───────────────────────────────────\n");
    // console.log("⚠️  Please save these credentials securely!");
    // console.log("📍 Login at: http://localhost:3000/admin/login\n");

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

resetAdminPassword();
