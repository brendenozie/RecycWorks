import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique timestamp
    const fileExt = path.extname(file.name) || ".jpg";
    const baseName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_-]/g, "");
    const uniqueName = `img_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}${fileExt}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueName,
      size: file.size,
    });
  } catch (error: any) {
    console.error("[Upload API Error]:", error);
    return NextResponse.json(
      { error: "Failed to process photo upload" },
      { status: 500 }
    );
  }
}
