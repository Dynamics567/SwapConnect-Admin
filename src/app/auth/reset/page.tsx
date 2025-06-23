"use client";
import React, { useState } from "react";
import LoginPage from "../login";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setMessage("");
      return;
    }
    setError("");
    // TODO: Add your reset password logic here
    setMessage("Your password has been reset successfully.");
  };

  return (
    <div className="relative min-h-screen">
      {/* Blurred login page as background */}
      <div className="absolute inset-0 z-0 pointer-events-none blur-xs scale-100">
        <LoginPage />
      </div>
      {/* Popup modal */}
      <div className="fixed inset-0 z-10 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-[530px] border flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold  text-[#037F44] text-center">
            Reset Password
          </h2>
          <p className="mb-6 text-lg text-gray-700 text-center">
            Set your new password to login into your account!
          </p>
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col items-center justify-center"
          >
            <div className="w-full items-center mb-4 relative">
              <label
                htmlFor="new-password"
                className="block mb-1 text-gray-700 text-xs font-medium"
              >
                New Password
              </label>
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                className="w-[440px] text-black px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 placeholder:text-[#909296] placeholder:font-medium pr-12"
                placeholder="Enter New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-8 top-2/3 -translate-y-1/2 text-gray-400 focus:outline-none"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            <div className="w-full mb-4 relative">
              <label
                htmlFor="confirm-password"
                className="block mb-1 text-gray-700 text-xs font-medium"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className="w-[440px] text-black px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 placeholder:text-[#909296] placeholder:font-medium pr-12"
                placeholder="Enter New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-8 top-2/3 -translate-y-1/2 text-gray-400 focus:outline-none"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            <button
              type="submit"
              className="w-[440px] h-[50px] bg-[#037F44] text-lg text-white py-2 rounded text-black transition-colors flex items-center justify-center gap-2"
            >
              Reset Password <ArrowRight size={20} />
            </button>
          </form>
          {error && (
            <div className="mt-4 text-red-600 text-center w-full">{error}</div>
          )}
          {message && (
            <div className="mt-4 text-green-600 text-center w-full">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
