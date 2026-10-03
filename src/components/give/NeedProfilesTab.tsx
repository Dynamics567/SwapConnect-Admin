"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";

type NeedStatus = "OPEN" | "MATCHED" | "FULFILLED" | "CLOSED" | "WITHDRAWN";

const LIFE_CATEGORY_LABELS: Record<string, string> = {
  STUDENT: "Student",
  WORKING_PROFESSIONAL: "Working Professional",
  BUSINESS_OWNER: "Business Owner",
  ENTREPRENEUR: "Entrepreneur",
  FREELANCER: "Freelancer",
  JOB_SEEKER: "Job Seeker",
  SKILLED_WORKER: "Skilled Worker",
  LEARNING_A_SKILL: "Learning a Skill",
  APPRENTICE: "Apprentice",
  TEACHER_EDUCATOR: "Teacher / Educator",
  RESEARCHER: "Researcher",
  CONTENT_CREATOR: "Content Creator",
  OTHER: "Other",
};

interface NeedProfile {
  id: number;
  reason: string;
  location: string;
  ageBand: string;
  lifeCategories: string[];
  currentActivity: string | null;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  deliveryAddress: string | null;
  status: NeedStatus;
  adminNotes: string | null;
  createdAt: string;
  User: { id: number; firstName: string; lastName: string; email: string; phone: string | null } | null;
  Category: { id: number; name: string } | null;
}

const STATUS_COLORS: Record<NeedStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  MATCHED: "bg-purple-100 text-purple-800",
  FULFILLED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-200 text-gray-700",
  WITHDRAWN: "bg-gray-200 text-gray-700",
};

const URGENCY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};

export default function NeedProfilesTab() {
  const token = useAuthToken();
  const [needs, setNeeds] = useState<NeedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<NeedStatus | "">("");
  const [selected, setSelected] = useState<NeedProfile | null>(null);

  const fetchNeeds = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    try {
      const res = await fetch(`${API_URL}/api/admin/give/needs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNeeds(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchNeeds();
  }, [fetchNeeds]);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Need Profiles</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as NeedStatus | "")}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="MATCHED">Matched</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="CLOSED">Closed</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : needs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No need profiles found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Recipient</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Age Band</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Urgency</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {needs.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{n.User?.firstName} {n.User?.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{n.Category?.name ?? "Any category"}</td>
                  <td className="px-4 py-3 text-gray-500">{n.ageBand}</td>
                  <td className="px-4 py-3 text-gray-500">{n.location}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${URGENCY_COLORS[n.urgency]}`}>{n.urgency}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[n.status]}`}>{n.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(n.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(n)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Need Profile</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Recipient</p>
              <p className="font-semibold text-sm">{selected.User?.firstName} {selected.User?.lastName}</p>
              <p className="text-xs text-gray-400">{selected.User?.email} · {selected.User?.phone ?? "No phone on file"}</p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Age Band</p>
                <p className="text-sm font-medium">{selected.ageBand}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Location</p>
                <p className="text-sm font-medium">{selected.location}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1.5">Life / Activity Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.lifeCategories.map((c) => (
                  <span key={c} className="text-xs px-2 py-1 rounded-full bg-[#e6f9f0] text-[#037F44] font-medium">
                    {LIFE_CATEGORY_LABELS[c] ?? c}
                  </span>
                ))}
              </div>
            </div>

            {selected.currentActivity && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Current Activity</p>
                <p className="text-sm">{selected.currentActivity}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Reason</p>
              <p className="text-sm bg-gray-50 rounded-lg p-3">{selected.reason}</p>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
              <p className="text-sm">{selected.deliveryAddress || <span className="text-gray-400 italic">Not yet provided</span>}</p>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${URGENCY_COLORS[selected.urgency]}`}>{selected.urgency} urgency</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
