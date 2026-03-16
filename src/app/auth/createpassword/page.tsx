"use client";

import React, { useState, useEffect} from "react";
import { Eye, EyeOff } from "lucide-react";
import { API_URL } from "@/lib/config";

const passwordRegex =
  /^(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const CreatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    const storedToken = localStorage.getItem("tempToken");

    setToken(urlToken || storedToken || "");
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters, include 1 uppercase letter, 1 number, and 1 special character."
      );
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError( "Token is missing. Please use the link provided in your email.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/admin/add-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to set password");
        setLoading(false);
        return;
      }
      setSuccess("Password set successfully!");
      setPassword("");
      setConfirm("");

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err) {
            console.error(err);

      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const requirements = [
    {
      label: "At least 8 characters",
      test: (pw: string) => pw.length >= 8,
    },
    {
      label: "At least 1 uppercase letter",
      test: (pw: string) => /[A-Z]/.test(pw),
    },
    {
      label: "At least 1 number",
      test: (pw: string) => /\d/.test(pw),
    },
    {
      label: "At least 1 special character",
      test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw),
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl text-black font-bold mb-6 text-center">
          Set Your Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-black font-medium">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border text-black rounded px-3 py-2 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-black font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full border text-black rounded px-3 py-2 pr-10"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowConfirm((prev) => !prev)}
                tabIndex={-1}
              >
                {showConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <button
            type="submit"
            className="w-full bg-[#037F44] text-white py-2 rounded hover:bg-[#025c32] transition"
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>
        </form>
        <div className="mt-4 text-xs text-gray-700">
          {requirements.map((req) => (
            <div key={req.label} className="flex items-center mb-1">
              <input
                type="checkbox"
                checked={req.test(password)}
                readOnly
                className="mr-2 accent-[#037F44]"
              />
              <span className={req.test(password) ? "text-[#037F44]" : ""}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatePasswordPage;