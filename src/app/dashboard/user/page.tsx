"use client";
import React, { Suspense, useEffect, useState } from "react";
import { Users, UserCheck, UserX, UserPlus, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { API_URL } from "@/lib/config";
import { JSX } from "react";
import PageButton from "@/components/PageButton";
import { useAuthContext } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SellerVerificationTab from "@/components/SellerVerificationTab";
import StoreOwnerRequestsTab from "@/components/StoreOwnerRequestsTab";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ApiUser, FormattedUserRow, User } from "@/components/users/types";
import { formatUserRow } from "@/components/users/formatUserRow";
import UserTable from "@/components/users/UserTable";
import UserCard from "@/components/users/UserCard";
import UserFilterPanel, {
  AccountTypeFilter,
  SortBy,
  SortOrder,
  StatusFilter,
} from "@/components/users/UserFilterPanel";

type UserTab = "customers" | "verification" | "store-owner-requests";

interface Stats {
  label: string;
  value: string | number;
  key: string;
  icon: JSX.Element;
}

interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

// Both `name` and `amountSpent` are computed SELECT-list aliases on the
// backend (a CONCAT and a literal subquery), not real columns -- sorting by
// them is plausible but unverified. Drop an entry here if live testing shows
// its sortBy value errors against the API, rather than touching the backend.
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "createdAt", label: "Date Joined" },
  { value: "name", label: "Name" },
  { value: "amountSpent", label: "Amount Spent" },
];

