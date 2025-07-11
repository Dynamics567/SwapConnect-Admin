"use client";
import React, { useState, useEffect } from "react";
import { Search, Filter, CircleDollarSign } from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";

interface Transaction {
  id: string;
  item: string;
  amount: string;
  createdAt: string;
  status: string;
  order: {
    id: string;
    products: [
      {
        id: number;
        name: string | null;
      }
    ];
  };
}
interface Swap {
  id: string;
  name: string;
  swapProduct: string;
  amount: string;
  createdAt: string;
  status: string;
  bid: {
    id: string;
    product: {
      id: number;
      name: string;
    };
    swapProduct: string | null;
  };
}
interface Stats {
  transactionVolume: number;
  pendingPayments: number;
  platformEarnings: number;
}

export default function WalletContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [stat, setStat] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"normal" | "swap">("normal");
  const token = useAuthToken();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/transactions/recent`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        // console.log("Transaction Data:", data);
        if (typeof data.transactions === "object") {
          setTransactions(data.transactions.orders);
          setSwaps(data.transactions.swaps);
        } else {
          setTransactions([]);
          setSwaps([]);
        }
      } catch {
        setTransactions([]);
        setSwaps([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/statistics`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        // console.log("Statistics Data:", data);
        if (data?.statistics) {
          setStat(data?.statistics);
        } else {
          setStat(null);
        }
      } catch {
        setStat(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

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

            <span className="text-2xl font-bold text-black">
              ₦{stat?.transactionVolume}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl w-[331px] shadow p-4 flex gap-5 items-start">
          <span className="bg-[#F7F8FB] rounded-full text-[#037F44] p-2 flex items-center justify-center">
            <CircleDollarSign />
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-[#BEBEBE] mb-1">Payment Pending</span>
            <span className="text-2xl font-bold text-black">
              ₦{stat?.pendingPayments}
            </span>
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
        {loading ? (
          <p>Loading orders...</p>
        ) : transactions.length === 0 ? (
          <div>
            <p className="text-center text-[#848484] mt-6">No orders found</p>
          </div>
        ) : (
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
                  {transactions.map((transactions) => (
                    <tr
                      key={transactions.id}
                      className=" text-sm text-[#434343]"
                    >
                      <td className="py-2 px-4">{transactions.id}</td>
                      <td className="py-2 px-4">
                        {" "}
                        {transactions.order.products[0].name}
                      </td>
                      <td className="py-2 px-4">₦{transactions.amount}</td>
                      <td className="py-2 px-4">{transactions.createdAt}</td>
                      <td className="py-2 px-4 text-green-700">
                        {transactions.status}
                      </td>
                    </tr>
                  ))}

                  {/* <tr className=" text-sm text-[#434343]">
                  <td className="py-2 px-4">SWPC2024</td>
                  <td className="py-2 px-4">Samsung S21</td>
                  <td className="py-2 px-4">$200</td>
                  <td className="py-2 px-4">2024-06-02</td>
                  <td className="py-2 px-4 text-yellow-600">Pending</td>
                </tr> */}
                </tbody>
              </table>
            ) : (
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-[#CCDCD4]  text-[#505050] text-left">
                    <th className="py-2 px-4 font-normal text-sm">
                      Transaction ID
                    </th>
                    <th className="py-2 px-4 font-normal text-sm">
                      LISTED ITEM
                    </th>
                    <th className="py-2 px-4 font-normal text-sm">
                      SWAP OFFER
                    </th>
                    <th className="py-2 px-4 font-normal text-sm">
                      BID AMOUNT
                    </th>
                    <th className="py-2 px-4 font-normal text-sm">DATE</th>
                    <th className="py-2 px-4 font-normal text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {swaps.map((swaps) => (
                    <tr key={swaps.id} className=" text-sm text-[#434343]">
                      <td className="py-2 px-4">{swaps.id}</td>
                      <td className="py-2 px-4">{swaps.bid.product.name}</td>
                      <td className="py-2 px-4"> {swaps.bid.swapProduct}</td>
                      <td className="py-2 px-4">₦{swaps.amount}</td>
                      <td className="py-2 px-4">{swaps.createdAt}</td>
                      <td className="py-2 px-4 text-green-700">
                        {swaps.status}
                      </td>
                    </tr>
                  ))}
                  {/* <tr className=" text-sm text-[#434343]">
                  <td className="py-2 px-4">SWAP2024</td>
                  <td className="py-2 px-4">Samsung S21</td>
                  <td className="py-2 px-4">iPhone X</td>
                  <td className="py-2 px-4">$120</td>
                  <td className="py-2 px-4">2024-06-04</td>
                  <td className="py-2 px-4 text-yellow-600">Pending</td>
                </tr> */}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
