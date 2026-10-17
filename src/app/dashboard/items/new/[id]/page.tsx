"use client";
import React from "react";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { useState, useEffect } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
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
  model: string;
  batteryHealth: string;
  ram: string;
  color: string;
  storage: string;
  Account: {
    firstName: string;
    lastName: string;
    phone: string;
    avatar: string;
    verified: string;
  };
  metaData: {
    color: string;
    battery: string;
    ram: string;
    storage: string;
    os: string;
  };
  otherImages: string[];
}

export default function ListingDetails() {
  const [loading, setLoading] = useState(false);
  const token = useAuthToken();
  const [item, setItem] = useState<Item | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<
    "approved" | "rejected" | null
  >(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);

  const params = useParams();
  const productId = params.id;

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

  const confirmPendingAction = async () => {
    if (!token || !productId || !pendingAction) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/product/${productId}/${pendingAction}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await res.json();
      // Previously set approved/rejected unconditionally, even on a
      // 400/404/500 -- an admin clicking Approve on a listing that failed
      // to approve (e.g. already approved, product not found) would see a
      // false success state with no indication anything went wrong.
      if (res.ok) {
        setApprovalStatus(pendingAction === "approve" ? "approved" : "rejected");
      } else {
        toast.error(result.message || `Failed to ${pendingAction} listing`);
      }
    } catch (err) {
      console.error(`${pendingAction} error:`, err);
      toast.error(`Network or server error while ${pendingAction === "approve" ? "approving" : "rejecting"} listing.`);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full min-w-0">
      <div className="flex items-center gap-2  text-sm font-medium text-[brand-emerald]">
        <Link
          href="/dashboard/items"
          className="hover:underline text-[#505050]"
        >
          New listing{" "}
        </Link>
        <span className=" text-[#505050]">{">"}</span>
        <span className="text-[#505050]">New listing details</span>
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
              <div className="flex mt-2 gap-2 flex-wrap">
                {item?.otherImages?.map((image, i) => (
                  <ImageWithFallback
                    key={i}
                    src={image}
                    alt="product image"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-md object-cover shrink-0"
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
              <div className="flex flex-col gap-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">BRAND</span>
                    <span className="text-black break-words">{item?.brand}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">CONDITION</span>
                    <span className="text-black">Used</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">MODEL</span>
                    <span className="text-black break-words">{item?.metaData?.os}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">BATTERY HEALTH</span>
                    <span className="text-black">{item?.metaData?.battery}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">RAM</span>
                    <span className="text-black break-words">{item?.metaData?.ram}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">COLOR</span>
                    <span className="text-black break-words">{item?.metaData?.color}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-gray-500">STORAGE</span>
                  <span className="text-black break-words">{item?.metaData?.storage}</span>
                </div>
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

              {approvalStatus === "approved" ? (
                <p className="text-brand-emerald font-medium text-center">
                  Product approved
                </p>
              ) : approvalStatus === "rejected" ? (
                <p className="text-red-600 font-medium text-center">
                  Product rejected
                </p>
              ) : (
                <>
                  <button
                    onClick={() => setPendingAction("approve")}
                    className="bg-brand-emerald text-white rounded-lg py-2 w-full mb-3 hover:bg-brand-emerald-hover disabled:opacity-50"
                    disabled={loading}
                  >
                    Approve listing
                  </button>
                  <button
                    onClick={() => setPendingAction("reject")}
                    className="border border-brand-emerald text-brand-emerald rounded-lg py-2 w-full hover:bg-brand-emerald-light disabled:opacity-50"
                    disabled={loading}
                  >
                    Reject listing
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction === "approve" ? "Approve this listing?" : "Reject this listing?"}
        message={
          pendingAction === "approve"
            ? "It will show as approved and remain visible to buyers exactly as submitted."
            : "It will be marked unapproved. The seller can still edit and it can be approved later."
        }
        variant={pendingAction === "reject" ? "warning" : "default"}
        confirmLabel={pendingAction === "approve" ? "Approve" : "Reject"}
        loading={loading}
        onConfirm={confirmPendingAction}
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
}
