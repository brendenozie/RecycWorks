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

    // 2. Fetch all non-completed active inventory assigned to this specific driver
    // Returning multiple loads via .toArray() since your frontend maps over them
    const assignedLoads = await db
      .collection("inventory")
      .find(
        {
          driverId: driverId, //new ObjectId(driverId) || // Ensure driverId is treated as a string if not an ObjectId
          status: { $in: ["pending", "dispatched", "loaded", "in-transit"] },
        },
        { sort: { timestamp: -1 } },
      )
      .toArray();

    // 3. Map the database documents to the frontend requirements
    const mappedLoads = assignedLoads.map((load) => {
      const numericWeight = parseFloat(load.weight) || 0;
      const weightInKg = load.weight?.toLowerCase().includes("t")
        ? numericWeight * 1000
        : numericWeight;

      return {
        _id: load._id,
        status: load.status,
        supplierName: load.supplier || "Independent Node",
        totalWeight: weightInKg,
        vehicle: "ASSIGNED TRANSIT",
        hub: "Nairobi Core Node",
        grade: load.grade,
        name: load.name,
      };
    });

    // Return the array directly as your frontend expects an array to map over
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
