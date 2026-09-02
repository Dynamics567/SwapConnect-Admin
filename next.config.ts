import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "res.cloudinary.com",
      "www.vectorstock.com",
      "loremflickr.com",
      "randomuser.me",
      "fdn2.gsmarena.com",
      "avatars.githubusercontent.com",
      "cdn.jsdelivr.net",
      "images.unsplash.com",
      "www.vectorstock.com",
    ],
    // Product photos, store branding, and seller avatars are all served
    // from Supabase Storage. This previously listed one specific project
    // ref ("jqtaxkbvfjhyxotzjyyd") that doesn't match the project actually
    // used in production ("mysljqojjfksphtclmyd") -- next/image silently
    // refuses to load any external domain not in this allowlist, so every
    // real product/seller image 404'd here even though the same URL loads
    // fine in the customer frontend (which already uses this same wildcard
    // pattern). A wildcard is also immune to the project ref ever rotating.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  /* config options here */
};

export default nextConfig;
