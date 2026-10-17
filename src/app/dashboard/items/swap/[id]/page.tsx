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

interface Item {
  id: string;
  imageUrl: string;
  name: string;
  price: number;
  brand: string;
  condition: string | null;
  verificationStatus: "unverified" | "verified" | "warranty";
  Account: {
    firstName: string;
    lastName: string;
    phone: string;
    avatar: string;
    verified: boolean;
    city: string | null;
    state: string | null;
  };
  metaData: {
    color: string;
    ram: string;
    storage: string;
    battery: string;
  };
  otherImages: string[];
}
export default function ListingDetails() {
  const [loading, setLoading] = useState(false);
  const token = useAuthToken();
  const [selectedConditionTag, setSelectedConditionTag] = useState("");
  const [selectedVerificationStatus, setSelectedVerificationStatus] =
    useState("");
  const [isVerified, setIsVerified] = useState(false);

  const [item, setItem] = useState<Item | null>(null);
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
          setIsVerified(data.verificationStatus === "verified" || data.verificationStatus === "warranty");
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

  const handleVerifyProduct = async () => {
    if (!selectedConditionTag || !selectedVerificationStatus) {
      toast.error("Please select both Condition Tag and Verification Status.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/product/${productId}/verify-product`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conditionTag: selectedConditionTag,
            verificationStatus: selectedVerificationStatus,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Product verified successfully!");
        setIsVerified(true);
        if (data.data) {
          setItem((prev) =>
            prev ? { ...prev, condition: data.data.condition, verificationStatus: data.data.verificationStatus } : prev
          );
        }
      } else {
        console.error("Error:", data);
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error("Network or server error.");
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full min-w-0">
      <div className="flex items-center gap-2  text-sm font-medium text-[brand-emerald]">
        <Link
          href="/dashboard/items"
          className="hover:underline text-[#505050]"
        >
          Swap offer{" "}
        </Link>
        <span className=" text-[#505050]">{">"}</span>
        <span className="text-[#505050]">Swap offer details</span>
      </div>
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 min-w-0">
          {/* Left + Main content card together */}
          <div className="flex flex-col lg:flex-row bg-white rounded-xl p-6 shadow flex-1 gap-6 min-w-0">
            {/* Left section */}
            <div className="lg:w-[340px] w-full lg:flex-shrink-0">
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
                {item?.Account?.verified && (
                  <CheckCircle
                    className="text-green-600 ml-auto"
                    // title="Verified"
                  />
                )}
              </div>
            </div>
            {/* Main content */}
            <div className="space-y-3 text-sm flex-1 min-w-0">
              <div className="flex flex-col gap-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">BRAND</span>
                    <span className="break-words">{item?.brand}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">CONDITION</span>
                    <span className="break-words">{item?.condition || "—"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">MODEL</span>
                    <span className="break-words">{item?.name || "—"}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">BATTERY HEALTH</span>
                    <span>{item?.metaData?.battery}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">RAM</span>
                    <span className="break-words">{item?.metaData?.ram}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-500">COLOR</span>
                    <span className="break-words">{item?.metaData?.color}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-gray-500">STORAGE</span>
                  <span className="break-words">{item?.metaData?.storage}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Right section - Actions */}
          <div className="bg-white rounded-xl p-6 shadow flex flex-col justify-between min-w-[220px] h-fit">
            <div>
              <div className="flex flex-col   mb-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm mb-2">
                    <p className="text-gray-500">PRICE</p>
                    <p className="text-lg font-bold">₦{item?.price}</p>
                  </div>
                  <div className="text-sm mb-6">
                    <p className="text-gray-500">LOCATION</p>
                    <p className="text-md">
                      {[item?.Account?.city, item?.Account?.state].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 mb-4">
                {isVerified ? (
                  <p className="text-brand-emerald font-semibold text-center">
                    Swap offer verified
                    {item?.verificationStatus === "warranty" ? " (with warranty)" : ""}
                  </p>
                ) : (
                  <>
                    <div>
                      <select
                        id="condition"
                        className="w-full border text-black font-bold rounded px-3 py-2 text-sm bg-gray-50"
                        value={selectedConditionTag}
                        onChange={(e) =>
                          setSelectedConditionTag(e.target.value)
                        }
                      >
                        <option value="" disabled>
                          Condition tag
                        </option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                      </select>
                    </div>
                    <div>
                      <select
                        id="verification"
                        className="w-full border text-black font-bold rounded px-3 py-2 text-sm bg-gray-50"
                        value={selectedVerificationStatus}
                        onChange={(e) =>
                          setSelectedVerificationStatus(e.target.value)
                        }
                      >
                        <option value="" disabled>
                          Verification status
                        </option>
                        <option value="Verify">Verify</option>
                        <option value="Warranty">Warranty</option>
                      </select>
                    </div>
                    <button
                      className="bg-brand-emerald text-white rounded-lg py-2 w-full mb-3 hover:bg-brand-emerald-hover"
                      onClick={handleVerifyProduct}
                    >
                      Submit
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
