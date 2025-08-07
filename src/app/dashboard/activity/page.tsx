"use client";
import React, { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
// import clsx from "clsx";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import PageButton from "@/components/PageButton";
// import { useContext } from "react";
// import { useAuthContext } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

interface ActivityLog {
  Admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  updatedAt: string;
  action: string;
  status: string;
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = useAuthToken();
  // const { role, loadings } = useAuthContext();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(perPage),
        });

        const response = await fetch(`${API_URL}/api/activity-logs?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        // console.log("API Response:", data);

        const logsData = data?.data?.logs ?? [];
        const pagination = data?.data?.pagination ?? {};

        setLogs(logsData);

        const actualTotal =
          logsData.length < perPage && page > 1
            ? (page - 1) * perPage + logsData.length
            : pagination.totalItems ?? logsData.length;

        const computedTotalPages = Math.ceil(actualTotal / perPage);
        setTotalPages(computedTotalPages);
      } catch (error) {
        console.error("Failed to fetch activity logs:", error);
        setLogs([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [token, page]);

  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <div>
        <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
          <h2 className="text-xl font-semibold text-black mb-4">
            Activity log
          </h2>

          <div className="flex items-center gap-2 justify-between mb-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search name of product name, category..."
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-white shadow-sm focus:outline-none focus:ring"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button className="flex text-black items-center gap-1 px-3 py-2 rounded-md text-sm bg-white hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-md">
              <thead>
                <tr className="bg-[#CCDCD4] text-left text-[#505050] text-[14px]">
                  <th className="px-4 py-3">USER</th>
                  <th className="px-4 py-3">ROLE</th>
                  <th className="px-4 py-3">LAST LOGIN</th>
                  <th className="px-4 py-3">ACTION</th>
                  {/* <th className="px-4 py-3">STATUS</th> */}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No activity logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => {
                    const date = new Date(log.updatedAt);
                    const formattedDate = date.toISOString().split("T")[0];
                    const formattedTime = date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    });

                    return (
                      <tr
                        key={index}
                        className="border-t text-[14px] text-[#434343]"
                      >
                        <td className="px-4 py-3">{`${log.Admin.firstName} ${log.Admin.lastName}`}</td>
                        <td className="px-4 py-3">{log.Admin.role}</td>
                        <td className="px-4 py-3">
                          {formattedDate}{" "}
                          <span className="text-gray-400 ml-1">
                            {formattedTime}
                          </span>
                        </td>
                        <td className="px-4 py-3">{log.action}</td>
                        {/* <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "text-sm font-medium",
                          log.status === "Online"
                            ? "text-green-500"
                            : "text-orange-500"
                        )}
                      >
                        {log.status}
                      </span>
                    </td> */}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <PageButton page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        </div>{" "}
      </div>
    </ProtectedRoute>
  );
}
