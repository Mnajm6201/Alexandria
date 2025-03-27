import { getAuth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
    return NextResponse.json({ message: "Clerk user deleted" });
  } catch (error) {
    console.error("Error deleting Clerk user:", error);
    return NextResponse.json(
      { error: "Failed to delete Clerk user" },
      { status: 500 }
    );
  }
}
