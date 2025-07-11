import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "res.cloudinary.com",
      "www.vectorstock.com",
      "loremflickr.com",
      "randomuser.me",
    ],
  },
  /* config options here */
};

export default nextConfig;
