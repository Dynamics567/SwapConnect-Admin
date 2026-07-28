"use client";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
import { useState } from "react";
import { UserPlus, CheckCircle2 } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPPORT_AGENT", label: "Support Agent" },
  { value: "VERIFICATION_OFFICER", label: "Verification Officer" },
];

export default function AddTeamMemberPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = useAuthToken();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim() || !role) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/team/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName: firstName.trim(), email: email.trim(), role }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          setError("Your session has expired. Redirecting you to log in again…");
          setTimeout(() => { window.location.href = "/auth/login"; }, 1500);
          return;
        }
        setError(data.message || "Failed to send invitation. Please try again.");
        return;
      }
      setSuccess(true);
      setFirstName("");
      setEmail("");
      setRole("ADMIN");
      setTimeout(() => setSuccess(false), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] px-4">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-[#f0faf5] rounded-full p-2.5">
            <UserPlus size={20} className="text-[#037F44]" />
          </span>
          <h2 className="text-xl font-bold text-[#353535]">Invite Team Member</h2>
        </div>
        <p className="text-sm text-[#848484] mb-6 ml-[52px]">
          They&apos;ll get an email to set their own password -- nothing to share here.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[#353535]">Name</label>
            <input
              type="text"
              className="w-full text-[#353535] border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Tolu Olatoye"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[#353535]">Email</label>
            <input
              type="email"
              className="w-full text-[#353535] border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[#353535]">Role</label>
            <select
              className="w-full text-[#353535] border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#037f44]/20 focus:border-[#037f44]"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-sm rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#037F44] text-white py-2.5 rounded-lg font-semibold text-sm mt-1 hover:bg-[#026835] transition-colors disabled:opacity-60"
          >
            {loading ? "Sending invite…" : "Send Invitation"}
          </button>
        </form>
      </div>

      {success && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-xs w-full">
            <span className="bg-[#e6f9f0] rounded-full p-3 inline-flex mb-3">
              <CheckCircle2 size={24} className="text-[#037f44]" />
            </span>
            <p className="text-base font-bold text-[#353535] mb-1">Invitation sent</p>
            <p className="text-sm text-[#848484]">
              They&apos;ll receive an email with a link to set their password.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
