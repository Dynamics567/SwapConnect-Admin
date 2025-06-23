"use client";
import React, { useState } from "react";
import { Search, Filter, CircleDollarSign } from "lucide-react";

export default function WalletContent() {
  const [activeTab, setActiveTab] = useState<"normal" | "swap">("normal");

  return (
    <div className="flex flex-col  gap-6 w-full">
      {/* Column 1: Stat Cards */}
      <div className="flex  gap-4 w-full ">
        <div className="bg-white rounded-xl w-[331px] shadow p-4 flex gap-5 items-start">
          <span className="bg-[#F7F8FB] rounded-full text-[#037F44] p-2 flex items-center justify-center">
            <CircleDollarSign />
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-[#BEBEBE] mb-1">Revenue</span>
            <span className="text-2xl font-bold text-black">₦1,200,000</span>
          </div>
        </div>
        <div className="bg-white rounded-xl w-[331px] shadow p-4 flex gap-5 items-start">
          <span className="bg-[#F7F8FB] rounded-full text-[#037F44] p-2 flex items-center justify-center">
            <CircleDollarSign />
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-[#BEBEBE] mb-1">Payment Pending</span>
            <span className="text-2xl font-bold text-black">₦150,000</span>
          </div>
        </div>
        <div className="bg-white rounded-xl w-[331px] shadow p-4 flex gap-5 items-start">
          <span className="bg-[#F7F8FB] rounded-full text-[#037F44] p-2 flex items-center justify-center">
            <CircleDollarSign />
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-[#BEBEBE] mb-1">
              Platform Earnings
            </span>
            <span className="text-2xl font-bold text-black">₦300,000</span>
          </div>
        </div>
      </div>

      {/* Column 2: Tabs */}
      <div className="flex flex-col w-full">
        <div className="bg-white rounded-xl shadow p-2 flex gap-2 mb-4">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "normal"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("normal")}
          >
            Normal Purchase
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "swap"
                ? "bg-[#037F44] text-white"
                : "bg-[#F7F8FB] text-[#037F44] hover:bg-[#e6f4ed]"
            }`}
            onClick={() => setActiveTab("swap")}
          >
            Swap Purchase
          </button>
        </div>
      </div>

      {/* Column 3: Search & Filter */}
      <div className="flex flex-col w-full  gap-4">
        <div className="flex gap-2">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search transactions"
              className="w-full border rounded-lg px-10 py-2 text-sm bg-gray-50"
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
      </div>

      {/* Column 4: Transactions Table */}
      <div className="w-full mt-6 lg:mt-0">
        <div className="bg-white rounded-xl shadow p-4">
          {activeTab === "normal" ? (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-[#CCDCD4]  text-[#505050] text-left">
                  <th className="py-2 px-4 font-normal text-sm">
                    Transaction ID
                  </th>
                  <th className="py-2 px-4 font-normal text-sm">ITEM</th>
                  <th className="py-2 px-4 font-normal text-sm">AMOUNT</th>
                  <th className="py-2 px-4 font-normal text-sm">DATE</th>
                  <th className="py-2 px-4 font-normal text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Example row */}
                <tr className=" text-sm text-[#434343]">
                  <td className="py-2 px-4">SWPC2023</td>
                  <td className="py-2 px-4">Iphone 11</td>
                  <td className="py-2 px-4">$100</td>
                  <td className="py-2 px-4">2024-06-01</td>
                  <td className="py-2 px-4 text-green-700">Approved</td>
                </tr>
                <tr className=" text-sm text-[#434343]">
                  <td className="py-2 px-4">SWPC2024</td>
                  <td className="py-2 px-4">Samsung S21</td>
                  <td className="py-2 px-4">$200</td>
                  <td className="py-2 px-4">2024-06-02</td>
                  <td className="py-2 px-4 text-yellow-600">Pending</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-[#CCDCD4]  text-[#505050] text-left">
                  <th className="py-2 px-4 font-normal text-sm">
                    Transaction ID
                  </th>
                  <th className="py-2 px-4 font-normal text-sm">LISTED ITEM</th>
                  <th className="py-2 px-4 font-normal text-sm">SWAP OFFER</th>
                  <th className="py-2 px-4 font-normal text-sm">BID AMOUNT</th>
                  <th className="py-2 px-4 font-normal text-sm">DATE</th>
                  <th className="py-2 px-4 font-normal text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Example row */}
                <tr className=" text-sm text-[#434343]">
                  <td className="py-2 px-4">SWAP2023</td>
                  <td className="py-2 px-4">Iphone 11</td>
                  <td className="py-2 px-4">Iphone 8</td>
                  <td className="py-2 px-4">$80</td>
                  <td className="py-2 px-4">2024-06-03</td>
                  <td className="py-2 px-4 text-green-700">Approved</td>
                </tr>
                <tr className=" text-sm text-[#434343]">
                  <td className="py-2 px-4">SWAP2024</td>
                  <td className="py-2 px-4">Samsung S21</td>
                  <td className="py-2 px-4">iPhone X</td>
                  <td className="py-2 px-4">$120</td>
                  <td className="py-2 px-4">2024-06-04</td>
                  <td className="py-2 px-4 text-yellow-600">Pending</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
