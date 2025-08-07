// components/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

export default function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { role, loadings } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loadings && role && !allowedRoles.includes(role)) {
      router.replace("/unauthorized"); // Make sure this exists
    }
  }, [role, loadings]);

  if (loadings) {
    return <div className="text-center p-6">Loading...</div>;
  }

  return <>{children}</>;
}
