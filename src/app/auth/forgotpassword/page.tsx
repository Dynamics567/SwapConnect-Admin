"use client";
import React, { useState } from "react";
import LoginPage from "../login";
import { API_URL } from "@/lib/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      setMessage(data.message || "If this email exists, a reset link has been sent.");
      setSent(true);
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
          <div>
            <h2 className="text-3xl font-bold mb-4 text-[#037F44] text-center">
              Forgot Password?
            </h2>
            <p className="mb-6 text-lg text-gray-700 font-normal text-center">
              Forgot your password? No worries! <br /> We&apos;ll send you a reset
              link to the email below.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4 w-full">
              <div className="w-14 h-14 rounded-full bg-[#e6f9f0] flex items-center justify-center mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#037F44" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-green-700 font-medium">{message}</p>
              <p className="text-sm text-gray-500">Check your inbox and follow the link to reset your password.</p>
              <a
                href="/auth/login"
                className="inline-block mt-2 text-sm text-[#037F44] hover:underline"
              >
                Back to login
              </a>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col items-center justify-center"
            >
              <input
                type="email"
                className="w-[440px] px-3 py-2 border placeholder:text-[#909296] rounded mb-4 focus:outline-none focus:ring focus:border-blue-300"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && (
                <p className="text-red-500 text-sm mb-3 text-center w-full">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`w-[440px] bg-[#037F44] text-white py-2 rounded transition-colors flex items-center justify-center gap-2 ${
                  loading ? "opacity-60 cursor-not-allowed" : "hover:bg-[#026c34]"
                }`}
              >
                {loading && (
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Sending…" : "Get reset link"}
              </button>
              <a
                href="/auth/login"
                className="mt-4 text-sm text-gray-500 hover:text-[#037F44] hover:underline"
              >
                Back to login
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
