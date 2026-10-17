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

        // /api/activity-logs (no /admin prefix) was never a registered
        // route -- this 404'd every time and the page always showed "No
        // activity logs found."
        const response = await fetch(`${API_URL}/api/admin/activity-logs?${params}`, {
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
        <div className="flex flex-col gap-8 w-full min-w-0">
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

          {logs.length === 0 && !loading ? (
            <div className="bg-white border rounded-md px-4 py-6 text-center text-gray-500">
              No activity logs found.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full bg-white border rounded-md">
                  <thead>
                    <tr className="bg-brand-emerald-light text-left text-[#505050] text-[14px]">
                      <th className="px-4 py-3">USER</th>
                      <th className="px-4 py-3">ROLE</th>
                      <th className="px-4 py-3">LAST LOGIN</th>
                      <th className="px-4 py-3">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => {
                      const date = new Date(log.updatedAt);
                      const formattedDate = date.toISOString().split("T")[0];
                      const formattedTime = date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });

                      return (
                        <tr key={index} className="border-t text-[14px] text-[#434343]">
                          <td className="px-4 py-3">{`${log.Admin.firstName} ${log.Admin.lastName}`}</td>
                          <td className="px-4 py-3">{log.Admin.role}</td>
                          <td className="px-4 py-3">
                            {formattedDate} <span className="text-gray-400 ml-1">{formattedTime}</span>
                          </td>
                          <td className="px-4 py-3">{log.action}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {logs.map((log, index) => {
                  const date = new Date(log.updatedAt);
                  const formattedDate = date.toISOString().split("T")[0];
                  const formattedTime = date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });

                  return (
                    <div key={index} className="bg-white border rounded-md p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-[#353535] break-words">
                          {`${log.Admin.firstName} ${log.Admin.lastName}`}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                          {formattedDate} {formattedTime}
                        </span>
                      </div>
                      <span className="inline-block w-fit px-2.5 py-1 rounded-full text-xs font-medium bg-brand-emerald-light text-brand-emerald">
                        {log.Admin.role}
                      </span>
                      <p className="text-sm text-[#434343]">{log.action}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <PageButton page={page} setPage={setPage} totalPages={totalPages} />
        </div>{" "}
      </div>
    </ProtectedRoute>
  );
}
