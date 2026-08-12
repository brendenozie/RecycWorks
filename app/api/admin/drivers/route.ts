import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  const db = await getDatabase();
  // Only fetch drivers who are not currently assigned to a route
  const drivers = await db
    .collection("drivers")
    .find({ isAssigned: false, verified: true })
    .toArray();

  return NextResponse.json(drivers);
}

export async function POST(request: Request) {
  const db = await getDatabase();
  const body = await request.json();

  const newDriver = {
    name: body.name,
    licenseNo: body.licenseNo,
    phone: body.phone,
    verified: true,
    isAssigned: false,
    rating: 5.0,
    joinedAt: new Date(),
  };

  const result = await db.collection("drivers").insertOne(newDriver);
  return NextResponse.json(result, { status: 201 });
}
