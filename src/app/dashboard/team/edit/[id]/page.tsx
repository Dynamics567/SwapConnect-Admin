"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { ArrowLeft } from "lucide-react";

export default function EditTeamMemberPage() {
  const { id } = useParams();
  const router = useRouter();
  const token = useAuthToken();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id || !token) return;

    const fetchMember = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setName(`${data.firstName} ${data.lastName}`); // 👈 Combine names here
          setEmail(data.email);
          setRole(data.role);
        } else {
          console.error("Failed to fetch member", data);
        }
      } catch (err) {
        console.error("Error fetching member", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const [firstName, ...rest] = name.trim().split(" ");
      const lastName = rest.join(" ");

      const res = await fetch(`${API_URL}/api/admin/edit-admin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          Firstname: firstName,
          Lastname: lastName,
          email,
          role,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.push("/dashboard/team");
        }, 1500);
      } else {
        const errorText = await res.text();
        console.error("Failed to update member:", errorText);
      }
    } catch (err) {
      console.error("Update error", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#037F44] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#037F44] font-medium">
            Fetching member details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] px-4">
      <div
        className="mb-4 flex gap-2 cursor-pointer text-[#037F44] hover:underline"
        onClick={() => router.push("/dashboard/team")}
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back to Team</span>
      </div>

      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-[#037F44]">
          Edit Team Member
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1 text-[#505050]">Name</label>
            <input
              type="text"
              className="w-full border text-black rounded px-3 py-2 text-sm bg-gray-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#505050]">Email</label>
            <input
              type="email"
              className="w-full border text-black rounded px-3 py-2 text-sm bg-gray-50"
              value={email}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[#505050]">Role</label>
            <select
              className="w-full border text-black rounded px-3 py-2 text-sm bg-gray-50"
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
