
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

import { connectDB } from "@/lib/database";
import Session from "@/models/session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("verifi_session")?.value;

    if (sessionToken) {
      const tokenHash = createHash("sha256")
        .update(sessionToken)
        .digest("hex");

      await connectDB();

      await Session.deleteOne({ tokenHash });
    }

    cookieStore.delete("verifi_session");

    return Response.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to log out.",
      },
      { status: 500 }
    );
  }
}
