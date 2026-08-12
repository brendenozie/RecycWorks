import { getDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs"; // or whichever hashing library you are using in auth.ts

// --- GET: Fetch Accounts (Filtered by Pipeline Role or Global Matrix) ---
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role"); // "supplier" | "driver"

    // Construct reactive query structure based on parsed URL search criteria
    const query: Record<string, any> = {};
    if (roleFilter) {
      query.role = roleFilter;
    }

    const rawUsers = await db.collection("users").find(query).toArray();

    // Map fields so the data model matches your front-end select dropdown constraints
    const cleanUsers = rawUsers.map((user) => ({
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      name:
        `${user.firstName} ${user.lastName}`.trim() ||
        user.name ||
        "Unnamed Node",
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      hubId: user.hubId,
    }));

    return NextResponse.json(cleanUsers);
  } catch (error) {
    console.error("[RecycWorks Users Engine Error]:", error);
    return NextResponse.json(
      { error: "Failed to query relational identity nodes" },
      { status: 500 },
    );
  }
}

// --- POST: Provision New Security Access Manually ---
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    const newUser = {
      ...body,
      verified: true,
      createdAt: new Date(),
      status: body.role === "driver" ? "pending_verification" : "active",
    };

    const result = await db.collection("users").insertOne(newUser);
    return NextResponse.json(
      { _id: result.insertedId, ...newUser },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Provision workflow failure" },
      { status: 500 },
    );
  }
}

// --- DELETE: Revoke Security Access ---
export async function DELETE(request: Request) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Target account token ID parameter required" },
        { status: 400 },
      );
    }

    await db.collection("users").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({
      success: true,
      message: "Security matrix link detached",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Revoke operational failure" },
      { status: 500 },
    );
  }
}
// export async function PATCH(request: Request) {
//   try {
//     const db = await getDatabase();
//     const body = await request.json();

//     if (!body._id) {
//       return NextResponse.json(
//         { error: "Target account token ID parameter required" },
//         { status: 400 },
//       );
//     }

//     const { _id, ...updateData } = body;

//     const result = await db
//       .collection("users")
//       .updateOne(
//         { _id: new ObjectId(_id) },
//         { $set: { ...updateData, lastUpdated: new Date() } },
//       );

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to update user" },
//       { status: 500 },
//     );
//   }
// }

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = await getDatabase();

    const { id, _id, password, ...updateData } = body;
    const userId = id || _id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Build standard set payload
    const setPayload: Record<string, any> = {
      ...updateData,
      lastUpdated: new Date(),
    };

    // If password is being updated, enforce strength rules and hash it
    if (password && password.trim() !== "") {
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters for system security" },
          { status: 400 }
        );
      }
      
      // Hash the password securely matching your auth stack's configuration
      const salt = await bcrypt.genSalt(10);
      setPayload.password = await bcrypt.hash(password, salt);
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: setPayload }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      modified: result.modifiedCount,
    });
    
  } catch (error) {
    console.error("[RecycWorks Update Error]:", error);
    return NextResponse.json(
      { error: "Failed to update user payload configuration" },
      { status: 500 }
    );
  }
}