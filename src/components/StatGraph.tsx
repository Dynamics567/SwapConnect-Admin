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

interface StatGraphProps {
  revenueData: RevenuePoint[];
  loading: boolean;
}

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function UserSignUpGraph() {
  return (
    <div className="bg-white rounded-lg shadow w-full md:w-[504px] p-4 h-64 flex flex-col mb-4">
      <span className="font-semibold text-lg text-[#1D1D1D] mb-2">
        User Sign Ups
      </span>
      <div className="flex-1 flex items-center justify-center text-sm text-[#BEBEBE] text-center px-6">
        Daily sign-up trends aren&apos;t tracked by the backend yet.
      </div>
    </div>
  );
}

function RevenueGraph({ revenueData, loading }: StatGraphProps) {
  const chartData = revenueData.map((point) => ({
    name: formatChartDate(point.date),
    revenue: point.amount,
  }));

  return (
    <div className="bg-white rounded-lg shadow w-full md:w-[504px] p-4 h-64 flex flex-col mb-4">
      <span className="font-semibold text-lg text-[#1D1D1D] mb-2">Revenue</span>
      {loading ? (
        <div className="flex-1 animate-pulse bg-gray-100 rounded" />
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[#BEBEBE]">
          No revenue in the last 30 days.
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

function StatGraph({ revenueData, loading }: StatGraphProps) {
  return (
    <div>
      <div className="md:flex-row flex flex-col gap-4">
        <UserSignUpGraph />
        <RevenueGraph revenueData={revenueData} loading={loading} />
      </div>
    </div>
  );
}

export default StatGraph;
