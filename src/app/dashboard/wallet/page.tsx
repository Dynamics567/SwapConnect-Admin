import WalletContent from "@/components/WalletContent";
import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

function Page() {
  return (
    <ProtectedRoute
      allowedRoles={["superadmin", "supportagent", "verificationofficer"]}
    >
      <div className="flex flex-col gap-8 w-full min-w-0">
        <WalletContent />
      </div>
    </ProtectedRoute>
  );
}

export default Page;
