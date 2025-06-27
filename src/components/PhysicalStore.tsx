"use client";
import React, { useState } from "react";
import { Search, Filter, MoreVertical, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const stores = [
  {
    name: "SwapConnect Ikeja",
    location: "Ikeja, Lagos",
    contact: "08012345678",
  },
  {
    name: "SwapConnect Abuja",
    location: "Wuse, Abuja",
    contact: "08123456789",
  },
  {
    name: "SwapConnect PH",
    location: "GRA, Port Harcourt",
    contact: "09087654321",
  },
];

export default function PhysicalStore() {
  const [search, setSearch] = useState("");
  const [actionMenuIdx, setActionMenuIdx] = useState<number | null>(null);
  const router = useRouter();

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(search.toLowerCase()) ||
      store.location.toLowerCase().includes(search.toLowerCase()) ||
      store.contact.includes(search)
  );

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#037F44]">Physical Stores</h2>
        <button
          className="flex items-center gap-2 bg-[#037F44] text-white px-4 py-2 rounded-lg hover:bg-[#025e2e] transition"
          onClick={() => router.push("/dashboard/store/add")}
        >
          <Plus size={18} />
          Add new store{" "}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2 w-full ">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search stores"
            className="w-full border rounded-lg px-10 py-2 text-sm bg-gray-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        <button className="flex items-center gap-1 px-4 py-2 bg-[#F7F8FB] border rounded-lg text-[#037F44] hover:bg-[#e6f4ed]">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4 w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-[#CCDCD4] text-[#505050] text-left">
              <th className="py-2 px-4 font-normal text-sm">Store Name</th>
              <th className="py-2 px-4 font-normal text-sm">Location</th>
              <th className="py-2 px-4 font-normal text-sm">Contact</th>
              <th className="py-2 px-4 font-normal text-sm">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStores.map((store, idx) => (
              <tr key={idx} className="text-[#434343] text-sm relative">
                <td className="py-2 px-4">{store.name}</td>
                <td className="py-2 px-4">{store.location}</td>
                <td className="py-2 px-4">{store.contact}</td>
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
                    <div className="absolute z-10 right-6 mt-2 w-32 bg-white border rounded shadow-lg">
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44] text-sm"
                        onClick={() => {
                          setActionMenuIdx(null);
                          // handle edit logic here
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-red-600 text-sm"
                        onClick={() => {
                          setActionMenuIdx(null);
                          // handle delete logic here
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredStores.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400">
                  No stores found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
