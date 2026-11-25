
import {
  generateRegistrationOptions,
} from "@simplewebauthn/server";

import { connectDB } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

import Passkey from "@/models/Passkey";
import WebAuthnChallenge from "@/models/WebAuthnChallenge";

export async function POST() {
  try {
    // 1. Check whether the user is logged in.
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

    // 2. Get the user's existing passkeys.
    const existingPasskeys = await Passkey.find({
      userId: user._id,
    });

    // 3. Configure the WebAuthn relying party.
    const rpName = "Verifi";
    const rpID = process.env.WEBAUTHN_RP_ID || "localhost";

    // 4. Generate registration options.
    const options = await generateRegistrationOptions({
      rpName,
      rpID,

      userID: new Uint8Array(
        Buffer.from(user._id.toString())
      ),

      userName: user.email || user._id.toString(),
      userDisplayName: user.surname,

      attestationType: "none",

      excludeCredentials: existingPasskeys.map((passkey) => ({
        id: passkey.credentialId,
      })),

      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
    });

    // 5. Remove previous registration challenges.
    await WebAuthnChallenge.deleteMany({
      userId: user._id,
      purpose: "registration",
    });

    // 6. Save the new challenge for five minutes.
    await WebAuthnChallenge.create({
      userId: user._id,
      challenge: options.challenge,
      purpose: "registration",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // 7. Return registration options to the browser.
    return Response.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error("Passkey registration options error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to generate passkey registration options.",
      },
      { status: 500 }
    );
  }
}
