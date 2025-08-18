// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";

interface AuthContextType {
  role: string | null;
  setRole: (role: string | null) => void;
  loadings: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const token = useAuthToken();
  const [loadings, setLoadings] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchRole = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/get-dashboard`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data?.admin?.role) {
          setRole(data.admin.role.replace(/_/g, "").toLowerCase()); // ✅ "SUPER_ADMIN" -> "superadmin"
          // console.log(
          //   "Normalized role:",
          //   data.admin.role.replace(/_/g, "").toLowerCase()
          // );
        }
      } catch (err) {
        console.error("Error fetching admin role:", err);
        setRole(null);
      } finally {
        setLoadings(false);
      }
    };

    fetchRole();
  }, [token]);

  return (
    <AuthContext.Provider value={{ role, setRole, loadings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuthContext must be used within AuthProvider");
  return context;
};
