import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
} from "@/lib/api-auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/traceability
 * Complete end-to-end chain-of-custody material lineage engine.
 * Supports forward tracing (from Collection) and backward tracing (from Customer Order or Finished Lot).
 * Query params:
 * - id: MongoDB ObjectId or Identifier (Load Number, Lot Number, Order Number, Batch Number)
 * - type: "load" | "lot" | "batch" | "order"
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["operations", "admin", "super_admin", "accounts"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { searchParams } = new URL(request.url);
    const identifier = (searchParams.get("id") || "").trim();
    const type = (searchParams.get("type") || "load").toLowerCase();

    if (!identifier) {
      return apiError("VALIDATION_ERROR", "Traceability identifier (id) is required.", 422, "id");
    }

    const db = await getDatabase();

    let rootEntity: any = null;
    let resolvedType = type;

    // Helper query function
    const findByIdOrField = async (collection: string, field: string, val: string) => {
      return await db.collection(collection).findOne({
        $or: [
          ...(ObjectId.isValid(val) ? [{ _id: new ObjectId(val) }] : []),
          { [field]: val },
          { [field]: { $regex: new RegExp(`^${val}$`, "i") } },
        ],
      });
    };

    if (type === "load" || type === "collection") {
      rootEntity = await findByIdOrField("inventory", "loadNumber", identifier);
      resolvedType = "load";
    } else if (type === "lot") {
      rootEntity = await findByIdOrField("inventory_lots", "lotNumber", identifier);
      resolvedType = "lot";
    } else if (type === "batch" || type === "sorting" || type === "processing") {
      rootEntity = await findByIdOrField("processing_batches", "batchNo", identifier);
      if (rootEntity) {
        resolvedType = "processing_batch";
      } else {
        rootEntity = await findByIdOrField("sorting_work_orders", "workOrderNo", identifier);
        if (rootEntity) resolvedType = "sorting_order";
      }
    } else if (type === "order") {
      rootEntity = await findByIdOrField("customer_orders", "orderNo", identifier);
      resolvedType = "order";
    }

    if (!rootEntity) {
      // General fallback search
      rootEntity = await findByIdOrField("inventory", "loadNumber", identifier);
      if (rootEntity) resolvedType = "load";
      else {
        rootEntity = await findByIdOrField("customer_orders", "orderNo", identifier);
        if (rootEntity) resolvedType = "order";
        else {
          rootEntity = await findByIdOrField("inventory_lots", "lotNumber", identifier);
          if (rootEntity) resolvedType = "lot";
        }
      }
    }

    if (!rootEntity) {
      return apiError("NOT_FOUND", `Entity not found for identifier '${identifier}'`, 404);
    }

    // Initialize lineage response
    const chain: {
      procurement: any | null;
      logistics: any | null;
      depotReceiving: any | null;
      rawInventory: any[] | null;
      sorting: any | null;
      processing: any | null;
      finishedInventory: any[] | null;
      salesOrder: any | null;
      customerDelivery: any | null;
    } = {
      procurement: null,
      logistics: null,
      depotReceiving: null,
      rawInventory: [],
      sorting: null,
      processing: null,
      finishedInventory: [],
      salesOrder: null,
      customerDelivery: null,
    };

    // 1. If starting from or resolving a Collection / Load
    let targetLoad = resolvedType === "load" ? rootEntity : null;

    // If starting from an Order, trace backward
    if (resolvedType === "order") {
      chain.salesOrder = {
        id: rootEntity._id.toString(),
        orderNo: rootEntity.orderNo,
        customerName: rootEntity.customerName,
        material: rootEntity.material,
        grade: rootEntity.grade,
        requiredQuantityKg: rootEntity.requiredQuantityKg,
        unitPriceKes: rootEntity.unitPriceKes,
        totalAmountKes: rootEntity.totalAmountKes,
        status: rootEntity.status,
      };

      if (rootEntity.status === "DELIVERED") {
        chain.customerDelivery = {
          deliveredAt: rootEntity.deliveredAt,
          driverName: rootEntity.assignedDriverName,
          vehiclePlate: rootEntity.assignedVehiclePlate,
          recipientName: rootEntity.recipientName,
          proofOfDeliveryPhoto: rootEntity.proofOfDeliveryPhoto,
          deliveryNotes: rootEntity.deliveryNotes,
        };
      }

      // Find reserved lots
      if (rootEntity.reservedLotIds && rootEntity.reservedLotIds.length > 0) {
        const lotObjIds = rootEntity.reservedLotIds
          .filter((idStr: string) => ObjectId.isValid(idStr))
          .map((idStr: string) => new ObjectId(idStr));

        const lots = await db.collection("inventory_lots").find({ _id: { $in: lotObjIds } }).toArray();
        chain.finishedInventory = lots.map((l: any) => ({
          id: l._id.toString(),
          lotNumber: l.lotNumber,
          stage: l.stage,
          material: l.material,
          grade: l.grade,
          quantityKg: l.quantityKg,
          sourceType: l.sourceType,
          sourceId: l.sourceId,
        }));

        // Trace to processing batch
        const procLot = lots.find((l: any) => l.sourceType === "PROCESSING_OUTPUT");
        if (procLot && ObjectId.isValid(procLot.sourceId)) {
          const pb = await db.collection("processing_batches").findOne({ _id: new ObjectId(procLot.sourceId) });
          if (pb) {
            chain.processing = {
              id: pb._id.toString(),
              batchNo: pb.batchNo,
              processType: pb.processType,
              machineName: pb.machineName,
              inputMaterial: pb.inputMaterial,
              inputQuantityKg: pb.inputQuantityKg,
              operator: pb.operator,
              totalOutputKg: pb.totalOutputKg,
              residueQuantityKg: pb.residueQuantityKg,
              status: pb.status,
            };

            // Find source lot of processing batch
            if (pb.sourceLotIds && pb.sourceLotIds.length > 0) {
              const srcLots = await db
                .collection("inventory_lots")
                .find({
                  _id: { $in: pb.sourceLotIds.filter((s: string) => ObjectId.isValid(s)).map((s: string) => new ObjectId(s)) },
                })
                .toArray();

              const sortLot = srcLots.find((l: any) => l.sourceType === "SORTING_OUTPUT");
              if (sortLot && ObjectId.isValid(sortLot.sourceId)) {
                const swo = await db.collection("sorting_work_orders").findOne({ _id: new ObjectId(sortLot.sourceId) });
                if (swo) {
                  chain.sorting = {
                    id: swo._id.toString(),
                    workOrderNo: swo.workOrderNo,
                    inputMaterial: swo.inputMaterial,
                    inputQuantityKg: swo.inputQuantityKg,
                    assignedStaff: swo.assignedStaff,
                    totalOutputKg: swo.totalOutputKg,
                    rejectQuantityKg: swo.rejectQuantityKg,
                    varianceKg: swo.varianceKg,
                    status: swo.status,
                  };

                  // Trace backward from Sorting Work Order to its source RAW lot from COLLECTION
                  if (swo.sourceLotIds && swo.sourceLotIds.length > 0) {
                    const swoSrcLots = await db
                      .collection("inventory_lots")
                      .find({
                        _id: {
                          $in: swo.sourceLotIds
                            .filter((s: string) => ObjectId.isValid(s))
                            .map((s: string) => new ObjectId(s)),
                        },
                      })
                      .toArray();
                    const rawLot = swoSrcLots.find((l: any) => l.sourceType === "COLLECTION");
                    if (rawLot && ObjectId.isValid(rawLot.sourceId)) {
                      targetLoad = await db.collection("inventory").findOne({ _id: new ObjectId(rawLot.sourceId) });
                    }
                  }
                }
              }

              // Direct check if any processing source lot came directly from COLLECTION (without sorting)
              if (!targetLoad) {
                const colLot = srcLots.find((l: any) => l.sourceType === "COLLECTION");
                if (colLot && ObjectId.isValid(colLot.sourceId)) {
                  targetLoad = await db.collection("inventory").findOne({ _id: new ObjectId(colLot.sourceId) });
                }
              }
            }
          }
        }
      }
    }

    // If we have a targetLoad (either directly queried or resolved via backward trace)
    if (targetLoad) {
      chain.procurement = {
        id: targetLoad._id.toString(),
        loadNumber: targetLoad.loadNumber,
        supplierName: targetLoad.supplierName,
        supplierCode: targetLoad.supplierCode,
        fieldOfficerName: targetLoad.fieldOfficerName,
        material: targetLoad.material,
        grade: targetLoad.grade,
        capturedWeightKg: targetLoad.normalizedWeightKg || targetLoad.quantity,
        totalSacks: targetLoad.totalSacks || (targetLoad.items ? targetLoad.items.length : 1),
        capturedAt: targetLoad.timestamp || targetLoad.createdAt,
      };

      chain.logistics = {
        driverName: targetLoad.driverName,
        vehiclePlate: targetLoad.vehiclePlate || targetLoad.assignedVehiclePlate,
        dispatchedAt: targetLoad.dispatchedAt,
        collectedAt: targetLoad.collectedAt,
        deliveredAt: targetLoad.deliveredAt,
        nightTravel: Boolean(targetLoad.nightTravel),
        pickupCondition: targetLoad.pickupCondition,
        pickupDiscrepancyKg: targetLoad.pickupDiscrepancyKg,
        proofOfCollectionPhoto: targetLoad.proofOfCollectionPhoto,
      };

      chain.depotReceiving = {
        hubName: targetLoad.hubName,
        receivedAt: targetLoad.receivedAt,
        receivedWeightKg: targetLoad.receivedWeightKg,
        receivingDiscrepancyKg: targetLoad.receivingDiscrepancyKg,
        receivingDiscrepancyReason: targetLoad.receivingDiscrepancyReason,
        receivingNotes: targetLoad.receivingNotes,
        receivingPhoto: targetLoad.receivingPhoto,
        sortingRequired: Boolean(targetLoad.sortingRequired),
      };

      // Forward query: Find raw lots created from this collection
      const rawLots = await db
        .collection("inventory_lots")
        .find({ sourceType: "COLLECTION", sourceId: targetLoad._id.toString() })
        .toArray();

      if (rawLots.length > 0) {
        chain.rawInventory = rawLots.map((l: any) => ({
          id: l._id.toString(),
          lotNumber: l.lotNumber,
          stage: l.stage,
          quantityKg: l.quantityKg,
          availableQuantityKg: l.availableQuantityKg,
        }));

        const lotIds = rawLots.map((l: any) => l._id.toString());

        // Find sorting work orders using this raw lot
        if (!chain.sorting) {
          const swo = await db.collection("sorting_work_orders").findOne({ sourceLotIds: { $in: lotIds } });
          if (swo) {
            chain.sorting = {
              id: swo._id.toString(),
              workOrderNo: swo.workOrderNo,
              inputMaterial: swo.inputMaterial,
              inputQuantityKg: swo.inputQuantityKg,
              assignedStaff: swo.assignedStaff,
              totalOutputKg: swo.totalOutputKg,
              rejectQuantityKg: swo.rejectQuantityKg,
              varianceKg: swo.varianceKg,
              status: swo.status,
            };
          }
        }

        // Find processing batches
        if (!chain.processing) {
          const pb = await db.collection("processing_batches").findOne({ sourceLotIds: { $in: lotIds } });
          if (pb) {
            chain.processing = {
              id: pb._id.toString(),
              batchNo: pb.batchNo,
              processType: pb.processType,
              machineName: pb.machineName,
              inputMaterial: pb.inputMaterial,
              inputQuantityKg: pb.inputQuantityKg,
              operator: pb.operator,
              totalOutputKg: pb.totalOutputKg,
              residueQuantityKg: pb.residueQuantityKg,
              status: pb.status,
            };
          }
        }
      }
    }

    return apiSuccess({
      searchedId: identifier,
      resolvedType,
      chainOfCustody: chain,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to resolve material chain of custody", 500);
  }
}
