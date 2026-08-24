import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * Helper to verify admin authorization.
 */
function extractAdminUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  if (!token) return null;

  const decoded = verifyToken(token);
  // Ensure the user has admin or ops privileges
  if (decoded && (decoded.role === "admin" || decoded.role === "operations")) {
    return decoded;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authorize Admin Access
    // const adminUser = extractAdminUser(request);
    // if (!adminUser) {
    //   return NextResponse.json(
    //     { error: "Unauthorized access. Admin credentials required." },
    //     { status: 403 },
    //   );
    // }

    const db = await getDatabase();
    const { searchParams } = new URL(request.url);

    // 2. Extract Query Parameters for Filtering & Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const skip = (page - 1) * limit;

    const status = searchParams.get("status");
    const hubId = searchParams.get("hubId");
    const materialName = searchParams.get("materialName");
    const search = searchParams.get("search");

    // 3. Build MongoDB Match Filter
    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }

    if (hubId && ObjectId.isValid(hubId)) {
      filter.hubId = new ObjectId(hubId);
    }

    if (materialName) {
      filter.materialName = { $regex: new RegExp(materialName, "i") };
    }

    if (search) {
      filter.$or = [
        { requestNo: { $regex: new RegExp(search, "i") } },
        { supplierName: { $regex: new RegExp(search, "i") } },
        { pickupAddress: { $regex: new RegExp(search, "i") } },
        { notes: { $regex: new RegExp(search, "i") } },
      ];
    }

    // 4. Execute Aggregation Pipeline to Join Supplier, Hub, and Driver Details
    const pipeline: any[] = [
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      // Join Supplier details
      {
        $lookup: {
          from: "users",
          localField: "supplierId",
          foreignField: "_id",
          as: "supplierDetails",
        },
      },
      {
        $unwind: {
          path: "$supplierDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Join Hub details
      {
        $lookup: {
          from: "hubs",
          localField: "hubId",
          foreignField: "_id",
          as: "hubDetails",
        },
      },
      {
        $unwind: {
          path: "$hubDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Join Driver details if assigned
      {
        $lookup: {
          from: "users",
          localField: "driverId",
          foreignField: "_id",
          as: "driverDetails",
        },
      },
      {
        $unwind: {
          path: "$driverDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Shape Response Fields
      {
        $project: {
          _id: 1,
          requestNo: 1,
          materialName: 1,
          grade: 1,
          estimatedWeightKg: 1,
          actualWeightKg: 1,
          pricePerKg: 1,
          totalEstimatedValue: {
            $multiply: ["$estimatedWeightKg", "$pricePerKg"],
          },
          pickupAddress: 1,
          notes: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          supplier: {
            id: "$supplierDetails._id",
            name: "$supplierName",
            email: "$supplierDetails.email",
            phone: "$supplierDetails.phoneNumber",
            status: "$supplierDetails.status",
          },
          hub: {
            id: "$hubDetails._id",
            name: "$hubName",
            location: "$hubDetails.location",
          },
          driver: {
            $cond: {
              if: { $ifNull: ["$driverDetails", false] },
              then: {
                id: "$driverDetails._id",
                name: {
                  $concat: [
                    "$driverDetails.firstName",
                    " ",
                    "$driverDetails.lastName",
                  ],
                },
                phone: "$driverDetails.phoneNumber",
              },
              else: null,
            },
          },
        },
      },
    ];

    // Query Data and Total Count concurrently
    const [sourcingRequests, totalCount] = await Promise.all([
      db.collection("sourcing_requests").aggregate(pipeline).toArray(),
      db.collection("sourcing_requests").countDocuments(filter),
    ]);

    // 5. Calculate Metrics Summary for Admin Dashboard
    const statsPipeline = [
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalWeightKg: { $sum: "$estimatedWeightKg" },
        },
      },
    ];
    const statusMetrics = await db
      .collection("sourcing_requests")
      .aggregate(statsPipeline)
      .toArray();

    return NextResponse.json(
      {
        data: sourcingRequests,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
        summary: statusMetrics.reduce(
          (acc, curr) => {
            acc[curr._id] = {
              count: curr.count,
              weightKg: curr.totalWeightKg,
            };
            return acc;
          },
          {} as Record<string, { count: number; weightKg: number }>,
        ),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Admin Sourcing Fetch Error]:", error);
    return NextResponse.json(
      { error: "Failed to retrieve admin sourcing requests stream" },
      { status: 500 },
    );
  }
}
