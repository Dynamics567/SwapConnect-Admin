"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import LoginPage from "../login";
import { API_URL } from "@/lib/config";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed");
      setMessage("Password reset successfully!");
      setTimeout(() => router.replace("/auth/login"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Blurred login page as background */}
      <div className="absolute inset-0 z-0 pointer-events-none blur-sm scale-100">
        <LoginPage />
      </div>
      {/* Popup modal */}
      <div className="fixed inset-0 z-10 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-[530px] border flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-[#037F44] text-center mb-2">
            Reset Password
          </h2>
          <p className="mb-6 text-lg text-gray-700 text-center">
            Set your new password to log in to your account.
          </p>

          {message ? (
            <div className="text-center space-y-4 w-full">
              <div className="w-14 h-14 rounded-full bg-[#e6f9f0] flex items-center justify-center mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#037F44" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-green-700 font-medium">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to login…</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col items-center justify-center"
            >
              {!token && (
                <p className="text-red-500 text-sm mb-4 text-center">
                  Missing reset token.{" "}
                  <a href="/auth/forgotpassword" className="underline text-[#037F44]">
                    Request a new link
                  </a>
                </p>
              )}

              <div className="w-full mb-4 relative">
                <label className="block mb-1 text-gray-700 text-xs font-medium">
                  New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-[440px] text-black px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 placeholder:text-[#909296] pr-12"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-8 top-2/3 -translate-y-1/2 text-gray-400 focus:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>

              <div className="w-full mb-4 relative">
                <label className="block mb-1 text-gray-700 text-xs font-medium">
                  Confirm Password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-[440px] text-black px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 placeholder:text-[#909296] pr-12"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-8 top-2/3 -translate-y-1/2 text-gray-400 focus:outline-none"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>

              {error && (
                <p className="text-red-600 text-sm mb-3 text-center w-full">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className={`w-[440px] h-[50px] bg-[#037F44] text-lg text-white py-2 rounded transition-colors flex items-center justify-center gap-2 ${
                  loading || !token ? "opacity-60 cursor-not-allowed" : "hover:bg-[#026c34]"
                }`}
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Reset Password <ArrowRight size={20} /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="h-8 w-8 border-4 border-[#037F44] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
