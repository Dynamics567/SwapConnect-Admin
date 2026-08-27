import ProtectedRoute from "@/components/ProtectedRoute";
import SettingsContent from "@/components/SettingsContent";
import React from "react";

function Page() {
  return (
    <ProtectedRoute
      allowedRoles={[
        "superadmin",
        "admin",
        "supportagent",
        "verificationofficer",
      ]}
    >
      <div className="flex flex-col gap-8 w-full min-w-0">
        <SettingsContent />
      </div>
    </ProtectedRoute>
  );
}

export default Page;
