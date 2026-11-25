
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

import { connectDB } from "@/lib/database";
import Session from "@/models/session";
import User from "@/models/User";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("verifi_session")?.value;

    if (!sessionToken) {
      return null;
    }

    const tokenHash = createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    await connectDB();

    const session = await Session.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return null;
    }

    const user = await User.findById(session.userId).select(
      "-__v"
    );

    if (!user || !user.isVerified) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}
