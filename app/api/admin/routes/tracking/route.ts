import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

// --- GET: Fetch all live tracking updates ---
export async function GET() {
  try {
    const db = await getDatabase();

    // Fetch only dispatched or in-progress routes
    const liveTracking = await db
      .collection("active_routes")
      .find({ status: { $in: ["Dispatched", "In Transit"] } })
      .project({
        title: 1,
        driverId: 1,
        vehiclePlate: 1,
        checkpoints: 1,
        currentPosition: 1,
        updatedAt: 1,
      })
      .toArray();

    return NextResponse.json(liveTracking);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch live tracking feed" },
      { status: 500 },
    );
  }
}

// Inside your RouteManagement Component
// useEffect(() => {
//   const interval = setInterval(async () => {
//     const res = await fetch('/api/routes/tracking');
//     const updates = await res.json();

//     // Update the local state with the latest checkpoint statuses
//     setRoutes(prevRoutes =>
//       prevRoutes.map(route => {
//         const liveMatch = updates.find(u => u._id === route._id);
//         return liveMatch ? { ...route, ...liveMatch } : route;
//       })
//     );
//   }, 10000); // Sync every 10 seconds

//   return () => clearInterval(interval);
// }, []);
