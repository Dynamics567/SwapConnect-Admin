// hooks/useRole.ts
import { useAuthContext } from "@/context/AuthContext";

export const useRole = () => {
  const { role } = useAuthContext();

  return {
    role,
    isSuperAdmin: role === "superadmin",
    isAdmin: role === "admin",
    isSupportAgent: role === "supportagent",
    isVerificationOfficer: role === "verificationofficer",
  };
};
