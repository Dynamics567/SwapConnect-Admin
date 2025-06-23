"use client";
import React, { useState } from "react";
import LoginPage from "../login";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  // const [showResetPopup, setShowResetPopup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add your reset logic here
    setMessage("");
    // setShowResetPopup(true);
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
          <div>
            <h2 className="text-3xl font-bold mb-4 text-[#037F44] text-center">
              Forgot Password?
            </h2>
            <p className="mb-6 text-lg text-gray-700 font-normal text-center">
              Forgot your password? No worries! <br /> We’ll send you a reset
              link to the email below.
            </p>
          </div>
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
            <button
              type="submit"
              className="w-[440px] bg-[#037F44] text-white py-2 rounded text-black transition-colors"
            >
              Get reset link
            </button>
          </form>
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
