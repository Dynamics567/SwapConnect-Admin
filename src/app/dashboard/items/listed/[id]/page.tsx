"use client";
import React from "react";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useRole } from "@/hooks/useRole";
import { API_URL } from "@/lib/config";
import { useParams } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Item {
  id: string;
  imageUrl: string;
  name: string;
  location: string;
  price: number;
  used: string;
  brand: string;
  condition: string;
  approved: boolean;
  Account: {
    firstName: string;
    lastName: string;
    phone: string;
    avatar: string;
    verified: string;
  };
  metaData: {
    color?: string;
    batteryHealth?: number | string;
    ram?: string;
    storage?: string;
  };
  otherImages: string[];
}

type PendingAction = { kind: "approve" | "reject" | "delete"; title: string; message: string };

export default function ListingDetails() {
  const [loading, setLoading] = useState(false);
  const token = useAuthToken();
  const { isAdmin, isSuperAdmin } = useRole();
  const canModerate = isAdmin || isSuperAdmin; // matches the approve/reject routes' own ADMIN_ROLES gate
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const params = useParams();
  const productId = params.id;

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/product/${productId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (data) {
          setItem(data);
        } else {
          setItem(null);
        }
      } catch {
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, productId]);

  const requestApprove = () =>
    setPendingAction({
      kind: "approve",
      title: "Approve this listing?",
      message: "It will show as approved and remain visible to buyers exactly as submitted.",
    });
  const requestReject = () =>
    setPendingAction({
      kind: "reject",
      title: "Reject this listing?",
      message: "It will be marked unapproved. The seller can still edit and it can be approved later.",
    });
  const requestDelete = () =>
    setPendingAction({
      kind: "delete",
      title: "Delete this listing?",
      message: "This permanently removes the listing. This can't be undone.",
    });

  const confirmPendingAction = async () => {
    if (!item || !token || !pendingAction) return;
    setActionLoading(true);
    setActionError("");
    try {
      if (pendingAction.kind === "delete") {
        const res = await fetch(`${API_URL}/api/products/${item.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to delete listing");
        router.push("/dashboard/items");
        return;
      }

      const res = await fetch(
        `${API_URL}/api/admin/product/${item.id}/${pendingAction.kind === "approve" ? "approve" : "reject"}`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${pendingAction.kind} listing`);
      setItem((prev) => (prev ? { ...prev, approved: pendingAction.kind === "approve" } : prev));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full min-w-0">
      <div className="flex items-center gap-2  text-sm font-medium text-[#037F44]">
        <Link
          href="/dashboard/items"
          className="hover:underline text-[#505050]"
        >
          Listed item{" "}
        </Link>
        <span className=" text-[#505050]">{">"}</span>
        <span className="text-[#505050]">Listed item details</span>
      </div>
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left + Main content card together */}
          <div className="flex flex-col md:flex-row bg-white rounded-xl p-6 shadow flex-1 gap-6">
            {/* Left section */}
            <div className="md:w-[340px] w-full flex-shrink-0">
              <ImageWithFallback
                src={item?.imageUrl}
                alt="Main"
                width={340}
                height={200}
                className="rounded-xl object-cover w-full h-48"
              />
              <div className="flex mt-2 gap-2">
                {item?.otherImages?.map((image, i) => (
                  <ImageWithFallback
                    key={i}
                    src={image}
                    alt="product image"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-md object-cover"
                  />
                ))}
              </div>
              <div className="mt-6 border border-[#F3F3F3] p-4 rounded-xl flex items-center gap-4">
                <ImageWithFallback
                  src={item?.Account?.avatar}
                  alt="Seller"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold text-[#1B2559]">
                    {item?.Account?.firstName} {item?.Account?.lastName}
                  </p>
                  <p className="text-sm text-[#1B2559]">
                    {item?.Account?.phone}
                  </p>
                </div>
                <CheckCircle className="text-green-600 ml-auto" />
              </div>
            </div>
            {/* Main content */}
            <div className="space-y-3 text-sm flex-1">
              <div className="flex flex-col gap-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-gray-500">BRAND</span>
                    <span>{item?.brand}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">CONDITION</span>
                    <span className="capitalize">{item?.condition || "—"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-gray-500">MODEL</span>
                    <span>{item?.name || "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">BATTERY HEALTH</span>
                    <span>{item?.metaData?.batteryHealth ? `${item.metaData.batteryHealth}%` : "—"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-gray-500">RAM</span>
                    <span>{item?.metaData?.ram || "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">COLOR</span>
                    <span>{item?.metaData?.color || "—"}</span>
                  </div>
                </div>

                <span className="text-gray-500">STORAGE</span>
                <span>{item?.metaData?.storage || "—"}</span>
              </div>
            </div>
          </div>
          {/* Right section - Actions */}
          <div className="bg-white rounded-xl p-6 shadow flex flex-col justify-between min-w-[220px] h-fit">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm mb-2">
                  <p className="text-gray-500">PRICE</p>
                  <p className="text-lg font-bold">₦{item?.price}</p>
                </div>
                <div className="text-sm mb-6">
                  <p className="text-gray-500">LOCATION</p>
                  <p className="text-md">Lagos</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 mb-4">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`text-sm font-semibold ${item?.approved ? "text-green-700" : "text-amber-700"}`}>
                  {item?.approved ? "Approved" : "Not approved"}
                </span>
              </div>

              {actionError && (
                <p className="text-xs text-red-600 mb-3">{actionError}</p>
              )}

              <div className="space-y-2">
                {canModerate && !item?.approved && (
                  <button
                    onClick={requestApprove}
                    disabled={!item}
                    className="w-full bg-[#037F44] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#026835] transition-colors disabled:opacity-60"
                  >
                    Approve Listing
                  </button>
                )}
                {canModerate && item?.approved && (
                  <button
                    onClick={requestReject}
                    disabled={!item}
                    className="w-full bg-amber-100 text-amber-800 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-200 transition-colors disabled:opacity-60"
                  >
                    Reject Listing
                  </button>
                )}
                {/* Any staff role can remove a listing outright -- matches
                    the backend's ALL_STAFF gate on DELETE /api/products/:id. */}
                <button
                  onClick={requestDelete}
                  disabled={!item}
                  className="w-full bg-red-50 text-red-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"
                >
                  Delete Listing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction?.title ?? ""}
        message={pendingAction?.message ?? ""}
        variant={pendingAction?.kind === "delete" ? "danger" : pendingAction?.kind === "reject" ? "warning" : "default"}
        confirmLabel={pendingAction?.kind === "delete" ? "Delete" : pendingAction?.kind === "reject" ? "Reject" : "Approve"}
        loading={actionLoading}
        onConfirm={confirmPendingAction}
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
}
