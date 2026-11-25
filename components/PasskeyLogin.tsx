
"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";

interface Props {
  email: string;
}

export default function PasskeyLogin({ email }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePasskeyLogin() {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);

    try {
      // 1. Request authentication options.
      const optionsResponse = await fetch(
        "/api/webauthn/login-options",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const optionsData = await optionsResponse.json();

      if (!optionsResponse.ok) {
        throw new Error(
          optionsData.message || "Unable to start passkey login."
        );
      }

      // 2. Open the device authenticator.
      const credential = await startAuthentication({
        optionsJSON: optionsData.options,
      });

      // 3. Verify the authenticator response.
      const verificationResponse = await fetch(
        "/api/webauthn/login-verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            credential,
          }),
        }
      );

      const verificationData = await verificationResponse.json();

      if (!verificationResponse.ok) {
        throw new Error(
          verificationData.message || "Passkey login failed."
        );
      }

      // 4. Redirect after successful authentication.
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Passkey authentication was cancelled or not allowed.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to log in using your passkey."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={handlePasskeyLogin}
        disabled={loading || !email.trim()}
        className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
      >
        {loading
          ? "Authenticating..."
          : "Login with Face ID / Fingerprint"}
      </button>

      {error && (
        <p className="mt-3 text-center text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
