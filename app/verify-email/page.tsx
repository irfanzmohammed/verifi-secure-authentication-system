
"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (otp.length !== 6) {
      setError("Please enter the complete six-digit code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid verification code.");
        return;
      }

      router.push("/login");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to resend the code.");
        return;
      }

      setOtp("");
      setCountdown(60);
      setMessage("A new verification code has been sent to your email.");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f7fb] px-5">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-900">
            Email not found
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Please register again to receive your verification code.
          </p>
          <Link
            href="/register"
            className="inline-block mt-5 text-blue-600 font-semibold"
          >
            Go to registration
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
            V
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Verifi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Email verification
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-7">
            <div className="text-3xl mb-4">✉️</div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Verify your email
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Enter the six-digit code sent to
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-1 break-all">
              {email}
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Verification code
              </label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit code"
                required
                className={`w-full rounded-xl border border-gray-200 px-4 py-4 text-center outline-none font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                  otp.length > 0
                    ? "text-2xl tracking-[0.5em]"
                    : "text-base tracking-normal"
                }`}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="mt-2 text-sm font-semibold text-blue-600 disabled:text-gray-400"
            >
              {resending
                ? "Sending..."
                : countdown > 0
                  ? `Resend code in ${countdown}s`
                  : "Resend code"}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link
              href="/register"
              className="text-blue-600 font-semibold"
            >
              Back to registration
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#f5f7fb]">
          <p className="text-gray-500">Loading email verification...</p>
        </main>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
