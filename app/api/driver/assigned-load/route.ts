import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // 1. Authenticate via Bearer Token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token missing" },
        { status: 401 },
      );
    }

    // FIXED: Changed "supplier" to "driver"
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "driver") {
      return NextResponse.json(
        { error: "Unauthorized access: Drivers only" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const queryDriverId = searchParams.get("driverId");
    const driverId = decoded?.userId || queryDriverId;

    if (!driverId) {
      return NextResponse.json(
        { error: "Driver ID required" },
        { status: 400 },
      );
    }

    const db = await getDatabase();

    // 2. Fetch all non-completed active inventory assigned to this driver or available for pickup
    const assignedLoads = await db
      .collection("inventory")
      .find(
        {
          $or: [
            { driverId: driverId },
            { driverId: { $in: ["", null] } },
          ],
          status: { $in: ["pending", "captured", "dispatched", "loaded", "in-transit", "arrived"] },
        },
        { sort: { timestamp: -1 } },
      )
      .toArray();

    // 3. Map the database documents to the frontend requirements
    const mappedLoads = assignedLoads.map((load: any) => {
      const numericWeight = parseFloat(load.quantity || load.weight) || 0;
      const weightInKg = load.normalizedWeightKg
        ? load.normalizedWeightKg
        : (load.unit === "TONNES" || load.weight?.toLowerCase().includes("t")
            ? numericWeight * 1000
            : numericWeight);

      const loc = load.pickupLocation;
      let originAddress = "Supplier Yard";
      if (loc && (loc.county || loc.landmark)) {
        originAddress = [loc.landmark, loc.subCounty, loc.county].filter(Boolean).join(", ");
      } else if (load.pickupAddress) {
        originAddress = load.pickupAddress;
      }

      return {
        _id: load._id.toString(),
        id: load._id.toString(),
        loadNumber: load.loadNumber || `RWL-${load._id.toString().slice(-4)}`,
        status: load.status || "pending",
        supplierName: load.supplierName || load.supplier || "Partner Supplier",
        supplierPhone: load.supplierPhone || load.phoneNumber || "",
        totalWeight: weightInKg,
        weightLabel: load.weight || `${numericWeight} ${load.unit || 'KG'}`,
        vehicle: load.vehiclePlate || "ISUZU FRR (KDC 492X)",
        hub: load.hubName || "Central Receiving Yard (Nairobi)",
        destination: load.hubName || "Central Receiving Yard (Nairobi)",
        originAddress,
        grade: load.grade || "Standard",
        name: load.material || load.name || "Recyclable Polymer",
        material: load.material || load.name || "Recyclable Polymer",
        photos: load.photos || [],
        proofOfCollectionPhoto: load.proofOfCollectionPhoto || null,
        notes: load.notes || "",
      };
    });

    return NextResponse.json(mappedLoads);
  } catch (error) {
    console.error("Active Load Sync Error:", error);
    return NextResponse.json(
      { error: "Failed to sync dispatch ledger" },
      { status: 500 },
    );
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import { getDatabase } from "@/lib/mongodb";
// import { verifyToken } from "@/lib/auth"; // Wherever your auth file resides
// import { ObjectId } from "bson";

// export async function GET(request: NextRequest) {
//   try {
//     // 1. Authenticate via Bearer Token or Cookie
//     const authHeader = request.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ")
//       ? authHeader.substring(7)
//       : null;

//     if (!token) {
//       return NextResponse.json(
//         { error: "Authentication token missing" },
//         { status: 401 },
//       );
//     }

//     const decoded = verifyToken(token);
//     if (!decoded || decoded.role !== "driver") {
//       return NextResponse.json(
//         { error: "Unauthorized access: Drivers only" },
//         { status: 403 },
//       );
//     }

//     const { searchParams } = new URL(request.url);
//     const queryDriver = searchParams.get("driverId");

//     // Replace with decoded JWT later
//     const driverId = decoded?.userId || queryDriver;

//     if (!driverId) {
//       return NextResponse.json(
//         { error: "Driver ID required" },
//         { status: 400 },
//       );
//     }

//     const db = await getDatabase();

//     const inventory = await db
//       .collection("inventory")
//       .find({
//         driverId: driverId, // Ensure driverId is treated as a string if not an ObjectId new ObjectId(driverId) ||
//         status: {
//           $in: [
//             // "pending",
//             // "loaded",
//             "dispatched",
//             // "in-transit",
//             // "delivered",
//             // "canceled",
//             // "active",
//           ],
//         },
//       })
//       .sort({
//         timestamp: -1,
//       })
//       .toArray();

//     const loads = inventory.map((item) => {
//       const weight = parseFloat(item.weight || "0");

//       return {
//         _id: item._id.toString(),
//         status: item.status === "active" ? "pending" : item.status,

//         supplierName: item.supplier || "Unknown Supplier",

//         totalWeight: item.weight?.toLowerCase().includes("t")
//           ? weight * 1000
//           : weight,

//         vehicle: item.vehicle || "Not Assigned",

//         hub: item.hub || "Nairobi Core Hub",

//         grade: item.grade || "-",

//         name: item.name || "Material",
//       };
//     });

//     return NextResponse.json(loads);
//   } catch (error) {
//     console.error(error);

//     return NextResponse.json(
//       {
//         error: "Failed to fetch assigned inventory",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }
