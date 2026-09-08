import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

function extractOfficer(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const officer = extractOfficer(request);
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine");
    const status = searchParams.get("status");

    let query: Record<string, any> = {};
    if (mine === "true" && officer?.userId) {
      query.requestedBy = officer.userId;
    }
    if (status) {
      query.status = status;
    }

    const requests = await db
      .collection("material_requests")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(requests);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch material requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const officer = extractOfficer(request);
    const db = await getDatabase();
    const body = await request.json();

    const { type, materialName, gradeName, notes, photo, suggestedPrice } = body;

    if (!materialName || !materialName.trim()) {
      return NextResponse.json(
        { error: "Material name is required" },
        { status: 400 }
      );
    }

    if (type === "grade" && (!gradeName || !gradeName.trim())) {
      return NextResponse.json(
        { error: "Grade name is required for a new grade request" },
        { status: 400 }
      );
    }

    const newRequest = {
      type: type || (gradeName ? "grade" : "material"),
      materialName: materialName.trim(),
      gradeName: gradeName ? gradeName.trim() : null,
      notes: notes || "",
      photo: photo || null,
      suggestedPrice: suggestedPrice ? parseFloat(suggestedPrice) : null,
      status: "pending",
      requestedBy: officer?.userId || null,
      requestedByName: officer?.email || "Field Officer",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("material_requests").insertOne(newRequest);

    // Also write an audit log
    await db.collection("audit_logs").insertOne({
      userId: officer?.userId || "field_officer",
      action: "MATERIAL_REQUEST_SUBMITTED",
      entityType: "material_request",
      entityId: result.insertedId.toString(),
      details: {
        type: newRequest.type,
        materialName: newRequest.materialName,
        gradeName: newRequest.gradeName,
      },
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Request submitted to Admin for review and pricing configuration.",
        request: {
          ...newRequest,
          id: result.insertedId.toString(),
          _id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit request" },
      { status: 500 }
    );
  }
}
