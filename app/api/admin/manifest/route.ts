import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

// --- GET: Fetch Route History ---
export async function GET() {
  try {
    const db = await getDatabase();

    // Explicitly mapping _id to id to match your frontend types
    const manifests = await db
      .collection("manifests")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Map MongoDB _id to string or omit if your frontend strictly uses custom 'id'
    return NextResponse.json(manifests);
  } catch (error) {
    console.error("GET Manifest Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch route history" },
      { status: 500 },
    );
  }
}

// --- POST: Deploy New Route Manifest ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, vehiclePlate, driverId, driverName, checkpoints } = body;

    // Basic validation
    if (!title || !checkpoints || checkpoints.length === 0) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title and checkpoints are mandatory.",
        },
        { status: 400 },
      );
    }

    const db = await getDatabase();

    // Construct the payload matching the RouteManifest type
    const newManifest = {
      id: `RT-${Math.floor(1000 + Math.random() * 9000)}`, // Custom ID generation
      title,
      vehiclePlate,
      driverId,
      driverName,
      checkpoints,
      status: "Active", // Overall manifest status
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("manifests").insertOne(newManifest);

    // Return the created manifest
    return NextResponse.json(newManifest, { status: 201 });
  } catch (error) {
    console.error("POST Manifest Error:", error);
    return NextResponse.json(
      { error: "Failed to deploy new manifest" },
      { status: 500 },
    );
  }
}

//--------------------------------------------------------------------------------------------------------------

// import clientPromise, { getDatabase } from "@/lib/mongodb"; // Import clientPromise
// import { NextResponse } from "next/server";
// // --- POST: Atomic Deployment ---
// import { TransactionOptions, ReadConcern, WriteConcern } from "mongodb";

// // --- GET: Fetch History ---
// export async function GET() {
//   try {
//     const db = await getDatabase();
//     const manifests = await db
//       .collection("manifests")
//       .find({})
//       .sort({ createdAt: -1 })
//       .toArray();

//     return NextResponse.json(manifests);
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to fetch route history" },
//       { status: 500 },
//     );
//   }
// }

// export async function POST(request: Request) {
//   const client = await clientPromise;
//   const db = await getDatabase();
//   const body = await request.json();

//   const session = client.startSession();

//   // --- 1. DEFINE TIMEOUT & CONSISTENCY ---
//   const transactionOptions: TransactionOptions = {
//     readConcern: { level: "snapshot" } as ReadConcern,
//     writeConcern: { w: "majority", wtimeout: 5000 } as WriteConcern, // 5 second write timeout
//     maxCommitTimeMS: 10000, // 10 second total transaction limit
//   };

//   try {
//     let result: any;

//     // Pass the options to the transaction
//     await session.withTransaction(async () => {
//       const manifest = {
//         title: body.title,
//         vehiclePlate: body.vehiclePlate,
//         driverName: body.driverName,
//         inventory: body.inventory,
//         checkpoints: body.checkpoints,
//         status: "Active",
//         createdAt: new Date(),
//       };

//       // Step A: Insert Manifest
//       result = await db
//         .collection("manifests")
//         .insertOne(manifest, { session });

//       // Step B: Lock Vehicle (with maxTimeMS to prevent long hangs)
//       const vehicleUpdate = await db.collection("vehicles").updateOne(
//         { plate: body.vehiclePlate, status: "Available" }, // Atomic check: Only if still available
//         {
//           $set: { status: "In-Transit", currentManifestId: result.insertedId },
//         },
//         { session, maxTimeMS: 2000 }, // Individual op timeout
//       );

//       // Step C: Lock Driver
//       const driverUpdate = await db.collection("drivers").updateOne(
//         { name: body.driverName, isAssigned: false }, // Atomic check
//         { $set: { isAssigned: true, currentManifestId: result.insertedId } },
//         { session, maxTimeMS: 2000 },
//       );

//       if (vehicleUpdate.matchedCount === 0 || driverUpdate.matchedCount === 0) {
//         throw new Error(
//           "Asset Conflict: Vehicle or Driver is no longer available.",
//         );
//       }
//     }, transactionOptions);

//     return NextResponse.json(
//       { success: true, id: result?.insertedId },
//       { status: 201 },
//     );
//   } catch (error: any) {
//     // If the error was a timeout, log it specifically
//     if (
//       error.name === "MongoNetworkError" ||
//       error.codeName === "MaxTimeMSExpired"
//     ) {
//       console.error("CRITICAL: Transaction timed out to prevent deadlocks.");
//     }
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   } finally {
//     await session.endSession();
//   }
// }

// ---------------------------------------------------------------------------------------------------------------------------------

// export async function POST(request: Request) {
//   // 1. Get both the client and the db
//   const client = await clientPromise;
//   const db = await getDatabase();

//   const body = await request.json();

//   // 2. Start the session from the CLIENT, not the DB
//   const session = client.startSession();

//   try {
//     let result: any;

//     await session.withTransaction(async () => {
//       const manifest = {
//         title: body.title,
//         vehiclePlate: body.vehiclePlate,
//         driverName: body.driverName,
//         inventory: body.inventory,
//         checkpoints: body.checkpoints.map((cp: any) => ({
//           ...cp,
//           status: cp.status || "Pending",
//           timestamp: cp.status === "Cleared" ? new Date() : null,
//         })),
//         status: "Active",
//         createdAt: new Date(),
//       };

//       // Insert Manifest
//       result = await db
//         .collection("manifests")
//         .insertOne(manifest, { session });

//       // Update Vehicle Status
//       const vehicleUpdate = await db.collection("vehicles").updateOne(
//         { plate: body.vehiclePlate },
//         {
//           $set: {
//             status: "In-Transit",
//             currentManifestId: result.insertedId,
//           },
//         },
//         { session },
//       );

//       // Update Driver Status
//       const driverUpdate = await db
//         .collection("drivers")
//         .updateOne(
//           { name: body.driverName },
//           { $set: { isAssigned: true, currentManifestId: result.insertedId } },
//           { session },
//         );

//       // Rollback if assets don't exist
//       if (vehicleUpdate.matchedCount === 0 || driverUpdate.matchedCount === 0) {
//         throw new Error(
//           "Asset validation failed. Vehicle or Driver not found.",
//         );
//       }
//     });

//     return NextResponse.json(
//       { success: true, id: result?.insertedId },
//       { status: 201 },
//     );
//   } catch (error: any) {
//     console.error("TRANSACTION ABORTED:", error.message);
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   } finally {
//     // 3. Always close the session
//     await session.endSession();
//   }
// }
