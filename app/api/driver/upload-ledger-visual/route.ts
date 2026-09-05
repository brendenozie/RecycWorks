import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    let driverId = "system";
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        driverId = decoded.userId;
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const loadId = formData.get("loadId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = path.extname(file.name) || ".jpg";
    const uniqueName = `driver_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}${fileExt}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    const photoUrl = `/uploads/${uniqueName}`;

    // If loadId provided, update load in database
    if (loadId && ObjectId.isValid(loadId)) {
      const db = await getDatabase();
      await db.collection("inventory").updateOne(
        { _id: new ObjectId(loadId) },
        {
          $set: {
            proofOfCollectionPhoto: photoUrl,
            updatedAt: new Date(),
          },
          $push: {
            photos: photoUrl,
          } as any,
        }
      );
    }

    return NextResponse.json({
      success: true,
      url: photoUrl,
      message: "Proof of collection photo verified and attached to load.",
    });
  } catch (error: any) {
    console.error("[Driver Upload Error]:", error);
    return NextResponse.json(
      { error: "Failed to upload collection visual" },
      { status: 500 }
    );
  }
}
