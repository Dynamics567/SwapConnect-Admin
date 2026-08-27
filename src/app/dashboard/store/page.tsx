import PhysicalStore from "@/components/PhysicalStore";
import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

function Page() {
  return (
    <ProtectedRoute
      allowedRoles={["superadmin", "admin", "verificationofficer"]}
    >
      <div className="flex flex-col gap-8 w-full min-w-0">
        <PhysicalStore />
      </div>
    </ProtectedRoute>
  );
}

export default Page;
