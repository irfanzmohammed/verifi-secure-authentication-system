
import { NextRequest } from "next/server";
import { randomInt, createHmac } from "node:crypto";
import { z } from "zod";

import { connectDB } from "@/lib/database";
import { sendOtpEmail } from "@/lib/mailer";
import User from "@/models/User";
import OTP from "@/models/OTP";

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const otpSecret = process.env.OTP_SECRET;

    if (!otpSecret) {
      throw new Error("OTP_SECRET is not configured.");
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return Response.json(
        { success: false, message: "Account not found. Please register first." },
        { status: 404 }
      );
    }

    if (!user.isVerified) {
      return Response.json(
        { success: false, message: "Please verify your email before logging in." },
        { status: 403 }
      );
    }

    const latestOtp = await OTP.findOne({
      userId: user._id,
      purpose: "login",
    }).sort({ createdAt: -1 });

    // Enforce a 60-second resend cooldown.
    if (
      latestOtp &&
      Date.now() - latestOtp.createdAt.getTime() < 60 * 1000
    ) {
      return Response.json(
        {
          success: false,
          message: "Please wait before requesting another login code.",
        },
        { status: 429 }
      );
    }

    const otp = randomInt(100000, 1000000).toString();

    const codeHash = createHmac("sha256", otpSecret)
      .update(`${user._id}:login:${otp}`)
      .digest("hex");

    await OTP.deleteMany({
      userId: user._id,
      purpose: "login",
    });

    const newOtp = await OTP.create({
      userId: user._id,
      codeHash,
      purpose: "login",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      await OTP.deleteOne({ _id: newOtp._id });
      throw emailError;
    }

    return Response.json({
      success: true,
      message: "Login verification code sent to your email.",
    });
  } catch (error) {
    console.error("Login OTP error:", error);

    return Response.json(
      { success: false, message: "Unable to process login request." },
      { status: 500 }
    );
  }
}
