"use client";
import React, { useState, useEffect } from "react";
import { Plus, Filter, Search, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import PageButton from "./PageButton";
import ProtectedRoute from "@/components/ProtectedRoute";

// const teamData = [
//   { name: "Jane Doe", email: "jane@example.com", role: "Admin" },
//   { name: "John Smith", email: "john@example.com", role: "Editor" },
//   { name: "Alice Lee", email: "alice@example.com", role: "Viewer" },
// ];
interface Teams {
  _id: string;
  firstName: string;
  email: string;
  role: string;
  suspended?: boolean;
  suspensionReason?: string | null;
}
// These are SwapConnect's real, fixed staff roles -- baked into the backend's
// route middleware (src/utils/enum.js + authorizeRoles checks), not
// database-backed records. There's no custom role/permission system to
// create or edit roles against, so this table is read-only and the
// descriptions below reflect what each role can actually do today.
const rolesData = [
  {
    role: "Super Admin",
    permission:
      "Full access -- manage admin/staff accounts, change any user's email, delete or promote/demote accounts, plus everything below",
  },
  {
    role: "Admin",
    permission:
      "Manage users (suspend, badges, approve/reject listings), onboard staff, view all reports & dashboards",
  },
  {
    role: "Support Agent",
    permission:
      "View users, orders, transactions & disputes; message users; review seller verifications",
  },
  {
    role: "Verification Officer",
    permission:
      "Review and approve/reject seller verification submissions; same view access as Support Agent",
  },
];

export default function TeamContent() {
  const [activeTab, setActiveTab] = useState<"teams" | "roles">("teams");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages] = useState(0);
  const [team, setTeam] = useState<Teams[]>([]);
  const [actionMenuIdx, setActionMenuIdx] = useState<number | null>(null);
  // Which confirm dialog is open, and for which row -- replaces the old
  // single confirmIdx, since there are now three distinct destructive
  // actions (deactivate / activate / delete) instead of just one.
  const [pendingAction, setPendingAction] = useState<{ type: "deactivate" | "activate" | "delete" | "reset-password"; idx: number } | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const showToast = (text: string, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 2500);
  };
  const router = useRouter();
  const token = useAuthToken();

  const filteredTeams = (team || []).filter((t) => {
    const searchTerm = search.toLowerCase().trim();

    if (!searchTerm) return true; // show all when empty

    return (
      t.firstName?.toLowerCase().includes(searchTerm) ||
      t.email?.toLowerCase().includes(searchTerm) ||
      t.role?.toLowerCase().includes(searchTerm)
    );
  });

  const closeActionDialogs = () => {
    setPendingAction(null);
    setActionMenuIdx(null);
    setDeactivateReason("");
  };

  const handleToggleSuspend = async (member: Teams, suspend: boolean) => {
    setActionBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${member._id}/suspend`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ suspend, reason: suspend ? deactivateReason || "Deactivated by admin" : undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update account status");

      setTeam((prev) =>
        prev.map((t) =>
          t._id === member._id ? { ...t, suspended: suspend, suspensionReason: suspend ? data.user?.suspensionReason : null } : t
        )
      );
      showToast(suspend ? `${member.firstName} has been deactivated.` : `${member.firstName} has been reactivated.`);
    } catch (error) {
      console.error("Error updating account status:", error);
      showToast(error instanceof Error ? error.message : "Something went wrong", true);
    } finally {
      setActionBusy(false);
      closeActionDialogs();
    }
  };

  const handleDelete = async (member: Teams) => {
    setActionBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${member._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete account");

      setTeam((prev) => prev.filter((t) => t._id !== member._id));
      showToast(`${member.firstName}'s account has been deleted.`);
    } catch (error) {
      console.error("Error deleting account:", error);
      showToast(error instanceof Error ? error.message : "Something went wrong", true);
    } finally {
      setActionBusy(false);
      closeActionDialogs();
    }
  };

  const handleTriggerReset = async (member: Teams) => {
    setActionBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${member._id}/trigger-password-reset`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send reset link");
      showToast(data.message || `A password reset link has been sent to ${member.email}.`);
    } catch (error) {
      console.error("Error triggering password reset:", error);
      showToast(error instanceof Error ? error.message : "Something went wrong", true);
    } finally {
      setActionBusy(false);
      closeActionDialogs();
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/all-admins`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const data = await response.json();
        console.log("API Response", data);
        if (data?.data) {
          setTeam(data?.data);
          // setPage(data?.pagination.currentPage || 1);
          // setTotalPages(data?.pagination.totalPages || 1);
        } else {
          setTeam([]);
        }
      } catch {
        setTeam([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [token]);
  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <div className="w-full flex flex-col gap-6 relative">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#037F44]">Teams Section</h2>
          {activeTab === "teams" && (
            <button
              className="flex items-center gap-2 bg-[#037F44] text-white px-4 py-2 rounded-lg hover:bg-[#025e2e] transition"
              onClick={() => router.push("/dashboard/team/add")}
            >
              <Plus size={18} />
              Add new team member{" "}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl shadow p-2 w-fit mb-2">
          <button
            className={`px-6 py-2 rounded-lg text-base font-semibold transition ${
              activeTab === "teams"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("teams")}
          >
            Teams
          </button>
          <button
            className={`px-6 py-2 rounded-lg text-base font-semibold transition ${
              activeTab === "roles"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("roles")}
          >
            Roles &amp; Permission
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 w-full">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search team members"
              className="w-full border rounded-lg px-10 py-2 text-sm bg-gray-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>
          <button className="flex items-center gap-1 px-4 py-2 bg-[#F7F8FB] border rounded-lg text-[#037F44] hover:bg-[#e6f4ed]">
            <Filter size={16} />
            Filter
          </button>
        </div>

        {/* Table */}

        {activeTab === "teams" ? (
          <div className="bg-white rounded-xl shadow p-4 w-full overflow-x-auto">
            {loading ? (
              <p>Loading Team...</p>
            ) : filteredTeams.length === 0 ? (
              <div>
                <p className="text-center text-[#848484] mt-6">
                  No teams found
                </p>
              </div>
            ) : (
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-[#CCDCD4] text-[#505050] text-left">
                    <th className="py-2 px-4 font-normal text-sm">Name</th>
                    <th className="py-2 px-4 font-normal text-sm">Email</th>
                    <th className="py-2 px-4 font-normal text-sm">Role</th>
                    <th className="py-2 px-4 font-normal text-sm">Status</th>
                    <th className="py-2 px-4 font-normal text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((member, idx) => (
                    <tr key={member._id} className="text-[#434343] text-sm relative">
                      <td className="py-2 px-4">{member.firstName}</td>
                      <td className="py-2 px-4">{member.email}</td>
                      <td className="py-2 px-4">{member.role}</td>
                      <td className="py-2 px-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            member.suspended ? "bg-gray-100 text-gray-500" : "bg-[#e6f9f0] text-[#037F44]"
                          }`}
                          title={member.suspended && member.suspensionReason ? member.suspensionReason : undefined}
                        >
                          {member.suspended ? "Deactivated" : "Active"}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <button
                          className="text-[#037F44] hover:bg-[#F7F8FB] rounded-full p-1"
                          onClick={() =>
                            setActionMenuIdx(actionMenuIdx === idx ? null : idx)
                          }
                          type="button"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {actionMenuIdx === idx && (
                          <div className="absolute z-10 right-6 mt-2 w-40 bg-white border rounded shadow-lg">
                            <button
                              className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44] text-sm"
                              onClick={() => {
                                setActionMenuIdx(null);
                                router.push(`/dashboard/team/edit/${member._id}`);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44] text-sm"
                              onClick={() => setPendingAction({ type: "reset-password", idx })}
                            >
                              Reset Password
                            </button>
                            {member.suspended ? (
                              <button
                                className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44] text-sm"
                                onClick={() => setPendingAction({ type: "activate", idx })}
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-yellow-700 text-sm"
                                onClick={() => setPendingAction({ type: "deactivate", idx })}
                              >
                                Deactivate
                              </button>
                            )}
                            <button
                              className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-red-600 text-sm"
                              onClick={() => setPendingAction({ type: "delete", idx })}
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        {pendingAction?.idx === idx && (
                          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                            <div className="bg-white rounded-lg shadow-lg p-6 text-center w-full max-w-sm">
                              {pendingAction.type === "delete" ? (
                                <>
                                  <p className="text-lg font-semibold mb-4 text-red-600">
                                    Delete Account
                                  </p>
                                  <p className="mb-6 text-gray-700">
                                    This permanently deletes{" "}
                                    <span className="font-semibold">{member.firstName}</span>&apos;s
                                    account. This cannot be undone.
                                  </p>
                                </>
                              ) : pendingAction.type === "activate" ? (
                                <>
                                  <p className="text-lg font-semibold mb-4 text-[#037F44]">
                                    Activate Member
                                  </p>
                                  <p className="mb-6 text-gray-700">
                                    Restore access for{" "}
                                    <span className="font-semibold">{member.firstName}</span>?
                                  </p>
                                </>
                              ) : pendingAction.type === "reset-password" ? (
                                <>
                                  <p className="text-lg font-semibold mb-4 text-[#037F44]">
                                    Reset Password
                                  </p>
                                  <p className="mb-6 text-gray-700">
                                    Send <span className="font-semibold">{member.firstName}</span> a
                                    password reset link at {member.email}? This also works if they
                                    never finished setting up their account.
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-lg font-semibold mb-4 text-yellow-700">
                                    Deactivate Member
                                  </p>
                                  <p className="mb-4 text-gray-700">
                                    <span className="font-semibold">{member.firstName}</span>{" "}
                                    won&apos;t be able to sign in until reactivated.
                                  </p>
                                  <input
                                    type="text"
                                    placeholder="Reason (optional)"
                                    value={deactivateReason}
                                    onChange={(e) => setDeactivateReason(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
                                  />
                                </>
                              )}
                              <div className="flex gap-4 justify-center">
                                <button
                                  className="px-6 py-2 rounded bg-gray-200 text-gray-700"
                                  onClick={closeActionDialogs}
                                  disabled={actionBusy}
                                >
                                  Cancel
                                </button>
                                <button
                                  className={`px-6 py-2 rounded text-white disabled:opacity-60 ${
                                    pendingAction.type === "delete" ? "bg-red-600" : "bg-[#037F44]"
                                  }`}
                                  disabled={actionBusy}
                                  onClick={() =>
                                    pendingAction.type === "delete"
                                      ? handleDelete(member)
                                      : pendingAction.type === "reset-password"
                                        ? handleTriggerReset(member)
                                        : handleToggleSuspend(member, pendingAction.type === "deactivate")
                                  }
                                >
                                  {actionBusy
                                    ? "Working…"
                                    : pendingAction.type === "delete"
                                      ? "Yes, Delete"
                                      : pendingAction.type === "activate"
                                        ? "Yes, Activate"
                                        : pendingAction.type === "reset-password"
                                          ? "Send Reset Link"
                                          : "Yes, Deactivate"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTeams.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 text-center text-gray-400"
                      >
                        No team members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            <PageButton page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-4 w-full overflow-x-auto">
            <p className="text-xs text-[#848484] mb-3">
              These are SwapConnect&apos;s fixed staff roles, enforced by the backend for every admin action. They aren&apos;t custom or editable here.
            </p>
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-[#CCDCD4] text-[#505050] text-left">
                  <th className="py-2 px-4 font-normal text-sm">Role</th>
                  <th className="py-2 px-4 font-normal text-sm">Permission</th>
                </tr>
              </thead>
              <tbody>
                {rolesData.map((role, idx) => (
                  <tr key={idx} className="text-[#434343] text-sm">
                    <td className="py-2 px-4 font-medium">{role.role}</td>
                    <td className="py-2 px-4">{role.permission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Success/error toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-[60] ${
              toast.error ? "bg-red-600" : "bg-[#037F44]"
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
