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
  id: string;
  name: string;
  email: string;
  role: string;
}
const rolesData = [
  {
    role: "Super Admin",
    permission: "All Access",
  },
  {
    role: "Admin",
    permission: "Manage users, View reports",
  },
  {
    role: "Customer Support",
    permission: "View tickets, Respond to users",
  },
  {
    role: "Editor",
    permission: "Edit content, Manage posts",
  },
  {
    role: "Viewer",
    permission: "View only",
  },
];

export default function TeamContent() {
  const [activeTab, setActiveTab] = useState<"teams" | "roles">("teams");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [team, setTeam] = useState<Teams[]>([]);
  const [actionMenuIdx, setActionMenuIdx] = useState<number | null>(null);
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);
  const [successDeactivate, setSuccessDeactivate] = useState(false);
  const router = useRouter();
  const token = useAuthToken();

  const filteredTeams = team.filter(
    (team) =>
      team.name.toLowerCase().includes(search.toLowerCase()) ||
      team.email.toLowerCase().includes(search.toLowerCase()) ||
      team.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeactivate = () => {
    setConfirmIdx(null);
    setActionMenuIdx(null);
    setSuccessDeactivate(true);
    setTimeout(() => setSuccessDeactivate(false), 2000);
    // Here you would also call your API to deactivate the user
  };
  useEffect(() => {
    // if (!token) {
    //   setLoading(false);
    //   return;
    // }
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/users/all?role=admin&page=${page}&limit=10`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        // console.log("API Response", data);
        if (data) {
          setTeam(data?.users);
          setPage(data?.pagination.currentPage || 1);
          setTotalPages(data?.pagination.totalPages || 1);
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
  }, [page]);
  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <div className="w-full flex flex-col gap-6 relative">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#037F44]">Teams Section</h2>
          {activeTab === "teams" ? (
            <button
              className="flex items-center gap-2 bg-[#037F44] text-white px-4 py-2 rounded-lg hover:bg-[#025e2e] transition"
              onClick={() => router.push("/dashboard/team/add")}
            >
              <Plus size={18} />
              Add new team member{" "}
            </button>
          ) : (
            <button
              className="flex items-center gap-2 bg-[#037F44] text-white px-4 py-2 rounded-lg hover:bg-[#025e2e] transition"
              onClick={() => router.push("/dashboard/team/addroles")}
            >
              <Plus size={18} />
              Create new role &amp; permission
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
              <p>Loading orders...</p>
            ) : team.length === 0 ? (
              <div>
                <p className="text-center text-[#848484] mt-6">
                  No orders found
                </p>
              </div>
            ) : (
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-[#CCDCD4] text-[#505050] text-left">
                    <th className="py-2 px-4 font-normal text-sm">Name</th>
                    <th className="py-2 px-4 font-normal text-sm">Email</th>
                    <th className="py-2 px-4 font-normal text-sm">Role</th>
                    <th className="py-2 px-4 font-normal text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team, idx) => (
                    <tr key={idx} className="text-[#434343] text-sm relative">
                      <td className="py-2 px-4">{team.name}</td>
                      <td className="py-2 px-4">{team.email}</td>
                      <td className="py-2 px-4">{team.role}</td>
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
                          <div className="absolute z-10 right-6 mt-2 w-36 bg-white border rounded shadow-lg">
                            <button
                              className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44] text-sm"
                              onClick={() => {
                                setActionMenuIdx(null);
                                router.push(`/dashboard/team/edit/${team.id}`);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-red-600 text-sm"
                              onClick={() => {
                                setActionMenuIdx(null);
                                setConfirmIdx(idx);
                              }}
                            >
                              Deactivate
                            </button>
                          </div>
                        )}
                        {/* Confirm Deactivate Popup */}
                        {confirmIdx === idx && (
                          <div className="fixed inset-0 flex items-center justify-center  bg-opacity-30 z-50">
                            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                              <p className="text-lg font-semibold mb-4 text-[#037F44]">
                                Deactivate Member
                              </p>
                              <p className="mb-6 text-gray-700">
                                Are you sure you want to deactivate{" "}
                                <span className="font-semibold">
                                  {team.name}
                                </span>
                                ?
                              </p>
                              <div className="flex gap-4 justify-center">
                                <button
                                  className="px-6 py-2 rounded bg-gray-200 text-gray-700"
                                  onClick={() => setConfirmIdx(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="px-6 py-2 rounded bg-red-600 text-white"
                                  onClick={() => handleDeactivate}
                                >
                                  Yes, Deactivate
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
                        colSpan={4}
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
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-[#CCDCD4] text-[#505050] text-left">
                  <th className="py-2 px-4 font-normal text-sm">Role</th>
                  <th className="py-2 px-4 font-normal text-sm">Permission</th>
                  <th className="py-2 px-4 font-normal text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {rolesData.map((role, idx) => (
                  <tr key={idx} className="text-[#434343] text-sm ">
                    <td className="py-2 px-4">{role.role}</td>
                    <td className="py-2 px-4">{role.permission}</td>
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
                        <div className="absolute z-10 right-6 mt-2 w-36 bg-white border rounded shadow-lg">
                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44] text-sm"
                            onClick={() => {
                              setActionMenuIdx(null);
                              router.push(
                                `/dashboard/team/editrole/${encodeURIComponent(
                                  role.role
                                )}`
                              );
                            }}
                          >
                            Edit Role
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-red-600 text-sm"
                            onClick={() => {
                              setActionMenuIdx(null);
                              setConfirmIdx(idx);
                            }}
                          >
                            Deactivate
                          </button>
                        </div>
                      )}
                      {/* Confirm Deactivate Popup */}
                      {confirmIdx === idx && (
                        <div className="fixed inset-0 flex items-center justify-center  bg-opacity-30 z-50">
                          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                            <p className="text-lg font-semibold mb-4 text-[#037F44]">
                              Deactivate Member
                            </p>
                            <p className="mb-6 text-gray-700">
                              Are you sure you want to deactivate this role?{" "}
                            </p>
                            <div className="flex gap-4 justify-center">
                              <button
                                className="px-6 py-2 rounded bg-gray-200 text-gray-700"
                                onClick={() => setConfirmIdx(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-6 py-2 rounded bg-red-600 text-white"
                                onClick={() => handleDeactivate}
                              >
                                Proceed
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PageButton page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        )}
        {/* Success Popup */}
        {successDeactivate && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <p className="text-lg text-[#037F44] font-semibold mb-2">
                Success!
              </p>
              <p className="text-gray-700">
                Role has been deactivated successfully.{" "}
              </p>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
