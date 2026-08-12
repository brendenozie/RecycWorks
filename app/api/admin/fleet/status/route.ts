import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDatabase();

  // Fetch all pickups that are not yet 'Verified' (still in the logistics loop)
  const activeFleet = await db
    .collection("pickup_requests")
    .find({
      status: { $in: ["Dispatched", "Arrived", "In-Transit", "Delivered"] },
    })
    .toArray();

  const statusMap: Record<string, number> = {
    Dispatched: 25,
    Arrived: 50,
    "In-Transit": 75,
    Delivered: 100,
  };

  const fleetData = activeFleet.map((truck) => ({
    id: truck._id,
    driver: truck.assignedDriver || "Unknown",
    vehicle: truck.vehicle || "KDM ---",
    origin: truck.supplierName,
    destination: truck.hub,
    progress: statusMap[truck.status] || 0,
    currentStatus: truck.status,
    lastUpdate: truck.updatedAt || new Date(),
  }));

  return NextResponse.json(fleetData);
}
