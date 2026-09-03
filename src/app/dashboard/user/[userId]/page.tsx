"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useAuthContext } from "@/context/AuthContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// Mock users data (replace with real data fetching in production)

const tabs = [
  { key: "personal", label: "Personal Details" },
  { key: "orders", label: "Order History" },
  { key: "payments", label: "Payment History" },
];

// interface OrderProduct {
//   id: string;
//   name: string;
//   price: string;
// }

interface ProfileCompletion {
  percentage: number;
  missingFields: string[];
  requiredMissing: string[];
  optionalMissing: string[];
}

interface UserLocation {
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  source: "AUTO" | "MANUAL" | null;
  updatedAt: string | null;
}

const MISSING_FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  phone: "Phone",
  country: "Country",
  state: "State",
  city: "City",
  address: "Address",
  avatar: "Profile photo",
};

function LocationSourcePill({ source }: { source: "AUTO" | "MANUAL" | null | undefined }) {
  const label = source === "AUTO" ? "Auto-detected" : source === "MANUAL" ? "Manually entered" : "Not set";
  const styles =
    source === "AUTO"
      ? "bg-[#e6f9f0] text-[#037F44]"
      : source === "MANUAL"
      ? "bg-[#F7F8FB] text-[#505050]"
      : "bg-[#f3f4f6] text-[#9ca3af]";
  const dot = source === "AUTO" ? "bg-[#037F44]" : source === "MANUAL" ? "bg-[#9ca3af]" : "bg-[#c4c4c4]";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

interface User {
  id: string;
  avatar: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  phone: string;
  role: string;
  productCount: number;
  profileCompletion?: ProfileCompletion;
  location?: UserLocation;
  profileUpdatedAt?: string | null;
  orderHistory: [
    {
      id: string;
      date: string;
      status: string;

      OrderProducts: [
        {
          id: string;
          name: string;
          price: string;
          description: string;
          Category: {
            id: string;
            name: string;
          };
        }
      ];
    }
  ];
  paymentHistory: [
    {
      id: string;
      name: string;
      purpose: string;
      amount: string;
      status: string;
    }
  ];
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [users, setUsers] = useState<User | null>(null);
  const token = useAuthToken();
  const { role } = useAuthContext();
  const canManageAccounts = role === "admin" || role === "superadmin";
  const [loading, setLoading] = useState(false);
  const userId = params?.userId;

  const [showDeleteUser, setShowDeleteUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null);

  const handleConfirmDeleteUser = async () => {
    setDeletingUser(true);
    setDeleteUserError(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setDeleteUserError(data.message || "Failed to delete user.");
        return;
      }
      router.push("/dashboard/user");
    } catch {
      setDeleteUserError("Something went wrong. Please try again.");
    } finally {
      setDeletingUser(false);
    }
  };
  const [activeTab, setActiveTab] = useState<
    "personal" | "orders" | "payments"
  >("personal");

  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);

  const handleConfirmChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setChangeEmailError("Enter a valid email address.");
      return;
    }
    setChangingEmail(true);
    setChangeEmailError(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setChangeEmailError(data.message || "Failed to change email.");
        return;
      }
      setUsers((prev) => (prev ? { ...prev, email: newEmail.trim() } : prev));
      setShowChangeEmail(false);
      setNewEmail("");
    } catch {
      setChangeEmailError("Something went wrong. Please try again.");
    } finally {
      setChangingEmail(false);
    }
  };

  // Find user by _id
  // const user = users.find((u) => u._id === userId);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchUserDetails = async () => {
      setLoading(true); // Start loading

      try {
        const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        // Previously accepted any parsed JSON body, including an error
        // response like { message: "..." } -- which has none of the real
        // user fields, so every input on this page silently rendered blank
        // instead of showing the "User not found" state that already
        // existed below but could never actually be reached.
        if (response.ok && data && data.id) {
          setUsers(data);
        } else {
          setUsers(null);
        }
      } catch {
        setUsers(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [userId, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB]">
        <p className="text-lg text-gray-600">Loading user details...</p>
      </div>
    );
  }

  if (!users) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB]">
        <p className="text-xl text-red-600">User not found.</p>
        <Link
          href="/dashboard/user"
          className="mt-4 text-[#037F44] flex items-center gap-2 hover:underline"
        >
          <ArrowLeft size={18} /> Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full min-w-0">
      <div className="flex items-center gap-2  text-sm font-medium text-[#037F44]">
        <Link href="/dashboard/user" className="hover:underline text-[#505050]">
          User Mgt
        </Link>
        <span className=" text-[#505050]">{">"}</span>
        <span className="text-[#505050]">User Details</span>
      </div>
      {/* Tabs */}

      <div className="flex gap-8 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`text-base font-medium pb-2 border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[#037F44] text-[#037F44]"
                : "border-transparent text-gray-500 hover:text-[#037F44]"
            }`}
            onClick={() =>
              setActiveTab(tab.key as "personal" | "orders" | "payments")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}

      <div className="bg-white rounded-lg shadow p-8 w-full">
        {activeTab === "personal" && (
          <div>
            <div className="flex items-start justify-between mb-6">
              {/* User Image */}
              <div className="flex items-center gap-4">
                {users.avatar ? (
                  <Image
                    src={users.avatar}
                    alt={users.firstName}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle size={96} className="text-gray-300" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-full text-xs font-semibold bg-[#f0faf5] text-[#037F44]">
                  {users.productCount ?? 0} Product{users.productCount === 1 ? "" : "s"} Uploaded
                </div>
                {role === "superadmin" && (
                  <button
                    onClick={() => {
                      setNewEmail(users.email ?? "");
                      setChangeEmailError(null);
                      setShowChangeEmail(true);
                    }}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-[#f0faf5] text-[#037F44] hover:bg-[#dcf3e7] transition-colors"
                  >
                    Change Email
                  </button>
                )}
                {canManageAccounts && (
                  <button
                    onClick={() => {
                      setDeleteUserError(null);
                      setShowDeleteUser(true);
                    }}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                  >
                    Delete User
                  </button>
                )}
                {/* Status Button */}
                <button
                  className={`px-4 py-2 rounded-full text-xs font-semibold ${
                    users.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                  style={{ minWidth: 90 }}
                  disabled
                >
                  {users.status}
                </button>
              </div>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="w-1/2">
                <input
                  id="firstname"
                  type="text"
                  value={users.firstName ?? ""}
                  readOnly
                  placeholder="First Name"
                  className="w-full px-3 py-2 border rounded bg-gray-100 text-base text-gray-700 placeholder:text-gray-500 placeholder:text-xs placeholder:font-medium"
                />
              </div>
              <div className="w-1/2">
                <input
                  id="lastname"
                  type="text"
                  value={users.lastName ?? ""}
                  readOnly
                  placeholder="Last Name"
                  className="w-full px-3 py-2 border rounded bg-gray-100 text-base text-gray-700 placeholder:text-gray-500 placeholder:text-xs placeholder:font-medium"
                />
              </div>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="w-1/2">
                <input
                  id="email"
                  type="email"
                  value={users.email ?? ""}
                  readOnly
                  placeholder="Email"
                  className="w-full px-3 py-2 border rounded bg-gray-100 text-base text-gray-700 placeholder:text-gray-500 placeholder:text-xs placeholder:font-medium"
                />
              </div>
              <div className="w-1/2">
                <input
                  id="phone"
                  type="text"
                  value={users.phone ?? ""}
                  readOnly
                  placeholder="Phone Number"
                  className="w-full px-3 py-2 border rounded bg-gray-100 text-base text-gray-700 placeholder:text-gray-500 placeholder:text-xs placeholder:font-medium"
                />
              </div>
            </div>

            {/* Profile & Location */}
            <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
              <h3 className="text-sm font-semibold text-[#353535] mb-3">Profile &amp; Location</h3>

              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="w-40">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-medium text-[#353535]">
                      {users.profileCompletion?.percentage ?? 0}% Complete
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#f3f4f6] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (users.profileCompletion?.percentage ?? 0) >= 100 ? "bg-[#037F44]" : "bg-[#a9791f]"
                      }`}
                      style={{ width: `${users.profileCompletion?.percentage ?? 0}%` }}
                    />
                  </div>
                </div>
                <LocationSourcePill source={users.location?.source} />
              </div>

              {(users.profileCompletion?.missingFields?.length ?? 0) > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="text-xs text-[#848484]">Missing:</span>
                  {users.profileCompletion!.missingFields.map((f) => (
                    <span key={f} className="px-2 py-0.5 rounded-full bg-[#fef9ec] text-[#a9791f] text-xs">
                      {MISSING_FIELD_LABELS[f] || f}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-[#505050]">
                {[users.location?.city, users.location?.state, users.location?.country].filter(Boolean).join(", ") || "No location set"}
                {users.location?.address ? ` — ${users.location.address}` : ""}
              </p>
              <p className="text-xs text-[#848484] mt-1">
                Last profile update:{" "}
                {users.profileUpdatedAt ? new Date(users.profileUpdatedAt).toLocaleString() : "Never"}
              </p>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            {users.orderHistory && users.orderHistory.length > 0 ? (
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-[#CCDCD4] text-[#505050] text-left">
                    <th className="py-2 px-4 font-normal text-sm">ORDER ID</th>
                    <th className="py-2 px-4 font-normal text-sm">
                      PRODUCT NAME
                    </th>
                    <th className="py-2 px-4 font-normal text-sm">CATEGORY</th>
                    <th className="py-2 px-4 font-normal text-sm">
                      DESCRIPTION
                    </th>
                    <th className="py-2 px-4 font-normal text-sm">PRICE</th>
                    <th className="py-2 px-4 font-normal text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.orderHistory.map((order) =>
                    order.OrderProducts.map((product) => (
                      <tr
                        key={`${order.id}-${product.id}`}
                        className="text-sm text-[#434343]"
                      >
                        <td className="py-2 px-4">{order.id}</td>
                        <td className="py-2 px-4">{product.name}</td>
                        <td className="py-2 px-4">
                          {product.Category?.name || "-"}
                        </td>
                        <td className="py-2 px-4">
                          {product.description || "-"}
                        </td>
                        <td className="py-2 px-4">{product.price}</td>
                        <td className="py-2 px-4">{order.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <div className="text-gray-500">No order history found.</div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div>
            {users.paymentHistory && users.paymentHistory.length > 0 ? (
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-[#CCDCD4] text-[#505050] text-sm text-left">
                    <th className="py-2 px-4 font-normal">TRANSACTION ID</th>
                    <th className="py-2 px-4 font-normal">PRODUCT NAME</th>
                    <th className="py-2 px-4 font-normal">CATEGORY</th>
                    <th className="py-2 px-4 font-normal">PRICE</th>
                    <th className="py-2 px-4 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.paymentHistory.map((payment) => (
                    <tr key={payment.id} className="text-[#434343] text-sm">
                      <td className="py-2 px-4">{payment.id}</td>
                      <td className="py-2 px-4">{payment.name}</td>
                      <td className="py-2 px-4">{payment.purpose}</td>
                      <td className="py-2 px-4">{payment.amount}</td>
                      <td className="py-2 px-4">{payment.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-gray-500">No payment history found.</div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showChangeEmail}
        title="Change user's email"
        message={
          <div className="flex flex-col gap-2">
            <p>
              This changes the email immediately, with no verification code sent
              — only use this when the user has lost access to their old email
              and asked for help.
            </p>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              className="w-full px-3 py-2 border rounded text-base text-gray-800"
              autoFocus
            />
            {changeEmailError && (
              <p className="text-red-600 text-xs">{changeEmailError}</p>
            )}
          </div>
        }
        confirmLabel="Change Email"
        loading={changingEmail}
        onConfirm={handleConfirmChangeEmail}
        onClose={() => {
          setShowChangeEmail(false);
          setChangeEmailError(null);
        }}
      />

      <ConfirmDialog
        open={showDeleteUser}
        title="Delete this user account?"
        message={
          <div className="flex flex-col gap-2">
            <p>
              This permanently deletes {users.firstName} {users.lastName}&apos;s account,
              along with all of their products, orders, and reviews. This can&apos;t be undone.
            </p>
            {deleteUserError && (
              <p className="text-red-600 text-xs">{deleteUserError}</p>
            )}
          </div>
        }
        variant="danger"
        confirmLabel="Delete"
        loading={deletingUser}
        onConfirm={handleConfirmDeleteUser}
        onClose={() => {
          setShowDeleteUser(false);
          setDeleteUserError(null);
        }}
      />
    </div>
  );
}
