"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const mockFetchMember = (email: string) => {
  // Simulate fetching member data by email
  // Replace this with your actual API call
  const members = [
    { name: "Jane Doe", email: "jane@example.com", role: "Admin" },
    { name: "John Smith", email: "john@example.com", role: "Editor" },
    { name: "Alice Lee", email: "alice@example.com", role: "Viewer" },
  ];
  return (
    members.find((m) => m.email === email) || {
      name: "",
      email,
      role: "Admin",
    }
  );
};

export default function EditTeamMemberPage() {
  const params = useParams();
  const emailParam = decodeURIComponent(params.email as string);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(emailParam);
  const [role, setRole] = useState("Admin");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch member data here (replace with real API)
    const member = mockFetchMember(emailParam);
    setName(member.name);
    setEmail(member.email);
    setRole(member.role);
  }, [emailParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Call your API to update the member here
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] px-4">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-[#037F44]">
          Edit Team Member
        </h2>
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
          <div>
            <label className="block text-sm mb-1 text-[#505050]">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
              value={email}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#505050]">Role</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="super admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="customer support">Customer Support</option>
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-[#037F44] text-white py-2 rounded mt-2 hover:bg-[#025e2e] transition"
          >
            Save Changes
          </button>
        </form>
        {success && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <p className="text-lg text-[#037F44] font-semibold mb-2">
                Success!
              </p>
              <p className="text-gray-700">Team member updated successfully.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
