
import {
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

import type {
  RegistrationResponseJSON,
} from "@simplewebauthn/server";

import { connectDB } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

import Passkey from "@/models/Passkey";
import WebAuthnChallenge from "@/models/WebAuthnChallenge";

export async function POST(request: Request) {
  try {
    // 1. Authenticate the current user.
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized. Please log in first.",
        },
        { status: 401 }
      );
    }

    await connectDB();

    // 2. Read the authenticator response.
    const body = await request.json();
    const credential = body.credential as RegistrationResponseJSON;

    if (!credential || !credential.id) {
      return Response.json(
        {
          success: false,
          message: "Invalid passkey registration response.",
        },
        { status: 400 }
      );
    }

    // 3. Retrieve the valid registration challenge.
    const challengeRecord = await WebAuthnChallenge.findOne({
      userId: user._id,
      purpose: "registration",
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!challengeRecord) {
      return Response.json(
        {
          success: false,
          message: "Registration challenge expired. Please try again.",
        },
        { status: 400 }
      );
    }

    // 4. Configure expected WebAuthn values.
    const expectedRPID =
      process.env.WEBAUTHN_RP_ID || "localhost";

    const expectedOrigin =
      process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

    // 5. Verify the authenticator response.
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin,
      expectedRPID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return Response.json(
        {
          success: false,
          message: "Passkey verification failed.",
        },
        { status: 400 }
      );
    }

    // 6. Extract the registered credential information.
    const {
      credential: registeredCredential,
      credentialDeviceType,
      credentialBackedUp,
    } = verification.registrationInfo;

    // 7. Save the public credential information.
    await Passkey.create({
      userId: user._id,
      credentialId: registeredCredential.id,
      publicKey: Buffer.from(
        registeredCredential.publicKey
      ).toString("base64url"),
      counter: registeredCredential.counter,
      transports: registeredCredential.transports || [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    });

    // 8. Consume the registration challenge.
    await WebAuthnChallenge.deleteOne({
      _id: challengeRecord._id,
    });

    return Response.json({
      success: true,
      message: "Passkey registered successfully.",
    });
  } catch (error) {
    console.error("Passkey registration verification error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to verify passkey registration.",
      },
      { status: 500 }
    );
  }
}
