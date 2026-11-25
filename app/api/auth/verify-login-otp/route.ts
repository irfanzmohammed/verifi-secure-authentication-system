
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  createHmac,
  createHash,
  timingSafeEqual,
  randomBytes,
} from "node:crypto";
import { z } from "zod";

import { connectDB } from "@/lib/database";
import User from "@/models/User";
import OTP from "@/models/OTP";
import Session from "@/models/session";

const verifyLoginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  otp: z.string().regex(/^\d{6}$/),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validation = verifyLoginSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          message: "Invalid email or OTP format.",
        },
        { status: 400 }
      );
    }

    const { email, otp } = validation.data;
    const otpSecret = process.env.OTP_SECRET;

    if (!otpSecret) {
      throw new Error("OTP_SECRET is not configured.");
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return Response.json(
        { success: false, message: "Account not found." },
        { status: 404 }
      );
    }

    if (!user.isVerified) {
      return Response.json(
        {
          success: false,
          message: "Please verify your email first.",
        },
        { status: 403 }
      );
    }

    const otpRecord = await OTP.findOne({
      userId: user._id,
      purpose: "login",
      consumedAt: null,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return Response.json(
        {
          success: false,
          message: "No active login code found.",
        },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      await OTP.deleteOne({ _id: otpRecord._id });

      return Response.json(
        {
          success: false,
          message: "Login code has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 5) {
      return Response.json(
        {
          success: false,
          message: "Too many incorrect attempts. Request a new code.",
        },
        { status: 429 }
      );
    }

    const submittedHash = createHmac("sha256", otpSecret)
      .update(`${user._id}:login:${otp}`)
      .digest();

    const storedHash = Buffer.from(otpRecord.codeHash, "hex");

    const matches =
      storedHash.length === submittedHash.length &&
      timingSafeEqual(storedHash, submittedHash);

    if (!matches) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return Response.json(
        {
          success: false,
          message: "Incorrect login code.",
          attemptsRemaining: Math.max(0, 5 - otpRecord.attempts),
        },
        { status: 400 }
      );
    }

    // Consume the OTP so it cannot be reused.
    otpRecord.consumedAt = new Date();
    await otpRecord.save();

    // Generate a secure session token.
    const sessionToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    // Invalidate previous sessions for this account.
    await Session.deleteMany({ userId: user._id });

    // Create a new session valid for seven days.
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await Session.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    // Store the session token in a secure HTTP-only cookie.
    const cookieStore = await cookies();

    cookieStore.set("verifi_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return Response.json({
      success: true,
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Login OTP verification error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to verify login code.",
      },
      { status: 500 }
    );
  }
}
