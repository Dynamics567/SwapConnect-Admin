import React, { useEffect } from "react";
import Image from "next/image";
import { MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";
// import Page from "@/app/dashboard/page";
import PageButton from "./PageButton";

type Order = {
  id: string;
  imageUrl: string;
  name: string;
  location: string;
  price: string;
  used: string;
};

export default function NewItems() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const token = useAuthToken();

  useEffect(() => {
    // if (!token) {
    //   setLoading(false);
    //   return;
    // }
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/listings/recent?page=${page}&limit=10&days=30`,
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
          setItems(data?.listings);
          setPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page]);

  return (
    <div>
      {loading ? (
        <p>Loading orders...</p>
      ) : items.length === 0 ? (
        <div>
          <p className="text-center text-[#848484] mt-6">No orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((items) => (
            <Link
              key={items.id}
              href={`/dashboard/items/new/${items.id}`}
              className="bg-white rounded-lg shadow p-4 w-full flex flex-col"
            >
              <Image
                src={items.imageUrl}
                alt="phone"
                width={280}
                height={160}
                className="object-cover rounded mb-3"
              />
              <div className="flex justify-between items-center w-full mb-2">
                <div className="text-sm text-[#037F44] font-normal mb-1 text-center">
                  {items.name}
                </div>
                <div className="flex items-center gap-1 text-xs text-[#1B2559] mb-1">
                  <MapPin size={14} className="text-[#037F44]" />
                  {items.location}
                </div>
              </div>
              <div className="flex items-center justify-between w-full mb-2">
                <p className="text-sm text-[#1B2559]">Price</p>
                <div className="text-sm font-semibold text-[#1B2559] mb-1">
                  ₦{items.price}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <CheckCircle2 size={14} className="text-[#037F44]" />
                {items.used || "Used"}
              </div>
            </Link>
          ))}
        </div>
      )}
      <PageButton page={page} setPage={setPage} totalPages={totalPages} />
    </div>
  );
}
