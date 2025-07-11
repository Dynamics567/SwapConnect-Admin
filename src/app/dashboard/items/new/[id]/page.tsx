"use client";
import React from "react";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";

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
  };
  otherImages: string[];
}

export default function ListingDetails() {
  const [loading, setLoading] = useState(false);
  const token = useAuthToken();
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/product/${item?.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        // console.log("Recent Listings:", data);
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
  }, [token]);

  return (
    <div className="flex flex-col gap-8 w-full pt-[110px] md:pl-[320px] pl-8 pr-8 pb-8 min-h-screen bg-[#F8F9FB]">
      <div className="flex items-center gap-2  text-sm font-medium text-[#037F44]">
        <Link
          href="/dashboard/items"
          className="hover:underline text-[#505050]"
        >
          New listing{" "}
        </Link>
        <span className=" text-[#505050]">{">"}</span>
        <span className="text-[#505050]">New listing details</span>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left + Main content card together */}
        <div className="flex flex-col md:flex-row bg-white rounded-xl p-6 shadow flex-1 gap-6">
          {/* Left section */}
          <div className="md:w-[340px] w-full flex-shrink-0">
            <Image
              src={item?.imageUrl || "/Card.png"}
              alt="Main"
              width={340}
              height={200}
              className="rounded-xl object-cover w-full h-48"
            />
            <div className="flex mt-2 gap-2">
              {item?.otherImages.map((image, i) => (
                <Image
                  key={i}
                  src={image}
                  alt={`Thumbnail ${i}`}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-md object-cover"
                />
              ))}
            </div>
            <div className="mt-6 border border-[#F3F3F3] p-4 rounded-xl flex items-center gap-4">
              <Image
                src="https://randomuser.me/api/portraits/men/75.jpg"
                alt="Seller"
                width={48}
                height={48}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-semibold text-[#1B2559]">
                  {item?.Account.firstName} {item?.Account.lastName}
                </p>
                <p className="text-sm text-[#1B2559]">{item?.Account.phone}</p>
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
                  <span>Used</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-gray-500">MODEL</span>
                  <span>Iphone 8</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500">BATTERY HEALTH</span>
                  <span>85%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-gray-500">RAM</span>
                  <span>2 GB</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500">COLOR</span>
                  <span>{item?.metaData.color}</span>
                </div>
              </div>

              <span className="text-gray-500">STORAGE</span>
              <span>64 GB</span>
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

            <button className="bg-green-700 text-white rounded-lg py-2 w-full mb-3 hover:bg-green-800">
              Approve listing
            </button>
            <button className="border border-green-700 text-green-700 rounded-lg py-2 w-full hover:bg-green-50">
              Reject listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
