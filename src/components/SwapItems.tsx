import React from "react";
import Image from "next/image";
import { MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";

type Order = {
  id: string;
  imageUrl: string;
  name: string;
  location: string;
  price: string;
  used: string;
};

// const orders: Order[] = [
//   {
//     id: "1",
//     image: "/Card.png",
//     productName: "iPhone 14",
//     location: "Lagos",
//     price: "₦150,000",
//     used: "Verified",
//   },
//   {
//     id: "2",
//     image: "/Card.png",
//     productName: "iPhone 12",
//     location: "Abuja",
//     price: "₦150,000",
//     used: "Verified",
//   },
//   {
//     id: "3",
//     image: "/Card.png",
//     productName: "iPhone 14",
//     location: "Lagos",
//     price: "₦150,000",
//     used: "Verified",
//   },
//   {
//     id: "4",
//     image: "/Card.png",
//     productName: "iPhone 12",
//     location: "Abuja",
//     price: "₦150,000",
//     used: "Verified",
//   },
//   {
//     id: "5",
//     image: "/Card.png",
//     productName: "iPhone 12",
//     location: "Abuja",
//     price: "₦150,000",
//     used: "Verified",
//   },
//   {
//     id: "6",
//     image: "/Card.png",
//     productName: "iPhone 12",
//     location: "Abuja",
//     price: "₦150,000",
//     used: "Verified",
//   },
//   {
//     id: "7",
//     image: "/Card.png",
//     productName: "iPhone 12",
//     location: "Abuja",
//     price: "₦150,000",
//     used: "Verified",
//   },
//   {
//     id: "8",
//     image: "/Card.png",
//     productName: "iPhone 12",
//     location: "Abuja",
//     price: "₦150,000",
//     used: "Verified",
//   },

//   // Add more orders as needed
// ];

export default function NewItems() {
  const [swap, setSwap] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const token = useAuthToken();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/swaps/active`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        // console.log("Swap Data:", data);
        if (Array.isArray(data.swaps)) {
          setSwap(data.swaps);
        } else {
          setSwap([]);
        }
      } catch {
        setSwap([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);
  return (
    <div>
      {loading ? (
        <p>Loading orders...</p>
      ) : swap.length === 0 ? (
        <div>
          <p className="text-center text-[#848484] mt-6">No orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {swap.map((swap) => (
            <Link
              key={swap.id}
              href={`/dashboard/items/swap/${swap.id}`}
              className="bg-white rounded-lg shadow p-4 w-full flex flex-col"
            >
              <Image
                src={swap.imageUrl}
                alt={swap.name}
                width={280}
                height={160}
                className="object-cover rounded mb-3"
              />
              <div className="flex justify-between items-center w-full mb-2">
                <div className="text-sm text-[#037F44] font-semibold mb-1 text-center">
                  Current Bid: $100
                </div>
                <div className="flex items-center gap-1 text-xs text-[#1B2559] mb-1">
                  <MapPin size={14} className="text-[#037F44]" />
                  {swap.location}
                </div>
              </div>
              <div className="flex items-center justify-between w-full mb-2">
                <p className="text-sm text-[#1B2559]">Swap offer</p>
                <div className="text-sm font-semibold text-[#1B2559] mb-1">
                  Iphone 8{" "}
                </div>
              </div>
              <div className="flex items-center justify-between w-full mb-2">
                <p className="text-sm text-[#1B2559]">Listed item</p>
                <div className="text-sm font-semibold text-[#1B2559] mb-1">
                  Iphone 11
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#037F44]">
                <CheckCircle2 size={14} className="text-[#037F44]" />
                {swap.used}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
