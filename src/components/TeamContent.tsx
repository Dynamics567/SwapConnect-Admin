"use client";
import React, { useState, useEffect } from "react";
import { Plus, Filter, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import PageButton from "./PageButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import ActionMenu, { ActionMenuItem } from "./ui/ActionMenu";
import { ConfirmDialog } from "./ui/ConfirmDialog";

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

type PendingActionType = "deactivate" | "activate" | "delete" | "reset-password";

export default function TeamContent() {
  const [activeTab, setActiveTab] = useState<"teams" | "roles">("teams");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages] = useState(0);
  const [team, setTeam] = useState<Teams[]>([]);
  // Keyed by member._id, not array index -- an index-keyed version of this
  // broke once a mobile card view (a second, independently-filtered/sorted
  // rendering of the same rows) was added elsewhere in the app, since the
  // same index can point at a different row in each view.
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: PendingActionType; id: string } | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
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

  const pendingMember = pendingAction ? team.find((t) => t._id === pendingAction.id) ?? null : null;

  const closeActionDialogs = () => {
    setPendingAction(null);
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
      toast.success(suspend ? `${member.firstName} has been deactivated.` : `${member.firstName} has been reactivated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
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
      toast.success(`${member.firstName}'s account has been deleted.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
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
      toast.success(data.message || `A password reset link has been sent to ${member.email}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setActionBusy(false);
      closeActionDialogs();
    }
  };

  const confirmPendingAction = () => {
    if (!pendingMember || !pendingAction) return;
    if (pendingAction.type === "delete") return handleDelete(pendingMember);
    if (pendingAction.type === "reset-password") return handleTriggerReset(pendingMember);
    return handleToggleSuspend(pendingMember, pendingAction.type === "deactivate");
  };

  const menuItemsFor = (member: Teams): ActionMenuItem[] => [
    { label: "Edit", variant: "accent", onClick: () => router.push(`/dashboard/team/edit/${member._id}`) },
    { label: "Reset Password", onClick: () => setPendingAction({ type: "reset-password", id: member._id }) },
    member.suspended
      ? { label: "Activate", onClick: () => setPendingAction({ type: "activate", id: member._id }) }
      : { label: "Deactivate", onClick: () => setPendingAction({ type: "deactivate", id: member._id }) },
    { label: "Delete", variant: "danger", onClick: () => setPendingAction({ type: "delete", id: member._id }), divider: true },
  ];

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
        if (data?.data) {
          setTeam(data?.data);
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

  const dialogCopy: Record<PendingActionType, { title: string; variant: "default" | "warning" | "danger"; confirmLabel: string }> = {
    delete: { title: "Delete Account", variant: "danger", confirmLabel: "Yes, Delete" },
    activate: { title: "Activate Member", variant: "default", confirmLabel: "Yes, Activate" },
    "reset-password": { title: "Reset Password", variant: "default", confirmLabel: "Send Reset Link" },
    deactivate: { title: "Deactivate Member", variant: "warning", confirmLabel: "Yes, Deactivate" },
  };

  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <div className="w-full flex flex-col gap-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-brand-emerald">Teams Section</h2>
          {activeTab === "teams" && (
            <button
              className="flex items-center justify-center gap-2 bg-brand-emerald text-white px-4 py-2 min-h-[44px] rounded-lg hover:bg-brand-emerald-hover transition"
              onClick={() => router.push("/dashboard/team/add")}
            >
              <Plus size={18} />
              Add new team member
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl shadow p-2 w-full lg:w-fit mb-2 overflow-x-auto min-w-0">
          <button
            className={`px-6 py-2 rounded-lg text-base font-semibold transition shrink-0 whitespace-nowrap ${
              activeTab === "teams"
                ? "bg-brand-emerald text-white"
                : "bg-[#F7F8FB] text-brand-emerald hover:bg-brand-emerald-light"
            }`}
            onClick={() => setActiveTab("teams")}
          >
            Teams
          </button>
          <button
            className={`px-6 py-2 rounded-lg text-base font-semibold transition shrink-0 whitespace-nowrap ${
              activeTab === "roles"
                ? "bg-brand-emerald text-white"
                : "bg-[#F7F8FB] text-brand-emerald hover:bg-brand-emerald-light"
            }`}
            onClick={() => setActiveTab("roles")}
          >
            Roles &amp; Permission
          </button>
        </div>

        {/* Search and Filter */}
        {activeTab === "teams" && (
          <div className="flex gap-2 w-full">
            <div className="relative w-full min-w-0">
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
            <button className="flex items-center gap-1 px-4 py-2 bg-[#F7F8FB] border rounded-lg text-brand-emerald hover:bg-brand-emerald-light shrink-0">
              <Filter size={16} />
              Filter
            </button>
          </div>
        )}

        {activeTab === "teams" ? (
          loading ? (
            <p>Loading Team...</p>
          ) : filteredTeams.length === 0 ? (
            <p className="text-center text-[#848484] mt-6">No teams found</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block bg-white rounded-xl shadow p-4 w-full overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-brand-emerald-light text-[#505050] text-left">
                      <th className="py-2 px-4 font-normal text-sm">Name</th>
                      <th className="py-2 px-4 font-normal text-sm">Email</th>
                      <th className="py-2 px-4 font-normal text-sm">Role</th>
                      <th className="py-2 px-4 font-normal text-sm">Status</th>
                      <th className="py-2 px-4 font-normal text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((member) => (
                      <tr key={member._id} className="text-[#434343] text-sm">
                        <td className="py-2 px-4">{member.firstName}</td>
                        <td className="py-2 px-4">{member.email}</td>
                        <td className="py-2 px-4">{member.role}</td>
                        <td className="py-2 px-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              member.suspended ? "bg-gray-100 text-gray-500" : "bg-brand-emerald-light text-brand-emerald"
                            }`}
                            title={member.suspended && member.suspensionReason ? member.suspensionReason : undefined}
                          >
                            {member.suspended ? "Deactivated" : "Active"}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <ActionMenu
                            items={menuItemsFor(member)}
                            open={actionMenuId === member._id}
                            onOpenChange={(open) => setActionMenuId(open ? member._id : null)}
                            ariaLabel={`Actions for ${member.firstName}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PageButton page={page} setPage={setPage} totalPages={totalPages} />
              </div>

              {/* Mobile/tablet cards */}
              <div className="flex flex-col gap-4 lg:hidden">
                {filteredTeams.map((member) => (
                  <div key={member._id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#353535] break-words">{member.firstName}</p>
                        <p className="text-sm text-[#505050] break-words">{member.email}</p>
                      </div>
                      <ActionMenu
                        items={menuItemsFor(member)}
                        open={actionMenuId === member._id}
                        onOpenChange={(open) => setActionMenuId(open ? member._id : null)}
                        ariaLabel={`Actions for ${member.firstName}`}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm text-[#505050]">{member.role}</span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          member.suspended ? "bg-gray-100 text-gray-500" : "bg-brand-emerald-light text-brand-emerald"
                        }`}
                      >
                        {member.suspended ? "Deactivated" : "Active"}
                      </span>
                    </div>
                  </div>
                ))}
                <PageButton page={page} setPage={setPage} totalPages={totalPages} />
              </div>
            </>
          )
        ) : (
          <>
            <p className="text-xs text-[#848484]">
              These are SwapConnect&apos;s fixed staff roles, enforced by the backend for every admin action. They aren&apos;t custom or editable here.
            </p>

            {/* Desktop table */}
            <div className="hidden lg:block bg-white rounded-xl shadow p-4 w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-brand-emerald-light text-[#505050] text-left">
                    <th className="py-2 px-4 font-normal text-sm">Role</th>
                    <th className="py-2 px-4 font-normal text-sm">Permission</th>
                  </tr>
                </thead>
                <tbody>
                  {rolesData.map((role) => (
                    <tr key={role.role} className="text-[#434343] text-sm">
                      <td className="py-2 px-4 font-medium">{role.role}</td>
                      <td className="py-2 px-4">{role.permission}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/tablet cards */}
            <div className="flex flex-col gap-3 lg:hidden">
              {rolesData.map((role) => (
                <div key={role.role} className="bg-white rounded-xl shadow p-4 flex flex-col gap-1">
                  <p className="font-semibold text-[#353535]">{role.role}</p>
                  <p className="text-sm text-[#505050]">{role.permission}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <ConfirmDialog
          open={!!pendingAction && !!pendingMember}
          title={pendingAction ? dialogCopy[pendingAction.type].title : ""}
          variant={pendingAction ? dialogCopy[pendingAction.type].variant : "default"}
          confirmLabel={pendingAction ? dialogCopy[pendingAction.type].confirmLabel : "Confirm"}
          loading={actionBusy}
          onConfirm={confirmPendingAction}
          onClose={closeActionDialogs}
          message={
            !pendingAction || !pendingMember ? "" : pendingAction.type === "delete" ? (
              <>
                This permanently deletes <span className="font-semibold">{pendingMember.firstName}</span>&apos;s
                account. This cannot be undone.
              </>
            ) : pendingAction.type === "activate" ? (
              <>
                Restore access for <span className="font-semibold">{pendingMember.firstName}</span>?
              </>
            ) : pendingAction.type === "reset-password" ? (
              <>
                Send <span className="font-semibold">{pendingMember.firstName}</span> a password reset link at{" "}
                {pendingMember.email}? This also works if they never finished setting up their account.
              </>
            ) : (
              <div className="space-y-3">
                <p>
                  <span className="font-semibold">{pendingMember.firstName}</span> won&apos;t be able to sign in
                  until reactivated.
                </p>
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800"
                />
              </div>
            )
          }
        />
      </div>
    </ProtectedRoute>
  );
}