function UserPageInner() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<Stats[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAuthToken();
  const { role } = useAuthContext();
  // "All Customers" was the original, admin/superadmin-only view at this
  // route; Seller Verification's own page was reachable by all 4 staff
  // roles. Merging them into one page/URL must not widen or narrow either
  // capability's original audience -- so the Customers tab stays gated to
  // the roles that always had it, while Verification stays open to all 4.
  const canViewCustomers = role === "admin" || role === "superadmin";
  const [activeTab, setActiveTab] = useState<UserTab>("customers");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "verification" || tab === "store-owner-requests") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (role && !canViewCustomers) {
      setActiveTab("verification");
    }
  }, [role, canViewCustomers]);

  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [banning, setBanning] = useState(false);

  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [suspending, setSuspending] = useState(false);

  const [badgeTarget, setBadgeTarget] = useState<FormattedUserRow | null>(null);
  const [badgeToggling, setBadgeToggling] = useState(false);

  // Direct manual upgrade (Buyer -> Store Owner, bypassing the request
  // queue entirely) -- more powerful than ordinary review, so gated to
  // admin/superadmin only, same audience as suspend/ban.
  const canDirectUpgrade = role === "admin" || role === "superadmin";
  const [upgradeTarget, setUpgradeTarget] = useState<User | null>(null);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  // Filter/sort state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountTypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Message user modal state
  const [messageUserTarget, setMessageUserTarget] = useState<User | null>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState("");

  // Onboard user modal state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardForm, setOnboardForm] = useState({ firstName: "", lastName: "", email: "", accountType: "BUYER" });
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardError, setOnboardError] = useState("");
  const [onboardSuccess, setOnboardSuccess] = useState("");

  const handleRowClick = (userId: string) => {
    router.push(`/dashboard/user/${userId}`);
  };

  // Reset to page 1 whenever the search settles or a filter/sort changes,
  // mirroring the existing status/account-type pattern.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, accountTypeFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    // Skip the fetch while the Verification tab is active -- no point
    // loading the customers list for a tab that isn't visible.
    if (activeTab !== "customers") return;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          role: "user",
          page: String(page),
          limit: "10",
          sortBy,
          sortOrder,
        });
        if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
        if (statusFilter !== "all") params.set("suspended", String(statusFilter === "suspended"));
        if (accountTypeFilter !== "all") params.set("accountType", accountTypeFilter);

        const response = await fetch(
          `${API_URL}/api/admin/users/all?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (data?.users) {
          setUsers(
            (data.users as ApiUser[]).map(
              (u): User => ({
                id: u.id || u._id || "",
                name: u.name,
                email: u.email,
                phone_number: u.phone_number,
                amount_spent: typeof u.amount_spent === "number" ? u.amount_spent : Number(u.amount_spent) || 0,
                date_joined: u.date_joined,
                accountType: u.accountType,
                isSuspended: !!u.isSuspended,
                hasBadge: typeof u.badge === "boolean" ? u.badge : false,
                profileCompletion: u.profileCompletion,
                locationSource: u.locationSource,
              })
            )
          );

          setPagination(data.pagination ?? null);
          setStats([
            {
              label: "Total Users",
              value: `${data?.stats.total_users ?? 0}`,
              key: "users",
              icon: <Users size={22} className="text-brand-emerald" />,
            },
            {
              label: "Active Users",
              value: `${data?.stats.active_users ?? 0}`,
              key: "active_users",
              icon: <UserCheck size={22} className="text-brand-emerald" />,
            },
            {
              label: "Inactive Users",
              value: `${data?.stats.inactive_users ?? 0}`,
              key: "inactive_users",
              icon: <UserX size={22} className="text-brand-emerald" />,
            },
          ]);
        } else {
          setUsers([]);
          setStats([]);
        }
      } catch {
        setUsers([]);
        setStats([]);
        toast.error("Failed to load users. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token, page, debouncedSearch, statusFilter, accountTypeFilter, sortBy, sortOrder, activeTab]);

  const formattedUsers: FormattedUserRow[] = users.map((u) => formatUserRow(u, { canDirectUpgrade }));

  const confirmBan = async () => {
    if (!token || !banTarget) return;
    setBanning(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${banTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to ban user");
      }
      setUsers((prev) => prev.filter((user) => user.id !== banTarget.id));
      toast.success(`${banTarget.name} has been banned.`);
      setBanTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ban user.");
    } finally {
      setBanning(false);
    }
  };

  const confirmSuspend = async () => {
    if (!token || !suspendTarget) return;
    const nextSuspended = !suspendTarget.isSuspended;
    setSuspending(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${suspendTarget.id}/suspend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ suspend: nextSuspended }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to update suspension status");
      }
      setUsers((prev) =>
        prev.map((user) =>
          user.id === suspendTarget.id ? { ...user, isSuspended: nextSuspended } : user
        )
      );
      toast.success(`${suspendTarget.name} has been ${nextSuspended ? "suspended" : "unsuspended"}.`);
      setSuspendTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update suspension status.");
    } finally {
      setSuspending(false);
    }
  };

  const confirmBadgeToggle = async () => {
    if (!token || !badgeTarget) return;
    setBadgeToggling(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/toggle-badge`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: badgeTarget.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to toggle badge");
      const newBadgeState = !!data.user?.badge;
      setUsers((prev) =>
        prev.map((user) => (user.id === badgeTarget.id ? { ...user, hasBadge: newBadgeState } : user))
      );
      toast.success(`Badge has been ${newBadgeState ? "assigned" : "removed"}.`);
      setBadgeTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle badge.");
    } finally {
      setBadgeToggling(false);
    }
  };

  const handleUpgradeToStoreOwner = async () => {
    if (!token || !upgradeTarget) return;
    if (!upgradeReason.trim()) {
      setUpgradeError("A reason is required to upgrade this user.");
      return;
    }
    setUpgradeError("");
    setUpgrading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${upgradeTarget.id}/upgrade-to-store-owner`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: upgradeReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upgrade user");
      setUsers((prev) =>
        prev.map((u) => (u.id === upgradeTarget.id ? { ...u, accountType: "STORE_OWNER" } : u))
      );
      toast.success(`${upgradeTarget.name} has been upgraded to Store Owner.`);
      setUpgradeTarget(null);
      setUpgradeReason("");
    } catch (err: unknown) {
      setUpgradeError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUpgrading(false);
    }
  };

  const handleOnboardUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setOnboardError("");
    setOnboardSuccess("");
    setOnboardLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/onboard-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(onboardForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to onboard user");
      setOnboardSuccess("User onboarded! Setup email sent.");
      setOnboardForm({ firstName: "", lastName: "", email: "", accountType: "BUYER" });
    } catch (err: unknown) {
      setOnboardError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setOnboardLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !messageUserTarget) return;
    if (!messageSubject.trim() || !messageBody.trim()) {
      setMessageError("Subject and message are both required");
      return;
    }
    setMessageError("");
    setMessageSending(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${messageUserTarget.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: messageSubject, message: messageBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send message");
      toast.success(`Message sent to ${messageUserTarget.name}.`);
      setMessageUserTarget(null);
      setMessageSubject("");
      setMessageBody("");
    } catch (err: unknown) {
      setMessageError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMessageSending(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "superadmin", "supportagent", "verificationofficer"]}>
      <div className="flex flex-col gap-8 w-full min-w-0">
        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl shadow p-2 w-full sm:w-fit mb-2 overflow-x-auto min-w-0">
          {canViewCustomers && (
            <button
              className={`px-6 py-2 rounded-lg text-base font-semibold transition shrink-0 whitespace-nowrap ${
                activeTab === "customers"
                  ? "bg-brand-emerald text-white"
                  : "bg-[#F7F8FB] text-brand-emerald hover:bg-brand-emerald-light"
              }`}
              onClick={() => setActiveTab("customers")}
            >
              All Customers
            </button>
          )}
          <button
            className={`px-6 py-2 rounded-lg text-base font-semibold transition shrink-0 whitespace-nowrap ${
              activeTab === "verification"
                ? "bg-brand-emerald text-white"
                : "bg-[#F7F8FB] text-brand-emerald hover:bg-brand-emerald-light"
            }`}
            onClick={() => setActiveTab("verification")}
          >
            Seller Verification
          </button>
          <button
            className={`px-6 py-2 rounded-lg text-base font-semibold transition shrink-0 whitespace-nowrap ${
              activeTab === "store-owner-requests"
                ? "bg-brand-emerald text-white"
                : "bg-[#F7F8FB] text-brand-emerald hover:bg-brand-emerald-light"
            }`}
            onClick={() => setActiveTab("store-owner-requests")}
          >
            Store Owner Requests
          </button>
        </div>

        {activeTab === "customers" && canViewCustomers && (
          <>
            {/* Stat Cards */}
            <div className="md:flex-row flex flex-col gap-4">
              {loading && users.length === 0
                ? [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white w-full md:w-[244px] h-[90px] rounded-lg shadow p-6 flex flex-col justify-center animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-[#F7F8FB] rounded-full p-2 w-10 h-10" />
                        <div>
                          <div className="text-sm text-[#BEBEBE] mb-1 bg-gray-100 w-20 h-4 rounded" />
                          <div className="text-2xl font-bold text-[#353535] bg-gray-100 w-16 h-6 rounded" />
                        </div>
                      </div>
                    </div>
                  ))
                : stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white w-full md:w-[244px] h-[90px] rounded-lg shadow p-6 flex flex-col justify-center"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-[#F7F8FB] rounded-full p-2 flex items-center justify-center">
                          {stat.icon}
                        </span>
                        <div>
                          <div className="text-sm text-[#BEBEBE] mb-1">{stat.label}</div>
                          <div className="text-2xl font-bold text-[#353535]">{stat.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>

            {/* Search, Filter and Onboard */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <UserFilterPanel
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                accountTypeFilter={accountTypeFilter}
                onAccountTypeFilterChange={setAccountTypeFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                sortOptions={SORT_OPTIONS}
              />
              <button
                onClick={() => { setShowOnboardModal(true); setOnboardError(""); setOnboardSuccess(""); }}
                className="flex items-center justify-center gap-2 bg-brand-emerald text-white px-4 py-2 min-h-[44px] rounded hover:bg-brand-emerald-hover transition-colors whitespace-nowrap"
              >
                <UserPlus size={18} />
                Onboard User
              </button>
            </div>

            {/* Onboard User Modal */}
            {showOnboardModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-[#353535]">Onboard New User</h2>
                    <button onClick={() => setShowOnboardModal(false)} className="text-[#848484] hover:text-[#353535]">
                      <X size={20} />
                    </button>
                  </div>

                  {onboardSuccess ? (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-14 h-14 rounded-full bg-brand-emerald-light flex items-center justify-center mx-auto">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13l4 4L19 7" stroke="#02A55C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-brand-emerald font-medium">{onboardSuccess}</p>
                      <p className="text-sm text-[#848484]">The user will receive an email with a link to set up their password.</p>
                      <button
                        onClick={() => { setShowOnboardModal(false); setOnboardSuccess(""); }}
                        className="mt-2 bg-brand-emerald text-white px-6 py-2 rounded hover:bg-brand-emerald-hover transition-colors text-sm"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleOnboardUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#505050] mb-1">First Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={onboardForm.firstName}
                            onChange={(e) => setOnboardForm(f => ({ ...f, firstName: e.target.value }))}
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-brand-emerald"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#505050] mb-1">Last Name</label>
                          <input
                            type="text"
                            value={onboardForm.lastName}
                            onChange={(e) => setOnboardForm(f => ({ ...f, lastName: e.target.value }))}
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-brand-emerald"
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#505050] mb-1">Email Address <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          required
                          value={onboardForm.email}
                          onChange={(e) => setOnboardForm(f => ({ ...f, email: e.target.value }))}
                          className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-brand-emerald"
                          placeholder="user@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#505050] mb-1">Account Type</label>
                        <select
                          value={onboardForm.accountType}
                          onChange={(e) => setOnboardForm(f => ({ ...f, accountType: e.target.value }))}
                          className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-brand-emerald bg-white"
                        >
                          <option value="BUYER">Buyer</option>
                          <option value="STORE_OWNER">Store Owner</option>
                        </select>
                      </div>
                      {onboardError && (
                        <p className="text-red-500 text-sm">{onboardError}</p>
                      )}
                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowOnboardModal(false)}
                          className="flex-1 px-4 py-2 border border-[#e5e7eb] rounded text-sm text-[#505050] hover:bg-[#F7F8FB] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={onboardLoading}
                          className={`flex-1 px-4 py-2 bg-brand-emerald text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${onboardLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-brand-emerald-hover"}`}
                        >
                          {onboardLoading && <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          {onboardLoading ? "Sending..." : "Send Invite"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Users Table (Desktop) */}
            <UserTable
              users={formattedUsers}
              openMenuId={openMenuId}
              onMenuOpenChange={setOpenMenuId}
              onRowClick={(user) => handleRowClick(user.id)}
              onView={(user) => handleRowClick(user.id)}
              onRequestSuspend={(user) => setSuspendTarget(user)}
              onRequestBan={(user) => setBanTarget(user)}
              onRequestBadgeToggle={(user) => setBadgeTarget(user)}
              onRequestMessage={(user) => { setMessageUserTarget(user); setMessageError(""); }}
              onRequestUpgrade={(user) => { setUpgradeTarget(user); setUpgradeReason(""); setUpgradeError(""); }}
            />
            {formattedUsers.length > 0 && (
              <div className="hidden md:block">
                <PageButton
                  page={page}
                  setPage={setPage}
                  totalPages={pagination?.totalPages ?? 0}
                  totalItems={pagination?.totalItems}
                  itemsPerPage={pagination?.itemsPerPage}
                />
              </div>
            )}

            {/* Users Cards (Mobile) */}
            <div className="block md:hidden min-w-0">
              {!loading && formattedUsers.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-sm text-[#848484]">
                  No users match your search and filters.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {formattedUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      menuOpen={openMenuId === user.id}
                      onMenuOpenChange={(open) => setOpenMenuId(open ? user.id : null)}
                      onCardClick={() => handleRowClick(user.id)}
                      onView={() => handleRowClick(user.id)}
                      onRequestSuspend={() => setSuspendTarget(user)}
                      onRequestBan={() => setBanTarget(user)}
                      onRequestBadgeToggle={() => setBadgeTarget(user)}
                      onRequestMessage={() => { setMessageUserTarget(user); setMessageError(""); }}
                      onRequestUpgrade={
                        user.canUpgrade
                          ? () => { setUpgradeTarget(user); setUpgradeReason(""); setUpgradeError(""); }
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
              {formattedUsers.length > 0 && (
                <PageButton
                  page={page}
                  setPage={setPage}
                  totalPages={pagination?.totalPages ?? 0}
                  totalItems={pagination?.totalItems}
                  itemsPerPage={pagination?.itemsPerPage}
                />
              )}
            </div>

            <ConfirmDialog
              open={!!banTarget}
              title="Ban User"
              message={`Are you sure you want to permanently ban ${banTarget?.name ?? "this user"}? This action cannot be undone.`}
              variant="danger"
              confirmLabel="Ban User"
              loading={banning}
              onConfirm={confirmBan}
              onClose={() => setBanTarget(null)}
            />

            <ConfirmDialog
              open={!!suspendTarget}
              title={suspendTarget?.isSuspended ? "Unsuspend User" : "Suspend User"}
              message={
                suspendTarget?.isSuspended
                  ? `${suspendTarget?.name} will regain full access to their account.`
                  : `${suspendTarget?.name} will be temporarily blocked from accessing their account.`
              }
              variant={suspendTarget?.isSuspended ? "default" : "warning"}
              confirmLabel={suspendTarget?.isSuspended ? "Unsuspend" : "Suspend"}
              loading={suspending}
              onConfirm={confirmSuspend}
              onClose={() => setSuspendTarget(null)}
            />

            <ConfirmDialog
              open={!!badgeTarget}
              title={badgeTarget?.hasBadge ? "Remove Badge" : "Assign Badge"}
              message={
                badgeTarget?.hasBadge
                  ? `Remove the badge from ${badgeTarget?.name}?`
                  : `Assign a badge to ${badgeTarget?.name}?`
              }
              confirmLabel={badgeTarget?.hasBadge ? "Remove Badge" : "Assign Badge"}
              loading={badgeToggling}
              onConfirm={confirmBadgeToggle}
              onClose={() => setBadgeTarget(null)}
            />

            <ConfirmDialog
              open={!!upgradeTarget}
              title="Upgrade User?"
              message={
                <div className="space-y-3">
                  <p>
                    This will change {upgradeTarget?.name}&apos;s account from Buyer to Store Owner and give them access
                    to Store Owner features.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                      Reason for upgrade
                    </label>
                    <textarea
                      value={upgradeReason}
                      onChange={(e) => setUpgradeReason(e.target.value)}
                      rows={2}
                      placeholder="Approved as a verified business partner after direct review."
                      className="w-full border rounded-lg px-3 py-2 text-sm resize-none text-gray-800"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {upgradeError && <p className="text-xs text-red-600 mt-1">{upgradeError}</p>}
                  </div>
                </div>
              }
              confirmLabel="Upgrade User"
              loading={upgrading}
              onConfirm={handleUpgradeToStoreOwner}
              onClose={() => {
                setUpgradeTarget(null);
                setUpgradeReason("");
                setUpgradeError("");
              }}
            />

            {/* Message User Modal */}
            {messageUserTarget && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold text-[#353535]">Message {messageUserTarget.name}</h2>
                      <p className="text-xs text-[#848484] mt-0.5">
                        Sent as an in-app notification and an email to {messageUserTarget.email}
                      </p>
                    </div>
                    <button
                      onClick={() => setMessageUserTarget(null)}
                      className="text-[#848484] hover:text-[#353535]"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#505050] mb-1">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                        className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-brand-emerald"
                        placeholder="e.g. Following up on your order"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#505050] mb-1">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-brand-emerald"
                        placeholder="Write your message..."
                      />
                    </div>
                    {messageError && <p className="text-red-500 text-sm">{messageError}</p>}
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setMessageUserTarget(null)}
                        className="flex-1 px-4 py-2 border border-[#e5e7eb] rounded text-sm text-[#505050] hover:bg-[#F7F8FB] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={messageSending}
                        className={`flex-1 px-4 py-2 bg-brand-emerald text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          messageSending ? "opacity-60 cursor-not-allowed" : "hover:bg-brand-emerald-hover"
                        }`}
                      >
                        {messageSending && (
                          <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {messageSending ? "Sending..." : "Send Message"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "verification" && <SellerVerificationTab />}
        {activeTab === "store-owner-requests" && <StoreOwnerRequestsTab />}
      </div>
    </ProtectedRoute>
  );
}

export default function UserPage() {
  return (
    <Suspense fallback={null}>
      <UserPageInner />
    </Suspense>
  );
}
