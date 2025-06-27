"use client";
import React, { useState } from "react";

export default function AddTeamMemberPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("super admin");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would call your API to add the team member
    setSuccess(true);
    setName("");
    setEmail("");
    setRole("super admin");
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] px-4">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-[#037F44]">
          Add New Member
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
              onChange={(e) => setEmail(e.target.value)}
              required
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
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-[#037F44] text-white py-2 rounded mt-2 hover:bg-[#025e2e] transition"
          >
            Add Member
          </button>
        </form>
        {success && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <p className="text-lg text-[#037F44] font-semibold mb-2">
                Success!
              </p>
              <p className="text-gray-700">Team member added successfully.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
