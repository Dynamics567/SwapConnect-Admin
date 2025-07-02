"use client";
import React from "react";
import type { JSX } from "react";
import { CircleDollarSign, Store, Users, Repeat } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";

interface Stat {
  label: string;
  value: string | number;
  key: string;
  icon: JSX.Element;
}

function StatsCard() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthToken();

  useEffect(() => {
    // console.log("StatsCard token:", token);
    if (!token) {
      setLoading(false); // If no token, stop loading and don't fetch
      return;
    }
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/get-dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data?.dashboard.totals) {
          setStats([
            {
              label: "Total Revenue",
              value: `₦${data.dashboard.totals.totalRevenue ?? 0}`,
              key: "revenue",
              icon: <CircleDollarSign size={24} className="text-[#037F44]" />,
            },
            {
              label: "Total Users",
              value: data.dashboard.totals.users ?? 0,
              key: "users",
              icon: <Users size={24} className="text-[#037F44]" />,
            },
            {
              label: "Total Items Listed",
              value: data.dashboard.totals.newListings ?? 0,
              key: "items",
              icon: <Store size={24} className="text-[#037F44]" />,
            },
            {
              label: "Active Swaps",
              value: data.dashboard.totals.activeSwaps ?? 0,
              key: "swaps",
              icon: <Repeat size={24} className="text-[#037F44]" />,
            },
          ]);
        } else {
          setStats([]);
        }
      } catch {
        setStats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);
  return (
    <div>
      <div className="flex gap-4">
        {loading
          ? [1, 2, 3, 4].map((i) => (
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
    </div>
  );
}

export default StatsCard;
