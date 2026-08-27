import ProtectedRoute from "@/components/ProtectedRoute";
import TeamContent from "@/components/TeamContent";
import React from "react";

function Page() {
  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <div className="flex flex-col gap-8 w-full min-w-0">
        <TeamContent />
      </div>
    </ProtectedRoute>
  );
}

export default Page;
