"use client";
import React, { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
import { JSX } from "react";
import PageButton from "@/components/PageButton";

// const PAGE_SIZE = 10;
interface Stats {
  label: string;
  value: string | number;
  key: string;
  icon: JSX.Element;
}
// const stats = [
//   {
//     label: "Total Users",
//     value: "1,200",
//     icon: <Users size={22} className="text-[#037F44]" />,
//   },
//   {
//     label: "Active Users",
//     value: "950",
//     icon: <UserCheck size={22} className="text-[#037F44]" />,
//   },
//   {
//     label: "Non Active Users",
//     value: "250",
//     icon: <UserX size={22} className="text-[#037F44]" />,
//   },
// ];
interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  amount_spent: string;
  date_joined: string;
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
  badge?: boolean;
}

export default function UserPage() {
  const [search, setSearch] = useState("");
  const [dropdownIdx, setDropdownIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  // const [category, setCategory] = useState();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const router = useRouter();
  const token = useAuthToken();
  const [totalPages, setTotalPages] = useState(0);

  const handleRowClick = (userId: string) => {
    router.push(`/dashboard/user/${userId}`);
  };
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/users/all?role=user&page=${page}&limit=10`,
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
                hasBadge: u.badge || false,
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
  }, [page]);

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

  const handleAssignBadge = async (userId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/users/toggle-badge`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();
      console.log("Toggling badge for user ID:", userId);

      if (response.ok) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, hasBadge: data.badge } : user
          )
        );

        alert(
          `Badge has been ${data.badge ? "assigned" : "removed"} successfully!`
        );
      } else {
        console.error("Failed to toggle badge:", data);
      }
    } catch (err) {
      console.error("Error toggling badge:", err);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
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
        <div className="relative w-full md:w-[918px]">
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
        <button className="hidden md:flex items-center gap-2 bg-[#037F44] text-white px-4 py-2 rounded hover:bg-[#025e2e] transition-colors">
          <Filter size={18} />
          Filter
        </button>
      </div>

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
                            handleUserAction(user.id, "ban");
                            // console.log("User object at ban click:", user);

                            setDropdownIdx(null); // only on desktop
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
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <PageButton page={page} setPage={setPage} totalPages={totalPages} />
      </div>

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
                      // console.log("User object at ban click:", user);

                      handleUserAction(user.id, "ban");
                      // setDropdownIdx(null); // only on desktop
                    }}
                  >
                    Ban
                  </button>
                  <button
                    className="flex-1 bg-[#F7F8FB] text-[#037F44] py-1 rounded text-xs font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignBadge(user.id);
                    }}
                  >
                    {user.hasBadge ? "Remove Badge" : "Assign Badge"}
                  </button>
                </div>
              </div>
            ))}
        </div>
        <PageButton page={page} setPage={setPage} totalPages={totalPages} />
      </div>
    </div>
  );
}
