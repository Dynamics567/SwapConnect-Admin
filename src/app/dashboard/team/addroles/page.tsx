"use client";
import React, { useState } from "react";

export default function AddTeamMemberPage() {
  const [name, setName] = useState("");
  // const [role, setRole] = useState("super admin");
  const [success, setSuccess] = useState(false);
  const [permissionsSelected, setPermissionsSelected] = useState<string[]>([
    "all_access",
  ]);

  const permissions = [
    { value: "all_access", label: "All Access" },
    { value: "manage_users", label: "Manage Users" },
    { value: "view_reports", label: "View Reports" },
    { value: "edit_content", label: "Edit Content" },
    { value: "manage_posts", label: "Manage Posts" },
    { value: "view_tickets", label: "View Tickets" },
    { value: "respond_users", label: "Respond to Users" },
  ];

  const handlePermissionChange = (permValue: string) => {
    if (permissionsSelected.includes(permValue)) {
      setPermissionsSelected(
        permissionsSelected.filter((p) => p !== permValue)
      );
    } else {
      setPermissionsSelected([...permissionsSelected, permValue]);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would call your API to add the team member
    setSuccess(true);
    setName("");
    setPermissionsSelected([]);

    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] px-4">
      <div className="bg-white rounded-xl gap-8 shadow p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-[#037F44]">Create Role </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1 text-[#505050]">Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <p className="text-[#030229] text-base">Select permissions</p>
          <div className="flex flex-col gap-2">
            {permissions.map((perm) => (
              <label
                key={perm.value}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="permission"
                  value={perm.value}
                  checked={permissionsSelected.includes(perm.value)}
                  onChange={() => handlePermissionChange(perm.value)}
                  className="accent-[#037F44]"
                />
                {perm.label}
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="w-full bg-[#037F44] text-white py-2 rounded mt-2 hover:bg-[#025e2e] transition"
          >
            Create role{" "}
          </button>
        </form>
        {success && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <p className="text-lg text-[#037F44] font-semibold mb-2">
                Success!
              </p>
              <p className="text-gray-700">
                Role has been created successfully.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
