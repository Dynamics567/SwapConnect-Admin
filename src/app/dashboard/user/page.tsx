"use client";
import React, { useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";

const stats = [
  {
    label: "Total Users",
    value: "1,200",
    icon: <Users size={22} className="text-[#037F44]" />,
  },
  {
    label: "Active Users",
    value: "950",
    icon: <UserCheck size={22} className="text-[#037F44]" />,
  },
  {
    label: "Non Active Users",
    value: "250",
    icon: <UserX size={22} className="text-[#037F44]" />,
  },
];

const users = [
  {
    _id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "08012345678",
    amountSpent: "$1,200",
    dateJoined: "2024-01-15",
  },
  {
    _id: "2",

    name: "Jane Smith",
    email: "jane@example.com",
    phone: "08098765432",
    amountSpent: "$950",
    dateJoined: "2024-02-10",
  },
];

export default function UserPage() {
  const [search, setSearch] = useState("");
  const [dropdownIdx, setDropdownIdx] = useState<number | null>(null);
  const router = useRouter();

  const handleRowClick = (userId: string) => {
    router.push(`/dashboard/user/${userId}`);
  };

  return (
    <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
      {/* Stat Cards */}
      <div className="flex gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white w-[331px] h-[90px] rounded-lg shadow p-6 flex flex-col justify-center"
          >
            <div className="flex items-center gap-3">
              <span className="bg-[#F7F8FB] rounded-full p-2 flex items-center justify-center">
                {stat.icon}
              </span>
              <div>
                <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
                <div className="text-xl font-bold text-[#037F44]">
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3">
        <div className="relative w-[918px]">
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
        <button className="flex items-center gap-2 bg-[#037F44] text-white px-4 py-2 rounded hover:bg-[#025e2e] transition-colors">
          <Filter size={18} />
          Filter
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow p-6">
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
                  onClick={() => handleRowClick(user._id)} // Navigate to user profile page
                >
                  <td className="py-3 text-[#434343] text-sm px-4">
                    {user.name}
                  </td>
                  <td className="py-3 text-[#434343] text-sm px-4">
                    {user.email}
                  </td>
                  <td className="py-3 text-[#434343] text-sm px-4">
                    {user.phone}
                  </td>
                  <td className="py-3 text-[#434343] text-sm px-4">
                    {user.amountSpent}
                  </td>
                  <td className="py-3 text-[#434343] text-sm px-4">
                    {user.dateJoined}
                  </td>
                  <td className="py-3 text-[#434343] text-sm px-4">
                    <button
                      className="p-2 rounded-full hover:bg-[#F7F8FB] transition-colors"
                      onClick={() =>
                        setDropdownIdx(dropdownIdx === idx ? null : idx)
                      }
                    >
                      <MoreVertical size={20} />
                    </button>
                    {dropdownIdx === idx && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-10">
                        <button className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44]">
                          View
                        </button>
                        <button className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44]">
                          Suspend
                        </button>
                        <button className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44]">
                          Ban
                        </button>
                        <button className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44]">
                          Assign Badge
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
