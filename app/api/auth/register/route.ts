
import { NextRequest } from "next/server";
import { randomInt, createHmac } from "node:crypto";
import { z } from "zod";

import { connectDB } from "@/lib/database";
import { sendOtpEmail } from "@/lib/mailer";
import User from "@/models/User";
import OTP from "@/models/OTP";

const registerSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  surname: z.string().trim().min(2).max(50),
  dateOfBirth: z.iso.date(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          message: "Invalid registration details.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, surname, dateOfBirth } = validation.data;

    const dob = new Date(`${dateOfBirth}T00:00:00.000Z`);

    if (dob.getTime() > Date.now()) {
      return Response.json(
        { success: false, message: "Date of birth cannot be in the future." },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser?.isVerified) {
      return Response.json(
        { success: false, message: "This email is already registered." },
        { status: 409 }
      );
    }

    let user = existingUser;

    if (!user) {
      user = await User.create({
        email,
        surname,
        dateOfBirth: dob,
        isVerified: false,
      });
    } else {
      user.surname = surname;
      user.dateOfBirth = dob;
      await user.save();
    }

    const otp = randomInt(100000, 1000000).toString();

    const otpSecret = process.env.OTP_SECRET;

    if (!otpSecret) {
      throw new Error("OTP_SECRET is not configured.");
    }

    const codeHash = createHmac("sha256", otpSecret)
      .update(`${user._id}:registration:${otp}`)
      .digest("hex");

    await OTP.deleteMany({
      userId: user._id,
      purpose: "registration",
    });

    await OTP.create({
      userId: user._id,
      codeHash,
      purpose: "registration",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      await OTP.deleteMany({
        userId: user._id,
        purpose: "registration",
      });

      if (!existingUser) {
        await User.deleteOne({ _id: user._id });
      }

      throw emailError;
    }

    return Response.json(
      {
        success: true,
        message: "Verification code sent to your email.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return Response.json(
      { success: false, message: "Unable to process registration." },
      { status: 500 }
    );
  }
}
