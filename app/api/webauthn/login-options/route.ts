
import {
  generateAuthenticationOptions,
} from "@simplewebauthn/server";

import { connectDB } from "@/lib/database";

import User from "@/models/User";
import Passkey from "@/models/Passkey";
import WebAuthnChallenge from "@/models/WebAuthnChallenge";

export async function POST(request: Request) {
  try {
    await connectDB();

    // 1. Get the user's email.
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return Response.json(
        {
          success: false,
          message: "Email address is required.",
        },
        { status: 400 }
      );
    }

    // 2. Find the verified user.
    const user = await User.findOne({
      email,
      isVerified: true,
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "No verified account found with this email.",
        },
        { status: 404 }
      );
    }

    // 3. Find the user's registered passkeys.
    const passkeys = await Passkey.find({
      userId: user._id,
    });

    if (passkeys.length === 0) {
      return Response.json(
        {
          success: false,
          message: "No passkey registered. Please log in using your email code first.",
        },
        { status: 400 }
      );
    }

    // 4. Generate authentication options.
    const options = await generateAuthenticationOptions({
      rpID: process.env.WEBAUTHN_RP_ID || "localhost",

      allowCredentials: passkeys.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports as any,
      })),

      userVerification: "required",
    });

    // 5. Remove previous authentication challenges.
    await WebAuthnChallenge.deleteMany({
      userId: user._id,
      purpose: "authentication",
    });

    // 6. Save the new challenge.
    await WebAuthnChallenge.create({
      userId: user._id,
      challenge: options.challenge,
      purpose: "authentication",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // 7. Return options to the browser.
    return Response.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error("Passkey login options error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to generate passkey login options.",
      },
      { status: 500 }
    );
  }
}
