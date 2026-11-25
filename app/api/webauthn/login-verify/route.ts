
import {
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

import type {
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";

import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";

import { connectDB } from "@/lib/database";

import User from "@/models/User";
import Passkey from "@/models/Passkey";
import Session from "@/models/session";
import WebAuthnChallenge from "@/models/WebAuthnChallenge";

export async function POST(request: Request) {
  try {
    await connectDB();

    // 1. Read email and authenticator response.
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const credential = body.credential as AuthenticationResponseJSON;

    if (!email || !credential?.id) {
      return Response.json(
        {
          success: false,
          message: "Email and passkey response are required.",
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
          message: "Verified account not found.",
        },
        { status: 404 }
      );
    }

    // 3. Find the registered passkey.
    const passkey = await Passkey.findOne({
      userId: user._id,
      credentialId: credential.id,
    });

    if (!passkey) {
      return Response.json(
        {
          success: false,
          message: "Passkey not recognized.",
        },
        { status: 400 }
      );
    }

    // 4. Find the pending authentication challenge.
    const challengeRecord = await WebAuthnChallenge.findOne({
      userId: user._id,
      purpose: "authentication",
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!challengeRecord) {
      return Response.json(
        {
          success: false,
          message: "Authentication challenge expired. Please try again.",
        },
        { status: 400 }
      );
    }

    // 5. Configure expected WebAuthn values.
    const expectedRPID =
      process.env.WEBAUTHN_RP_ID || "localhost";

    const expectedOrigin =
      process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

    // 6. Verify the authenticator response.
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin,
      expectedRPID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(
          Buffer.from(passkey.publicKey, "base64url")
        ),
        counter: passkey.counter,
        transports: passkey.transports as any,
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return Response.json(
        {
          success: false,
          message: "Passkey authentication failed.",
        },
        { status: 400 }
      );
    }

    // 7. Update the authenticator counter.
    passkey.counter = verification.authenticationInfo.newCounter;
    await passkey.save();

    // 8. Consume the challenge.
    await WebAuthnChallenge.deleteOne({
      _id: challengeRecord._id,
    });

    // 9. Create a new secure session.
    const sessionToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // Enforce one active session per user.
    await Session.deleteMany({
      userId: user._id,
    });

    await Session.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    // 10. Set the HTTP-only session cookie.
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
      message: "Passkey authentication successful.",
    });
  } catch (error) {
    console.error("Passkey login verification error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to verify passkey authentication.",
      },
      { status: 500 }
    );
  }
}
