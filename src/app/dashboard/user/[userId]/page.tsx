"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, UserCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Mock users data (replace with real data fetching in production)
const users = [
  {
    _id: "1",
    id: "1",
    firstname: "John",
    lastname: "Doe",
    name: "John Doe",
    email: "john@example.com",
    phone: "08012345678",
    amountSpent: "$1,200",
    dateJoined: "2024-01-15",
    status: "Active",
    badge: "Gold",
    bio: "A passionate swapper and long-time user.",
    image: "",
    orders: [
      {
        id: "ORD-001",
        product: "iPhone 14",
        category: "Electronics",
        description: "Latest Apple smartphone",
        date: "2024-03-01",
        amount: "$800",
        status: "Completed",
      },
      {
        id: "ORD-002",
        product: "Samsung TV",
        category: "Electronics",
        description: "50-inch 4K UHD Smart TV",
        date: "2024-04-10",
        amount: "$400",
        status: "Pending",
      },
    ],
    payments: [
      {
        id: "PAY-001",
        name: "iPhone 14",
        category: "Electronics",
        price: "$800",
        status: "Success",
      },
      {
        id: "PAY-002",
        name: "Samsung TV",
        category: "Electronics",
        price: "$400",
        status: "Pending",
      },
    ],
  },
  {
    _id: "2",
    id: "2",
    firstname: "Jane",
    lastname: "Smith",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "08098765432",
    amountSpent: "$950",
    dateJoined: "2024-02-10",
    status: "Non Active",
    badge: "Silver",
    bio: "Loves electronics and home appliances.",
    image: "",
    orders: [
      {
        id: "ORD-003",
        product: "MacBook Pro",
        category: "Computers",
        description: "Apple laptop with M1 chip",
        date: "2024-02-15",
        amount: "$950",
        status: "Completed",
      },
    ],
    payments: [
      {
        id: "PAY-003",
        name: "MacBook Pro",
        category: "Computers",
        price: "$950",
        status: "Success",
      },
    ],
  },
];

const tabs = [
  { key: "personal", label: "Personal Details" },
  { key: "orders", label: "Order History" },
  { key: "payments", label: "Payment History" },
];

export default function UserDetailsPage() {
  const params = useParams();
  //   const router = useRouter();
  const { userId } = params;
  const [activeTab, setActiveTab] = useState<
    "personal" | "orders" | "payments"
  >("personal");

  // Find user by _id
  const user = users.find((u) => u._id === userId);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
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
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle size={96} className="text-gray-300" />
                )}
              </div>
              {/* Status Button */}
              <button
                className={`px-4 py-2 rounded-full text-xs font-semibold ${
                  user.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
                style={{ minWidth: 90 }}
                disabled
              >
                {user.status}
              </button>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="w-1/2">
                <input
                  id="firstname"
                  type="text"
                  value={user.firstname}
                  readOnly
                  placeholder="First Name"
                  className="w-full px-3 py-2 border rounded bg-gray-100 text-base text-gray-700 placeholder:text-gray-500 placeholder:text-xs placeholder:font-medium"
                />
              </div>
              <div className="w-1/2">
                <input
                  id="lastname"
                  type="text"
                  value={user.lastname}
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
                  value={user.email}
                  readOnly
                  placeholder="Email"
                  className="w-full px-3 py-2 border rounded bg-gray-100 text-base text-gray-700 placeholder:text-gray-500 placeholder:text-xs placeholder:font-medium"
                />
              </div>
              <div className="w-1/2">
                <input
                  id="phone"
                  type="text"
                  value={user.phone}
                  readOnly
                  placeholder="Phone Number"
                  className="w-full px-3 py-2 border rounded bg-gray-100 text-base text-gray-700 placeholder:text-gray-500 placeholder:text-xs placeholder:font-medium"
                />
              </div>
            </div>
            <div className="mb-4">
              <textarea
                id="bio"
                value={user.bio}
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
            {user.orders && user.orders.length > 0 ? (
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
                  {user.orders.map((order) => (
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
            {user.payments && user.payments.length > 0 ? (
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
                  {user.payments.map((payment) => (
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
