"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, UserCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";

// Mock users data (replace with real data fetching in production)

const tabs = [
  { key: "personal", label: "Personal Details" },
  { key: "orders", label: "Order History" },
  { key: "payments", label: "Payment History" },
];

interface User {
  id: string;
  avatar: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  status: string;
  phone: string;
  role: string;
  orderHistory: [
    {
      id: string;
      product: string;
      category: string;
      description: string;
      date: string;
      amount: string;
      status: string;
    }
  ];
  paymentHistory: [
    {
      id: string;
      name: string;
      category: string;
      price: string;
      status: string;
    }
  ];
}

export default function UserDetailsPage() {
  const params = useParams();
  const [users, setUsers] = useState<User | null>(null);
  const token = useAuthToken();
  const [loading, setLoading] = useState(false);
  //   const router = useRouter();
  const { userId } = params;
  const [activeTab, setActiveTab] = useState<
    "personal" | "orders" | "payments"
  >("personal");

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
        console.log("User Details:", data);
        if (data) {
          setUsers(data); // Assuming the API returns a single user object
        } else {
          setUsers([]);
        }
      } catch {
        setUsers([]);
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
    <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
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
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle size={96} className="text-gray-300" />
                )}
              </div>
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
            <div className="mb-4">
              <textarea
                id="bio"
                value={users.bio ?? ""}
                readOnly
                placeholder="Bio"
                rows={3}
                className="w-full px-3 py-2 border rounded bg-gray-100 text-base text-gray-700 resize-none placeholder:text-gray-500 placeholder:text-xs placeholder:font-medium"
              />
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
                  {users.orderHistory.map((order) => (
                    <tr key={order.id} className="text-sm text-[#434343] ">
                      <td className="py-2 px-4">{order.id}</td>
                      <td className="py-2 px-4">{order.product}</td>
                      <td className="py-2 px-4">{order.category || "-"}</td>
                      <td className="py-2 px-4">{order.description || "-"}</td>
                      <td className="py-2 px-4">{order.amount}</td>
                      <td className="py-2 px-4">{order.status}</td>
                    </tr>
                  ))}
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
                      <td className="py-2 px-4">{payment.category}</td>
                      <td className="py-2 px-4">{payment.price}</td>
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
    </div>
  );
}
