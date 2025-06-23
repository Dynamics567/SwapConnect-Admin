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

const userSignUpData = [
  { name: "Mon", users: 2000 },
  { name: "Tue", users: 1500 },
  { name: "Wed", users: 2500 },
  { name: "Thur", users: 1700 },
  { name: "Fri", users: 2000 },
  { name: "Sat", users: 5500 },
  { name: "Sun", users: 2000 },
];

const revenueData = [
  { name: "Mon", revenue: 2000 },
  { name: "Tue", revenue: 1500 },
  { name: "Wed", revenue: 2500 },
  { name: "Thur", revenue: 1700 },
  { name: "Fri", revenue: 2000 },
  { name: "Sat", revenue: 5500 },
  { name: "Sun", revenue: 2000 },
];

function UserSignUpGraph() {
  return (
    <div className="bg-white rounded-lg shadow w-[504px] p-4 h-64 flex flex-col mb-4">
      <span className="font-semibold text-lg text-[#1D1D1D] mb-2">
        User Sign Ups
      </span>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={userSignUpData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#037F44"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueGraph() {
  return (
    <div className="bg-white rounded-lg shadow w-[504px] p-4 h-64 flex flex-col mb-4">
      <span className="font-semibold text-lg text-[#1D1D1D] mb-2">Revenue</span>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={revenueData}>
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
    </div>
  );
}

function StatGraph() {
  return (
    <div>
      <div className="flex gap-4">
        <UserSignUpGraph />
        <RevenueGraph />
      </div>
    </div>
  );
}

export default StatGraph;
