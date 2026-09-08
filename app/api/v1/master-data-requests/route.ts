import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/master-data-requests
 * Lists master data requests. Field officers view their own; Admins view all.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query: Record<string, any> = {};

    if (user!.role === "field_officer") {
      query.requestedBy = user!.userId;
    }
    if (status) {
      query.status = status;
    }

    const requests = await db
      .collection("material_requests")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const items = requests.map((r) => ({
      id: r._id.toString(),
      type: (r.type || "MATERIAL").toUpperCase(),
      materialName: r.materialName,
      gradeName: r.gradeName || null,
      notes: r.notes || "",
      photo: r.photo || null,
      status: (r.status || "PENDING").toUpperCase(),
      suggestedPrice: r.suggestedPrice || null,
      requestedBy: r.requestedByName || r.requestedBy,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt || null,
      reviewedBy: r.reviewedBy || null,
      adminNotes: r.adminNotes || null,
    }));

    return apiSuccess({ items, count: items.length });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to fetch requests", 500);
  }
}

/**
 * POST /api/v1/master-data-requests
 * Field Officer creates a new material or grade request
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["field_officer", "admin", "super_admin"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const { type, name, materialName, gradeName, note, notes, photoId, photo, suggestedPrice } = body;

    const reqType = (type || "MATERIAL").toUpperCase();
    const targetMaterial = (materialName || name || "").trim();
    const targetGrade = (gradeName || (reqType === "GRADE" ? name : "") || "").trim();

    if (!targetMaterial) {
      return apiError("VALIDATION_ERROR", "Material name is required.", 422, "materialName");
    }

    if (reqType === "GRADE" && !targetGrade) {
      return apiError("VALIDATION_ERROR", "Grade name is required for grade requests.", 422, "gradeName");
    }

    const db = await getDatabase();

    const newRequest = {
      type: reqType,
      materialName: targetMaterial,
      gradeName: targetGrade || null,
      notes: notes || note || "",
      photo: photo || photoId || null,
      suggestedPrice: suggestedPrice ? parseFloat(suggestedPrice) : null,
      status: "PENDING",
      requestedBy: user!.userId,
      requestedByName: user!.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection("material_requests").insertOne(newRequest);
    const requestId = insertResult.insertedId.toString();

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "MASTER_DATA_REQUESTED",
      entityType: "MASTER_DATA_REQUEST",
      entityId: requestId,
      after: { type: reqType, materialName: targetMaterial, gradeName: targetGrade },
    });

    return apiSuccess(
      {
        id: requestId,
        type: reqType,
        materialName: targetMaterial,
        gradeName: targetGrade || null,
        status: "PENDING",
        message: "Request submitted for Admin review.",
      },
      201
    );
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to create request", 500);
  }
}
