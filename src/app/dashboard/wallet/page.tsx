import WalletContent from "@/components/WalletContent";
import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

function Page() {
  return (
    <ProtectedRoute
      allowedRoles={["superadmin", "supportagent", "verificationofficer"]}
    >
      <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
        <WalletContent />
      </div>
    </ProtectedRoute>
  );
}

export default Page;
