
import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { connectDB } from "@/lib/database";
import User from "@/models/User";
import OTP from "@/models/OTP";

const verifySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  otp: z.string().regex(/^\d{6}$/, "OTP must contain exactly six digits"),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { success: false, message: "Invalid email or OTP format." },
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
        { success: false, message: "Registration not found." },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return Response.json(
        { success: false, message: "This account is already verified." },
        { status: 409 }
      );
    }

    const otpRecord = await OTP.findOne({
      userId: user._id,
      purpose: "registration",
      consumedAt: null,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return Response.json(
        { success: false, message: "No active verification code found." },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      await OTP.deleteOne({ _id: otpRecord._id });

      return Response.json(
        { success: false, message: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 5) {
      return Response.json(
        { success: false, message: "Too many incorrect attempts. Request a new code." },
        { status: 429 }
      );
    }

    const submittedHash = createHmac("sha256", otpSecret)
      .update(`${user._id}:registration:${otp}`)
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
          message: "Incorrect verification code.",
          attemptsRemaining: Math.max(0, 5 - otpRecord.attempts),
        },
        { status: 400 }
      );
    }

    // Consume the OTP before marking the account verified.
    otpRecord.consumedAt = new Date();
    await otpRecord.save();

    user.isVerified = true;
    await user.save();

    return Response.json({
      success: true,
      message: "Email verified and registration completed successfully.",
    });
  } catch (error) {
    console.error("OTP verification error:", error);

    return Response.json(
      { success: false, message: "Unable to verify the code." },
      { status: 500 }
    );
  }
}
