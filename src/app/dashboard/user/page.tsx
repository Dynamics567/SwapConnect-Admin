"use client";
import React, { Suspense, useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
import { JSX } from "react";
import PageButton from "@/components/PageButton";
import ConfirmModal from "@/components/ConfirmModat";
import { useAuthContext } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SellerVerificationTab from "@/components/SellerVerificationTab";

type UserTab = "customers" | "verification";

// const PAGE_SIZE = 10;
interface Stats {
  label: string;
  value: string | number;
  key: string;
  icon: JSX.Element;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  amount_spent: string;
  date_joined: string;
  accountType?: string;
  isSuspended?: boolean;
  hasBadge?: boolean;
}
interface ApiUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone_number: string;
  amount_spent: string;
  date_joined: string;
  accountType?: string;
  isSuspended?: boolean;
  badge: boolean;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  BUYER: "Buyer",
  STORE_OWNER: "Store Owner",
  STAFF: "Staff",
};
const ACCOUNT_TYPE_STYLES: Record<string, string> = {
  BUYER: "bg-[#e6f9f0] text-[#037F44]",
  STORE_OWNER: "bg-[#fef9ec] text-[#a9791f]",
  STAFF: "bg-[#F7F8FB] text-[#505050]",
};

function AccountTypeBadge({ accountType }: { accountType?: string }) {
  const key = accountType || "BUYER";
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
        ACCOUNT_TYPE_STYLES[key] || ACCOUNT_TYPE_STYLES.BUYER
      }`}
    >
      {ACCOUNT_TYPE_LABELS[key] || key}
    </span>
  );
}

function UserPageInner() {
  const [search, setSearch] = useState("");
  const [dropdownIdx, setDropdownIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
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
    if (searchParams.get("tab") === "verification") {
      setActiveTab("verification");
    }
  }, [searchParams]);

  useEffect(() => {
    if (role && !canViewCustomers) {
      setActiveTab("verification");
    }
  }, [role, canViewCustomers]);

  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState<"all" | "BUYER" | "STORE_OWNER" | "STAFF">("all");

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
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    // Skip the fetch while the Verification tab is active -- no point
    // loading the customers list for a tab that isn't visible.
    if (activeTab !== "customers") return;
    const fetchUser = async () => {
      try {
        const params = new URLSearchParams({ role: "user", page: String(page), limit: "10" });
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
        // console.log("API response", data);
        if (data) {
          setUsers(
            (data.users as ApiUser[]).map(
              (u): User => ({
                id: u.id || u._id || "",
                name: u.name,
                email: u.email,
                phone_number: u.phone_number,
                amount_spent: u.amount_spent,
                date_joined: u.date_joined,
                accountType: u.accountType,
                isSuspended: !!u.isSuspended,
                hasBadge: typeof u.badge === "boolean" ? u.badge : false,
              })
            )
          );

          setPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
          setStats([
            {
              label: "Total Users",
              value: `${data?.stats.total_users ?? 0}`,
              key: "users",
              icon: <Users size={22} className="text-[#037F44]" />,
            },
            {
              label: "Active Users",
              value: `${data?.stats.active_users ?? 0}`,
              key: "active_users",
              icon: <UserCheck size={22} className="text-[#037F44]" />,
            },
            {
              label: "Inactive Users",
              value: `${data?.stats.inactive_users ?? 0}`,
              key: "inactive_users",
              icon: <UserX size={22} className="text-[#037F44]" />,
            },
          ]);
        } else {
          setUsers([]);
          setStats([]);
        }
      } catch {
        setUsers([]);
        setStats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token, page, statusFilter, accountTypeFilter, activeTab]);

  // const handleSuspendUser = async (userId: string, currentState?: boolean) => {
  //   if (!token) return;

  //   const suspend = !currentState; // toggle state

  //   try {
  //     const response = await fetch(
  //       `${API_URL}/api/admin/users/${userId}/suspend`,
  //       {
  //         method: "PUT",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: JSON.stringify({ suspend }),
  //       }
  //     );

  //     const resText = await response.text();

  //     if (response.ok) {
  //       setUsers((prev) =>
  //         prev.map((user) =>
  //           user.id === userId ? { ...user, isSuspended: suspend } : user
  //         )
  //       );
  //       alert(`User has been ${suspend ? "suspended" : "unsuspended"}`);
  //     } else {
  //       console.error("Failed to suspend user:", resText);
  //     }
  //   } catch (error) {
  //     console.error("Error suspending user:", error);
  //   }
  // };
  const handleUserAction = async (
    userId: string,
    action: "suspend" | "ban",
    currentState?: boolean
  ) => {
    if (!token) return;

    try {
      let response: Response;

      if (action === "ban") {
        // console.log("Banning user with ID:", users.id);

        // DELETE user
        response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // SUSPEND or UNSUSPEND user
        const toggleState = !currentState;
        response = await fetch(`${API_URL}/api/admin/users/${userId}/suspend`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ suspend: toggleState }),
        });
      }

      const resText = await response.text();

      if (response.ok) {
        if (action === "ban") {
          // Remove banned user from local state
          setUsers((prev) => prev.filter((user) => user.id !== userId));
        }

        if (action === "suspend") {
          setUsers((prev) =>
            prev.map((user) =>
              user.id === userId
                ? { ...user, isSuspended: !currentState }
                : user
            )
          );
        }

        alert(
          `User has been ${
            action === "ban"
              ? "banned (deleted)"
              : currentState
              ? "unsuspended"
              : "suspended"
          }`
        );
      } else {
        console.error(`Failed to ${action} user:`, resText);
      }
    } catch (error) {
      console.error(`Error trying to ${action} user:`, error);
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
      alert(`Message sent to ${messageUserTarget.name}`);
      setMessageUserTarget(null);
      setMessageSubject("");
      setMessageBody("");
    } catch (err: unknown) {
      setMessageError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMessageSending(false);
    }
  };

  const handleAssignBadge = async (userId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/users/toggle-badge`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      console.log("Toggle badge response data:", data);

      console.log("Toggling badge for user ID:", userId, "Response:", data);

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? { ...user, hasBadge: !!data.user.badge } // force boolean
              : user
          )
        );

        // Log to verify which value is coming
        console.log("New badge state:", data.badge);

        // Force alert to be accurate
        alert(
          `Badge has been ${
            data.user.badge === true ? "assigned" : "removed"
          } successfully!`
        );
      } else {
        console.error("Failed to toggle badge:", data);
        alert("Failed to toggle badge.");
      }
    } catch (err) {
      console.error("Error toggling badge:", err);
      alert("An error occurred while toggling badge.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "superadmin", "supportagent", "verificationofficer"]}>
      <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl shadow p-2 w-fit mb-2">
          {canViewCustomers && (
            <button
              className={`px-6 py-2 rounded-lg text-base font-semibold transition ${
                activeTab === "customers"
                  ? "bg-[#037F44] text-white"
                  : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
              }`}
              onClick={() => setActiveTab("customers")}
            >
              All Customers
            </button>
          )}
          <button
            className={`px-6 py-2 rounded-lg text-base font-semibold transition ${
              activeTab === "verification"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("verification")}
          >
            Seller Verification
          </button>
        </div>

        {activeTab === "customers" && canViewCustomers && (
          <>
        {/* Stat Cards */}
        <div className="md:flex-row flex flex-col gap-4">
          {loading
            ? [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white w-[244px] h-[90px] rounded-lg shadow p-6 flex flex-col justify-center animate-pulse"
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
                  className="bg-white w-[244px] h-[90px] rounded-lg shadow p-6 flex flex-col justify-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-[#F7F8FB] rounded-full p-2 flex items-center justify-center">
                      {stat.icon}
                    </span>
                    <div>
                      <div className="text-sm text-[#BEBEBE] mb-1">
                        {stat.label}
                      </div>
                      <div className="text-2xl font-bold text-[#353535]">
                        {stat.value}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-[750px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 bg-white"
            />
          </div>
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowFilterPanel((v) => !v)}
              className="flex items-center gap-2 bg-white border border-[#037F44] text-[#037F44] px-4 py-2 rounded hover:bg-[#f0faf5] transition-colors"
            >
              <Filter size={18} />
              Filter
              {(statusFilter !== "all" || accountTypeFilter !== "all") && (
                <span className="w-2 h-2 rounded-full bg-[#037F44]" />
              )}
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-20 p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#505050] mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as typeof statusFilter);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:ring focus:border-[#037F44]"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#505050] mb-2">Account Type</label>
                  <select
                    value={accountTypeFilter}
                    onChange={(e) => {
                      setAccountTypeFilter(e.target.value as typeof accountTypeFilter);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:ring focus:border-[#037F44]"
                  >
                    <option value="all">All</option>
                    <option value="BUYER">Buyer</option>
                    <option value="STORE_OWNER">Store Owner</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>
                {(statusFilter !== "all" || accountTypeFilter !== "all") && (
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setAccountTypeFilter("all");
                      setPage(1);
                    }}
                    className="text-xs text-[#037F44] hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => { setShowOnboardModal(true); setOnboardError(""); setOnboardSuccess(""); }}
            className="flex items-center gap-2 bg-[#037F44] text-white px-4 py-2 rounded hover:bg-[#025e2e] transition-colors whitespace-nowrap"
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
                  <div className="w-14 h-14 rounded-full bg-[#e6f9f0] flex items-center justify-center mx-auto">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#037F44" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-[#037F44] font-medium">{onboardSuccess}</p>
                  <p className="text-sm text-[#848484]">The user will receive an email with a link to set up their password.</p>
                  <button
                    onClick={() => { setShowOnboardModal(false); setOnboardSuccess(""); }}
                    className="mt-2 bg-[#037F44] text-white px-6 py-2 rounded hover:bg-[#025e2e] transition-colors text-sm"
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
                        className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-[#037F44]"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#505050] mb-1">Last Name</label>
                      <input
                        type="text"
                        value={onboardForm.lastName}
                        onChange={(e) => setOnboardForm(f => ({ ...f, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-[#037F44]"
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
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-[#037F44]"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#505050] mb-1">Account Type</label>
                    <select
                      value={onboardForm.accountType}
                      onChange={(e) => setOnboardForm(f => ({ ...f, accountType: e.target.value }))}
                      className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-[#037F44] bg-white"
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
                      className={`flex-1 px-4 py-2 bg-[#037F44] text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${onboardLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-[#025e2e]"}`}
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

        {/* Users Table (Desktop Only) */}
        <div className="hidden md:block bg-white rounded-lg shadow p-6">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-[#CCDCD4] text-[#037F44] text-left">
                <th className="py-3 px-4 text-[#505050] text-sm font-normal">
                  NAME
                </th>
                <th className="py-3 px-4 text-[#505050] text-sm font-normal">
                  EMAIL
                </th>
                <th className="py-3 px-4 text-[#505050] text-sm font-normal">
                  PHONE NO
                </th>
                <th className="py-3 px-4 text-[#505050] text-sm font-normal">
                  CATEGORY
                </th>
                <th className="py-3 px-4 text-[#505050] text-sm font-normal">
                  AMOUNT SPENT
                </th>
                <th className="py-3 px-4 text-[#505050] text-sm font-normal">
                  DATE JOINED
                </th>
                <th className="py-3 px-4 text-[#505050] text-sm font-normal">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(
                  (u) =>
                    u.name.toLowerCase().includes(search.toLowerCase()) ||
                    u.email.toLowerCase().includes(search.toLowerCase())
                )
                .map((user, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-b-0 cursor-pointer hover:bg-[#F7F8FB] transition"
                    onClick={() => handleRowClick(user.id)}
                  >
                    <td className="py-3 text-[#434343] text-sm px-4">
                      {user.name}
                    </td>
                    <td className="py-3 text-[#434343] text-sm px-4">
                      {user.email}
                    </td>
                    <td className="py-3 text-[#434343] text-sm px-4">
                      {user.phone_number}
                    </td>
                    <td className="py-3 text-[#434343] text-sm px-4">
                      <AccountTypeBadge accountType={user.accountType} />
                    </td>
                    <td className="py-3 text-[#434343] text-sm px-4">
                      {user.amount_spent}
                    </td>
                    <td className="py-3 text-[#434343] text-sm px-4">
                      {user.date_joined
                        ? new Date(user.date_joined).toISOString().slice(0, 10)
                        : "N/A"}
                    </td>
                    <td className="py-3 text-[#434343] text-sm px-4">
                      <button
                        className="p-2 rounded-full hover:bg-[#F7F8FB] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownIdx(dropdownIdx === idx ? null : idx);
                        }}
                      >
                        <MoreVertical size={20} />
                      </button>
                      {dropdownIdx === idx && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-10">
                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44]"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/user/${user.id}`);
                            }}
                          >
                            View
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserAction(
                                user.id,
                                "suspend",
                                user.isSuspended
                              );
                              setDropdownIdx(null);
                            }}
                          >
                            {user.isSuspended ? "Unsuspend" : "Suspend"}
                          </button>

                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserId(user.id);
                              setShowBanModal(true);
                              setDropdownIdx(null);
                            }}
                          >
                            Ban
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignBadge(user.id);
                            }}
                          >
                            {user.hasBadge ? "Remove Badge" : "Assign Badge"}
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMessageUserTarget(user);
                              setMessageError("");
                              setDropdownIdx(null);
                            }}
                          >
                            Message
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <PageButton page={page} setPage={setPage} totalPages={totalPages} />
        </div>

        <ConfirmModal
          isOpen={showBanModal}
          onClose={() => setShowBanModal(false)}
          onConfirm={() => {
            if (selectedUserId) {
              handleUserAction(selectedUserId, "ban");
            }
          }}
          title="Ban User"
          message="Are you sure you want to permanently ban this user? This action cannot be undone."
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
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-[#037F44]"
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
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-[#037F44]"
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
                    className={`flex-1 px-4 py-2 bg-[#037F44] text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      messageSending ? "opacity-60 cursor-not-allowed" : "hover:bg-[#025e2e]"
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

        {/* Mobile Card View */}
        <div className="block md:hidden">
          <div className="flex flex-col gap-4">
            {users
              .filter(
                (u) =>
                  u.name.toLowerCase().includes(search.toLowerCase()) ||
                  u.email.toLowerCase().includes(search.toLowerCase())
              )
              .map((user, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow p-4 flex flex-col gap-2"
                  onClick={() => handleRowClick(user.id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#353535]">
                      {user.name}
                    </span>
                    <span className="text-xs text-[#BEBEBE]">
                      {user.date_joined}
                    </span>
                  </div>
                  <div className="text-sm text-[#505050]">{user.email}</div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#505050]">{user.phone_number}</span>
                    <span className="font-bold text-[#037F44]">
                      {user.amount_spent}
                    </span>
                  </div>
                  <div>
                    <AccountTypeBadge accountType={user.accountType} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="flex-1 bg-[#F7F8FB] text-[#037F44] py-1 rounded text-xs font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/user/${user.id}`);

                        // handle view
                      }}
                    >
                      View
                    </button>
                    <button
                      className="flex-1 bg-[#F7F8FB] text-[#037F44] py-1 rounded text-xs font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserAction(user.id, "suspend", user.isSuspended);
                      }}
                    >
                      {user.isSuspended ? "Unsuspend" : "Suspend"}
                    </button>

                    <button
                      className="flex-1 bg-[#F7F8FB] text-[#037F44] py-1 rounded text-xs font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserId(user.id);
                        setShowBanModal(true);
                      }}
                    >
                      Ban
                    </button>
                    <button
                      className="flex-1 bg-[#F7F8FB] text-[#037F44] py-1 rounded text-xs font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(
                          `User ${user.id} badge state:`,
                          user.hasBadge
                        );

                        handleAssignBadge(user.id);
                      }}
                    >
                      {user.hasBadge ? "Remove Badge" : "Assign Badge"}
                    </button>
                    <button
                      className="flex-1 bg-[#F7F8FB] text-[#037F44] py-1 rounded text-xs font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMessageUserTarget(user);
                        setMessageError("");
                      }}
                    >
                      Message
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <PageButton page={page} setPage={setPage} totalPages={totalPages} />
        </div>
          </>
        )}

        {activeTab === "verification" && <SellerVerificationTab />}
      </div>
    </ProtectedRoute>
  );

  // if (role !== "admin" && role !== "superadmin") {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <p className="text-red-500 text-lg font-semibold">
  //         Access Denied: Admins only
  //       </p>
  //     </div>
  //   );
  // }
}

export default function UserPage() {
  return (
    <Suspense fallback={null}>
      <UserPageInner />
    </Suspense>
  );
}
