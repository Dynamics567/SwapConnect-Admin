"use client";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenuePoint {
  date: string;
  amount: number;
}

interface SignupPoint {
  date: string;
  count: number;
}

interface StatGraphProps {
  revenueData: RevenuePoint[];
  signupsData: SignupPoint[];
  loading: boolean;
}

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function UserSignUpGraph({ signupsData, loading }: { signupsData: SignupPoint[]; loading: boolean }) {
  const chartData = signupsData.map((point) => ({
    name: formatChartDate(point.date),
    signups: point.count,
  }));

  return (
    <div className="bg-white rounded-lg shadow w-full p-4 h-64 flex flex-col">
      <span className="font-semibold text-lg text-[#353535] mb-2">
        User Sign Ups
      </span>
      {loading ? (
        <div className="flex-1 animate-pulse bg-gray-100 rounded" />
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <p className="text-sm font-semibold text-[#353535] mb-1">No Sign-Ups Yet</p>
          <p className="text-xs text-[#6b6b6b] max-w-[280px]">
            New user sign-ups from the last 30 days will appear here as a trend.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="signups"
              stroke="#037F44"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function RevenueGraph({ revenueData, loading }: { revenueData: RevenuePoint[]; loading: boolean }) {
  const chartData = revenueData.map((point) => ({
    name: formatChartDate(point.date),
    revenue: point.amount,
  }));

  return (
    <div className="bg-white rounded-lg shadow w-full p-4 h-64 flex flex-col">
      <span className="font-semibold text-lg text-[#353535] mb-2">Revenue</span>
      {loading ? (
        <div className="flex-1 animate-pulse bg-gray-100 rounded" />
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <p className="text-sm font-semibold text-[#353535] mb-1">No Revenue Yet</p>
          <p className="text-xs text-[#6b6b6b] max-w-[280px]">
            Your transaction revenue will appear here once completed transactions begin.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#037F44"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function StatGraph({ revenueData, signupsData, loading }: StatGraphProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UserSignUpGraph signupsData={signupsData} loading={loading} />
      <RevenueGraph revenueData={revenueData} loading={loading} />
    </div>
  );
}

export default StatGraph;
