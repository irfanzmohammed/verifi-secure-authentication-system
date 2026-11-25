
"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

interface Props {
  isRegistered: boolean;
}

export default function PasskeyRegistration({
  isRegistered,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    setLoading(true);
    setError("");

    try {
      // Request registration options from the backend
      const optionsResponse = await fetch(
        "/api/webauthn/register-options",
        {
          method: "POST",
        }
      );

      const optionsData = await optionsResponse.json();

      if (!optionsResponse.ok) {
        throw new Error(
          optionsData.message || "Unable to start passkey registration."
        );
      }

      // Open the browser's passkey registration prompt
      const credential = await startRegistration({
        optionsJSON: optionsData.options,
      });

      // Verify the registered passkey on the server
      const verifyResponse = await fetch(
        "/api/webauthn/register-verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credential }),
        }
      );

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(
          verifyData.message || "Passkey registration failed."
        );
      }

      // Refresh dashboard to show updated registration status
      window.location.reload();

    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Passkey registration was cancelled or not allowed.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Unable to register passkey. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

      <h3 className="text-lg font-semibold text-gray-900">
        Biometric Authentication
      </h3>

      <p className="text-sm text-gray-500 mt-2">
        Sign in using your device's supported authenticator,
        such as fingerprint, Face ID, or device PIN.
      </p>

      {isRegistered ? (
        <div className="mt-5 flex items-center gap-2 text-green-600 font-medium">
          <span className="text-lg">✓</span>
          <span>Passkey Registered</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleRegister}
          disabled={loading}
          className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register Passkey"}
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

    </div>
  );
}
