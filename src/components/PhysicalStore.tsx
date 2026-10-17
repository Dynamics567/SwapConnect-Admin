"use client";
import React, { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";
import ProtectedRoute from "./ProtectedRoute";
import ActionMenu from "./ui/ActionMenu";
import { ConfirmDialog } from "./ui/ConfirmDialog";

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
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();
  const token = useAuthToken();

  useEffect(() => {
    if (!token) return;
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
        // console.log("Store Listings:", data);
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
    setDeleting(true);
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

      if (response.ok) {
        setStores((prev) =>
          prev.filter((store) => store.id !== selectedStoreId)
        );
        setShowConfirm(false);
        toast.success("Store deleted successfully.");
      } else {
        toast.error(result?.message || "Failed to delete store");
      }
    } catch (error) {
      console.error("Error deleting store:", error);
      toast.error("An error occurred while deleting the store");
    } finally {
      setDeleting(false);
    }
  };

  const storeMenuItems = (id: string) => [
    { label: "Edit", onClick: () => handleEdit(id), variant: "accent" as const },
    {
      label: "Delete",
      onClick: () => {
        setSelectedStoreId(id);
        setShowConfirm(true);
      },
      variant: "danger" as const,
    },
  ];

  const filteredStores = search.trim()
    ? stores.filter((store) =>
        `${store.name} ${store.address} ${store.contact}`.toLowerCase().includes(search.trim().toLowerCase())
      )
    : stores;

  return (
    <ProtectedRoute
      allowedRoles={["superadmin", "admin", "verificationofficer"]}
    >
      <div className="w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="md:text-2xl text-lg font-bold text-brand-emerald">
            Physical Stores
          </h2>
          <button
            className="flex items-center gap-2 bg-brand-emerald text-white px-4 py-2 rounded-lg hover:bg-brand-emerald-hover transition"
            onClick={() => router.push("/dashboard/store/add")}
          >
            <Plus size={18} />
            Add new store
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2 w-full ">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search stores by name, address, or contact"
              className="w-full border rounded-lg px-10 py-2 text-sm bg-gray-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>
        </div>

        <ConfirmDialog
          open={showConfirm}
          title="Delete Store"
          message="Are you sure you want to delete this store? This action cannot be undone."
          variant="danger"
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setShowConfirm(false)}
        />

        {loading ? (
          <div className="text-center py-8 text-brand-emerald font-medium">
            Loading stores...
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow p-4 w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-brand-emerald-light text-[#505050] text-left">
                    <th className="py-2 px-4 font-normal text-sm">
                      Store Name
                    </th>
                    <th className="py-2 px-4 font-normal text-sm">Location</th>
                    <th className="py-2 px-4 font-normal text-sm">Contact</th>
                    <th className="py-2 px-4 font-normal text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map((store) => (
                    <tr
                      key={store.id}
                      className="text-[#434343] text-sm relative"
                    >
                      <td className="py-2 px-4">{store.name}</td>
                      <td className="py-2 px-4">{store.address}</td>
                      <td className="py-2 px-4">{store.contact}</td>
                      <td className="py-2 px-4">
                        <ActionMenu
                          items={storeMenuItems(store.id)}
                          open={actionMenuId === store.id}
                          onOpenChange={(open) => setActionMenuId(open ? store.id : null)}
                          ariaLabel={`Actions for ${store.name}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="block md:hidden">
              <div className="flex flex-col gap-4">
                {filteredStores.map((store) => (
                  <div
                    key={store.id}
                    className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#353535]">
                        {store.name}
                      </span>
                      <ActionMenu
                        items={storeMenuItems(store.id)}
                        open={actionMenuId === store.id}
                        onOpenChange={(open) => setActionMenuId(open ? store.id : null)}
                        ariaLabel={`Actions for ${store.name}`}
                      />
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
