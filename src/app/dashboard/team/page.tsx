import ProtectedRoute from "@/components/ProtectedRoute";
import TeamContent from "@/components/TeamContent";
import React from "react";

function Page() {
  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
        <TeamContent />
      </div>
    </ProtectedRoute>
  );
}

export default Page;
