
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import PasskeyRegistration from "@/components/PasskeyRegistration";
import Passkey from "@/models/Passkey";

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check whether the user has already registered a passkey
  const existingPasskey = await Passkey.findOne({
    userId: user._id,
  });

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">
              Verifi
            </h1>
            <p className="text-sm text-gray-500">
              Secure Authentication System
            </p>
          </div>

          <LogoutButton />
        </div>
      </header>

      {/* Dashboard Content */}
      <section className="max-w-6xl mx-auto px-6 py-10">

        {/* Account Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
              {user.surname.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome, {user.surname}!
              </h2>

              <p className="text-gray-500 mt-1">
                You have successfully logged in to Verifi.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-8 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-5">
              Account Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">
                  Email Address
                </p>
                <p className="font-medium text-gray-900 mt-1">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Surname
                </p>
                <p className="font-medium text-gray-900 mt-1">
                  {user.surname}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Date of Birth
                </p>
                <p className="font-medium text-gray-900 mt-1">
                  {new Date(user.dateOfBirth).toLocaleDateString("en-IN")}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Account Status
                </p>
                <p className="font-medium text-green-600 mt-1">
                  Verified
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secure Session */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900">
            Secure Session Active
          </h3>

          <p className="text-sm text-blue-800 mt-2">
            Your account is protected by secure authentication.
            Your session is securely managed by Verifi.
          </p>
        </div>

        {/* Passkey Registration Status */}
        <PasskeyRegistration
          isRegistered={Boolean(existingPasskey)}
        />

      </section>
    </main>
  );
}
