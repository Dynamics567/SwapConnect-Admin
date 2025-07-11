"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { API_URL } from "@/lib/config";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/useAuthToken";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const token = useAuthToken();

  //redirect if already logged in
  // useEffect(() => {
  //   if (token) {
  //     router.push("/dashboard");
  //   }
  // }, [token, router]);

  //clear error on input change
  useEffect(() => {
    setError("");
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.token) {
        setError(data.message || "Login failed. Please try again.");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);

      // redirect to dashboard
      router.replace("/dashboard");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen  items-center justify-center bg-gray-100">
      <div className="flex bg-white rounded shadow-md  max-w-3xl overflow-hidden">
        {/* Left: Logo and Image */}
        <div className="hidden md:flex flex-col h-auto w-1/2 bg-[#024F2A] w-[720px] p-0 relative min-h-[500px]">
          {/* Logo at top-left */}
          <div className="absolute top-6 left-6">
            <Image
              src="https://res.cloudinary.com/ds83mhjcm/image/upload/v1720710233/SwapConnect/swapconnect-full-logo-trans_lodvax.png"
              alt="Logo"
              width={150}
              height={48}
            />
          </div>
          <div className="flex-1" />
          {/* Image at the bottom, more fit */}
          <div className="w-full flex items-end">
            <Image
              src="https://res.cloudinary.com/ds83mhjcm/image/upload/v1720707824/SwapConnect/auth/login-img_brscfh.png"
              alt="Login"
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: "100%", height: "auto", objectFit: "contain" }}
            />
          </div>
        </div>
        {/* Right: Login Form */}
        <div className="w-full md:w-1/2 flex items-center  justify-center p-8">
          <form onSubmit={handleSubmit} className="w-[720px] max-w-xs">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-[#037F44]">
                Admin Login
              </h2>
              <p className="text-[#000000] text-lg mb-6">
                Kindly login with your provided details
              </p>
            </div>

            {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
            <div className="mb-4">
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 pl-10 text-black py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <div className="relative">
                {/* Lock Icon */}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 5a3 3 0 1 1 6 0v3H9V7Zm-3 5h12v8H6v-8Zm6 3a1 1 0 0 0-1 1v2a1 1 0 1 0 2 0v-2a1 1 0 0 0-1-1Z"
                    />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full px-3 pl-10 pr-10 text-black py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {/* Show/Hide Password Icon */}
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12c-4.418 0-7.938-3.134-8.938-5C4.062 10.134 7.582 7 12 7s7.938 3.134 8.938 5c-1 1.866-4.52 5-8.938 5Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M12 5c-7 0-10 7-10 7s3 7 10 7c2.21 0 4.21-.36 6-1.02l-1.46-1.46C15.42 17.17 13.77 17.5 12 17.5c-4.418 0-7.938-3.134-8.938-5C4.062 10.134 7.582 7 12 7c1.77 0 3.42.33 4.96.98l-1.46 1.46C16.21 8.36 14.21 8 12 8Zm0 2a3 3 0 0 0-2.83 2H7.17c.41-1.16 1.52-2 2.83-2Zm0 8c-1.77 0-3.42-.33-4.96-.98l1.46-1.46C7.79 15.64 9.79 16 12 16c4.418 0 7.938-3.134 8.938-5-.41-1.16-1.52-2-2.83-2h-1.17A3 3 0 0 0 12 15Z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center mb-4">
              <input
                id="remember"
                type="checkbox"
                className="mr-2 accent-[#037F44]"
              />
              <label
                htmlFor="remember"
                className="text-sm text-gray-700 select-none"
              >
                Remember me
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-[#037F44] text-white py-2 rounded  transition-colors"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <div className="mt-4 text-center">
              <span className="text-sm text-black hover:underline cursor-pointer">
                Forgot password?{" "}
                <a href="#" className="text-[#037F44]">
                  Reset
                </a>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
