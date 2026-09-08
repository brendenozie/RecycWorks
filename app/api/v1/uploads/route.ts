import { NextRequest } from "next/server";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
} from "@/lib/api-auth";

/**
 * POST /api/v1/uploads
 * Dedicated photo/document upload endpoint
 * Prevents bloating normal collection JSON payloads with heavy raw binary strings
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "driver", "admin", "super_admin", "operations"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const contentType = request.headers.get("content-type") || "";

    let fileDataUrl: string = "";
    let fileName: string = `photo_${Date.now()}`;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return apiError("VALIDATION_ERROR", "File is required in multipart form data.", 422, "file");
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      fileDataUrl = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
      fileName = file.name;
    } else {
      const body = await request.json().catch(() => ({}));
      if (!body.data && !body.base64 && !body.url) {
        return apiError("VALIDATION_ERROR", "Photo payload ('data' or 'url') is required.", 422, "data");
      }
      fileDataUrl = body.data || body.base64 || body.url;
      if (body.name) fileName = body.name;
    }

    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return apiSuccess(
      {
        uploadId,
        id: uploadId,
        url: fileDataUrl,
        name: fileName,
        status: "UPLOADED",
        uploadedBy: user!.userId,
        uploadedAt: new Date(),
      },
      201
    );
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to upload file", 500);
  }
}
