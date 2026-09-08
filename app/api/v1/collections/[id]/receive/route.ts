import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { toWeight, formatWeight } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * POST /api/v1/collections/:id/receive
 * Depot staff confirms physical handover and scale weight at depot gate.
 * Creates an authoritative RAW inventory lot and records an immutable inventory receipt movement.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "hub-manager"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      receivedWeightKg,
      condition = "Normal",
      notes = "",
      photo = null,
      sortingRequired = false,
      discrepancyReason = null,
    } = body;

    const db = await getDatabase();

    let colObjId: ObjectId;
    try {
      colObjId = new ObjectId(id);
    } catch {
      return apiError("INVALID_ID", "Collection identifier is not valid.", 422, "id");
    }

    const col = await db.collection("inventory").findOne({ _id: colObjId });
    if (!col) {
      return apiError("COLLECTION_NOT_FOUND", "Collection not found.", 404, "id");
    }

    // Determine collected / captured baseline weight
    const baselineWeight = toWeight(
      col.actualWeightKg !== undefined && col.actualWeightKg !== null
        ? col.actualWeightKg
        : col.normalizedWeightKg || col.quantity || 0
    );

    const actualReceived = receivedWeightKg !== undefined && receivedWeightKg !== null
      ? toWeight(receivedWeightKg)
      : baselineWeight;

    if (actualReceived <= 0) {
      return apiError("INVALID_WEIGHT", "Received weight must be greater than zero.", 422, "receivedWeightKg");
    }

    const discrepancyKg = Math.round((actualReceived - baselineWeight) * 100) / 100;

    const now = new Date();
    const loadNumber = col.loadNumber || `RWL-${col._id.toString().slice(-6)}`;

    // 1. Update Collection in inventory collection
    await db.collection("inventory").updateOne(
      { _id: colObjId },
      {
        $set: {
          status: "RECEIVED_AT_DEPOT",
          receivedAt: now,
          receivedBy: user!.userId,
          receivedWeightKg: actualReceived,
          receivingDiscrepancyKg: discrepancyKg,
          receivingDiscrepancyReason: discrepancyReason || (discrepancyKg !== 0 ? "Weighing variance" : null),
          receivingNotes: notes,
          receivingPhoto: photo,
          sortingRequired: Boolean(sortingRequired),
          sortingStatus: sortingRequired ? "pending" : "not_required",
          processingStatus: "none",
          updatedAt: now,
        },
      }
    );

    // 2. Create authoritative RAW Inventory Lot
    const lotNumber = `LOT-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const hubIdObj = col.hubId ? (ObjectId.isValid(col.hubId) ? new ObjectId(col.hubId) : col.hubId) : new ObjectId();

    const lotDoc = {
      lotNumber,
      hubId: hubIdObj,
      hubName: col.hubName || "Central Depot",
      material: col.material,
      grade: col.grade,
      stage: "RAW",
      quantityKg: actualReceived,
      availableQuantityKg: actualReceived,
      reservedQuantityKg: 0,
      unit: "KG",
      sourceType: "COLLECTION",
      sourceId: col._id.toString(),
      status: "AVAILABLE",
      createdAt: now,
      updatedAt: now,
    };

    const lotInsert = await db.collection("inventory_lots").insertOne(lotDoc);

    // 3. Create immutable Inventory Movement Ledger entry
    const movementNumber = `MOV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    await db.collection("inventory_movements").insertOne({
      movementNumber,
      lotId: lotInsert.insertedId,
      hubId: hubIdObj,
      type: "RECEIPT",
      quantityKg: actualReceived,
      balanceAfterKg: actualReceived,
      referenceType: "COLLECTION",
      referenceId: col._id.toString(),
      performedBy: user!.userId,
      notes: `Depot receipt from collection ${loadNumber}. Variance: ${discrepancyKg} KG. Condition: ${condition}`,
      timestamp: now,
    });

    // 4. Record Audit Log
    await logAuditEvent({
      actorUserId: user!.userId,
      action: "COLLECTION_RECEIVED_AT_DEPOT",
      entityType: "load",
      entityId: col._id.toString(),
      metadata: {
        loadNumber,
        baselineWeightKg: baselineWeight,
        receivedWeightKg: actualReceived,
        discrepancyKg,
        lotNumber,
        sortingRequired: Boolean(sortingRequired),
      },
    });

    return apiSuccess({
      message: "Load received at depot and entered into raw inventory.",
      collection: {
        id: col._id.toString(),
        loadNumber,
        status: "RECEIVED_AT_DEPOT",
        capturedWeightKg: col.normalizedWeightKg || col.quantity || 0,
        collectedWeightKg: baselineWeight,
        receivedWeightKg: actualReceived,
        discrepancyKg,
        sortingRequired: Boolean(sortingRequired),
        receivedAt: now,
      },
      lot: {
        id: lotInsert.insertedId.toString(),
        lotNumber,
        stage: "RAW",
        quantityKg: actualReceived,
        material: col.material,
        grade: col.grade,
      },
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to confirm depot receipt", 500);
  }
}
