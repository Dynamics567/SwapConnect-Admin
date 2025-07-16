import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'res.cloudinary.com',
      'www.vectorstock.com',
      'loremflickr.com',
      'randomuser.me',
      'fdn2.gsmarena.com',
      'avatars.githubusercontent.com',
      'cdn.jsdelivr.net',
    ],
  },
  /* config options here */
};

export default nextConfig;
