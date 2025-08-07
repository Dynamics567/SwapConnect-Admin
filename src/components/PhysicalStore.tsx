"use client";
import React, { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import ProtectedRoute from "./ProtectedRoute";

interface Store {
  id: string;
  name: string;
  address: string;
  contact: string;
}

export default function PhysicalStore() {
  const [search, setSearch] = useState("");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const router = useRouter();
  const token = useAuthToken();

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/admin/store`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log("Store Listings:", data);
        if (Array.isArray(data.data)) {
          setStores(data.data);
        } else {
          setStores([]);
        }
      } catch {
        setStores([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, [token]);

  const handleEdit = (id: string) => {
    router.push(`/dashboard/store/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!selectedStoreId) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/store/${selectedStoreId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      console.log("Delete result:", result);

      if (response.ok) {
        setStores((prev) =>
          prev.filter((store) => store.id !== selectedStoreId)
        );
        setShowConfirm(false);
        setShowSuccess(true);
      } else {
        alert(result?.message || "Failed to delete store");
      }
    } catch (error) {
      console.error("Error deleting store:", error);
      alert("An error occurred while deleting the store");
    }
  };

  const renderActions = (id: string) => (
    <div className="absolute z-10 right-6 mt-2 w-32 bg-white border rounded shadow-lg">
      <button
        className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-[#037F44] text-sm"
        onClick={() => {
          setActionMenuId(null);
          handleEdit(id);
        }}
      >
        Edit
      </button>
      <button
        className="block w-full text-left px-4 py-2 hover:bg-[#F7F8FB] text-red-600 text-sm"
        onClick={() => {
          setSelectedStoreId(id);
          setShowConfirm(true);
          setActionMenuId(null);
        }}
      >
        Delete
      </button>
    </div>
  );

  return (
    <ProtectedRoute
      allowedRoles={["superadmin", "admin", "verificationofficer"]}
    >
      <div className="w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="md:text-2xl text-lg font-bold text-[#037F44]">
            Physical Stores
          </h2>
          <button
            className="flex items-center gap-2 bg-[#037F44] text-white px-4 py-2 rounded-lg hover:bg-[#025e2e] transition"
            onClick={() => router.push("/dashboard/store/add")}
          >
            <Plus size={18} />
            Add new store
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

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 bg-[#F8F9FB] bg-opacity-30 flex justify-center items-center z-50">
            <div className="bg-white p-6 flex flex-col  justify-between rounded shadow-lg h-50 w-90">
              <div className="flex flex-col items-center justify-center">
                <p className="text-[#101828] text-[18px]">Deactivate</p>
                <p className="text-sm mb-4 text-[#667085]">
                  Are you sure you want to delete this store?
                </p>
              </div>

              <div className="flex justify-between gap-4">
                <button
                  className="text-gray-500 border px-4 rounded border-[#037F44] hover:text-gray-700"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-[#037F44] text-white px-4 py-1 rounded hover:bg-red-700"
                  onClick={handleDelete}
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl w-[90%] max-w-md text-center">
              <h3 className="text-xl font-semibold text-[#037F44]">Deleted</h3>
              <p className="text-sm text-[#667085] mt-2">
                Store has been successfully deleted.
              </p>
              <button
                className="mt-4 bg-[#037F44] text-white px-6 py-2 rounded-lg"
                onClick={() => setShowSuccess(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-[#037F44] font-medium">
            Loading stores...
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow p-4 w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-[#CCDCD4] text-[#505050] text-left">
                    <th className="py-2 px-4 font-normal text-sm">
                      Store Name
                    </th>
                    <th className="py-2 px-4 font-normal text-sm">Location</th>
                    <th className="py-2 px-4 font-normal text-sm">Contact</th>
                    <th className="py-2 px-4 font-normal text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr
                      key={store.id}
                      className="text-[#434343] text-sm relative"
                    >
                      <td className="py-2 px-4">{store.name}</td>
                      <td className="py-2 px-4">{store.address}</td>
                      <td className="py-2 px-4">{store.contact}</td>
                      <td className="py-2 px-4">
                        <button
                          className="text-[#037F44] hover:bg-[#F7F8FB] rounded-full p-1"
                          onClick={() =>
                            setActionMenuId(
                              actionMenuId === store.id ? null : store.id
                            )
                          }
                        >
                          <MoreVertical size={18} />
                        </button>
                        {actionMenuId === store.id && renderActions(store.id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="block md:hidden">
              <div className="flex flex-col gap-4">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#353535]">
                        {store.name}
                      </span>
                      <button
                        className="text-[#037F44] hover:bg-[#F7F8FB] rounded-full p-1"
                        onClick={() =>
                          setActionMenuId(
                            actionMenuId === store.id ? null : store.id
                          )
                        }
                      >
                        <MoreVertical size={18} />
                      </button>
                      {actionMenuId === store.id && renderActions(store.id)}
                    </div>
                    <div className="text-sm text-[#505050]">
                      {store.address}
                    </div>
                    <div className="text-sm text-[#505050]">
                      {store.contact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
