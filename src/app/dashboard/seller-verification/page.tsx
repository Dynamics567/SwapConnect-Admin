"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Seller Verification now lives as a tab inside User Management -- see
// src/components/SellerVerificationTab.tsx -- since it operates on the same
// userId records that page already manages. This route is kept as a
// client-side redirect so existing bookmarks/links to the old URL still land
// on the right place instead of 404ing.
export default function SellerVerificationRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/user?tab=verification");
  }, [router]);

  return null;
}
