import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  authenticateApiUser,
  authorizeRoles,
  apiSuccess,
  apiError,
  logAuditEvent,
} from "@/lib/api-auth";
import { formatCurrency } from "@/lib/decimal";
import { ObjectId } from "mongodb";

/**
 * GET /api/v1/driver/fuel
 * Lists fuel purchase records.
 *
 * POST /api/v1/driver/fuel
 * Logs a fuel purchase (litres, amount in KES, receipt photo, odometer, station).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["driver", "admin", "super_admin", "operations", "accounts"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const { searchParams } = new URL(request.url);
    const queryDriverId = searchParams.get("driverId");
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

    const filter: any = {};
    if (user!.role === "driver") {
      filter.driverId = new ObjectId(user!.userId);
    } else if (queryDriverId) {
      filter.driverId = new ObjectId(queryDriverId);
    }

    const db = await getDatabase();
    const rawFuel = await db
      .collection("fuel_records")
      .find(filter)
      .sort({ recordedAt: -1 })
      .limit(limit)
      .toArray();

    const records = rawFuel.map((f) => ({
      id: f._id.toString(),
      vehiclePlate: f.vehiclePlate,
      driverId: f.driverId?.toString(),
      driverName: f.driverName,
      litres: f.litres,
      amountKes: formatCurrency(f.amountKes),
      fuelType: f.fuelType || "Diesel",
      station: f.station || "N/A",
      odometer: f.odometer,
      receiptPhoto: f.receiptPhoto,
      recordedAt: f.recordedAt,
    }));

    return apiSuccess({ records, count: records.length });
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to list fuel records", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateApiUser(request);
    const authCheck = authorizeRoles(user, ["driver", "admin", "super_admin", "operations"]);
    if (!authCheck.authorized) return authCheck.errorResponse!;

    const body = await request.json().catch(() => ({}));
    const { vehiclePlate, litres, amountKes, fuelType, station, odometer, receiptPhoto, shiftId } = body;

    const numLitres = Number(litres);
    if (isNaN(numLitres) || numLitres <= 0) {
      return apiError("VALIDATION_ERROR", "Litres must be a positive number.", 422, "litres");
    }

    const numAmount = Number(amountKes);
    if (isNaN(numAmount) || numAmount <= 0) {
      return apiError("VALIDATION_ERROR", "Amount in KES must be a positive number.", 422, "amountKes");
    }

    if (!vehiclePlate || !vehiclePlate.trim()) {
      return apiError("VALIDATION_ERROR", "Vehicle plate is required.", 422, "vehiclePlate");
    }

    const db = await getDatabase();

    // Look up driver name
    const driverUser = await db.collection("users").findOne({ _id: new ObjectId(user!.userId) });
    const driverName = driverUser
      ? `${driverUser.firstName || ""} ${driverUser.lastName || ""}`.trim() || driverUser.name || "Driver"
      : "Driver";

    const now = new Date();
    const newRecord: any = {
      vehiclePlate: vehiclePlate.trim().toUpperCase(),
      driverId: new ObjectId(user!.userId),
      driverName,
      litres: Math.round(numLitres * 100) / 100,
      amountKes: Math.round(numAmount * 100) / 100,
      fuelType: fuelType || "Diesel",
      station: station?.trim() || "Local Station",
      odometer: odometer ? Number(odometer) : null,
      receiptPhoto: receiptPhoto || null,
      shiftId: shiftId ? new ObjectId(shiftId) : null,
      recordedAt: now,
      createdAt: now,
    };

    const result = await db.collection("fuel_records").insertOne(newRecord);

    await logAuditEvent({
      actorUserId: user!.userId,
      action: "FUEL_RECORDED",
      entityType: "FUEL_RECORD",
      entityId: result.insertedId.toString(),
      details: {
        vehiclePlate: newRecord.vehiclePlate,
        litres: newRecord.litres,
        amountKes: newRecord.amountKes,
        station: newRecord.station,
      },
    });

    return apiSuccess({
      message: "Fuel record created successfully.",
      fuelRecord: {
        id: result.insertedId.toString(),
        ...newRecord,
        driverId: user!.userId,
        shiftId: shiftId || null,
      },
    }, 201);
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to log fuel record", 500);
  }
}
