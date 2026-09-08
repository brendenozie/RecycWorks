import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { toWeight } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/processing
 * Lists processing/crushing batches.
 * Query params: hubId, status, processType
 *
 * POST /api/v1/processing
 * Creates a new processing batch (e.g. CRUSHING, WASHING, PELLETIZING) from source lot(s).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "hub-manager"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hubId");
    const status = searchParams.get("status");
    const processType = searchParams.get("processType");

    const query: any = {};
    if (hubId) {
      if (ObjectId.isValid(hubId)) {
        query.$or = [{ hubId }, { hubId: new ObjectId(hubId) }];
      } else {
        query.hubId = hubId;
      }
    }
    if (status) query.status = status.toUpperCase();
    if (processType) query.processType = processType.toUpperCase();

    const db = await getDatabase();
    const batches = await db
      .collection("processing_batches")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const mapped = batches.map((b: any) => ({
      id: b._id.toString(),
      batchNo: b.batchNo,
      hubId: b.hubId ? b.hubId.toString() : null,
      hubName: b.hubName || "Central Processing Depot",
      processType: b.processType,
      machineName: b.machineName || "Crusher 01",
      sourceLotIds: b.sourceLotIds || [],
      inputMaterial: b.inputMaterial,
      inputQuantityKg: b.inputQuantityKg,
      operator: b.operator || "Machine Operator",
      assistants: b.assistants || [],
      status: b.status,
      outputs: b.outputs || [],
      residueQuantityKg: b.residueQuantityKg || 0,
      processLossKg: b.processLossKg || 0,
      totalOutputKg: b.totalOutputKg || 0,
      varianceKg: b.varianceKg || 0,
      outputStockType: b.outputStockType || "Crushed Stock",
      startedAt: b.startedAt || null,
      completedAt: b.completedAt || null,
      notes: b.notes || null,
      createdAt: b.createdAt,
    }));

    return apiSuccess({ total: mapped.length, batches: mapped });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to fetch processing batches", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "hub-manager"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const {
      hubId,
      processType = "CRUSHING",
      machineName = "Crusher 01",
      sourceLotIds = [],
      inputMaterial,
      inputQuantityKg,
      operator = "Operator",
      assistants = [],
      outputStockType = "Crushed Material",
      notes = "",
    } = body;

    if (!inputMaterial) {
      return apiError("VALIDATION_ERROR", "Input material is required.", 422, "inputMaterial");
    }

    const numQty = toWeight(inputQuantityKg);
    if (numQty <= 0) {
      return apiError("INVALID_QUANTITY", "Input quantity must be greater than zero.", 422, "inputQuantityKg");
    }

    const db = await getDatabase();

    let hubName = "Central Processing Depot";
    let validHubId = hubId;

    if (sourceLotIds.length > 0) {
      const objIds = sourceLotIds
        .filter((s: string) => ObjectId.isValid(s))
        .map((s: string) => new ObjectId(s));

      const sourceLots = await db
        .collection("inventory_lots")
        .find({ _id: { $in: objIds } })
        .toArray();

      if (sourceLots.length === 0) {
        return apiError("LOT_NOT_FOUND", "Specified source inventory lots were not found.", 404, "sourceLotIds");
      }

      const totalAvail = sourceLots.reduce((acc: number, l: any) => acc + (l.availableQuantityKg || 0), 0);
      if (totalAvail < numQty) {
        return apiError(
          "INSUFFICIENT_STOCK",
          `Source lots only have ${totalAvail} KG available, but ${numQty} KG requested.`,
          422,
          "inputQuantityKg"
        );
      }

      hubName = sourceLots[0].hubName || hubName;
      validHubId = sourceLots[0].hubId || validHubId;
    }

    const now = new Date();
    const batchNo = `PB-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const hubIdObj = validHubId
      ? (ObjectId.isValid(validHubId) ? new ObjectId(validHubId) : validHubId)
      : new ObjectId();

    const newBatch = {
      batchNo,
      hubId: hubIdObj,
      hubName,
      processType: processType.toUpperCase(),
      machineName,
      sourceLotIds,
      inputMaterial,
      inputQuantityKg: numQty,
      operator,
      assistants: Array.isArray(assistants) ? assistants : [assistants],
      status: "PLANNED",
      outputs: [],
      residueQuantityKg: 0,
      processLossKg: 0,
      totalOutputKg: 0,
      varianceKg: 0,
      outputStockType,
      startedAt: null,
      completedAt: null,
      notes,
      createdBy: user!.userId,
      createdAt: now,
      updatedAt: now,
    };

    const res = await db.collection("processing_batches").insertOne(newBatch);

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "PROCESSING_BATCH_CREATED",
      entityType: "processing_batch",
      entityId: res.insertedId.toString(),
      metadata: { batchNo, processType, machineName, inputQuantityKg: numQty },
    });

    return apiSuccess(
      {
        message: "Processing batch created.",
        batch: {
          id: res.insertedId.toString(),
          batchNo,
          processType: newBatch.processType,
          machineName,
          status: "PLANNED",
          inputMaterial,
          inputQuantityKg: numQty,
          outputStockType,
        },
      },
      201
    );
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to create processing batch", 500);
  }
}
