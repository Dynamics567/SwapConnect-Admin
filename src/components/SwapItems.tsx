import React from "react";
import Image from "next/image";
import { MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type Order = {
  id: string;
  image: string;
  productName: string;
  location: string;
  price: string;
  used: string;
};

const orders: Order[] = [
  {
    id: "1",
    image: "/Card.png",
    productName: "iPhone 14",
    location: "Lagos",
    price: "₦150,000",
    used: "Verified",
  },
  {
    id: "2",
    image: "/Card.png",
    productName: "iPhone 12",
    location: "Abuja",
    price: "₦150,000",
    used: "Verified",
  },
  {
    id: "3",
    image: "/Card.png",
    productName: "iPhone 14",
    location: "Lagos",
    price: "₦150,000",
    used: "Verified",
  },
  {
    id: "4",
    image: "/Card.png",
    productName: "iPhone 12",
    location: "Abuja",
    price: "₦150,000",
    used: "Verified",
  },
  {
    id: "5",
    image: "/Card.png",
    productName: "iPhone 12",
    location: "Abuja",
    price: "₦150,000",
    used: "Verified",
  },
  {
    id: "6",
    image: "/Card.png",
    productName: "iPhone 12",
    location: "Abuja",
    price: "₦150,000",
    used: "Verified",
  },
  {
    id: "7",
    image: "/Card.png",
    productName: "iPhone 12",
    location: "Abuja",
    price: "₦150,000",
    used: "Verified",
  },
  {
    id: "8",
    image: "/Card.png",
    productName: "iPhone 12",
    location: "Abuja",
    price: "₦150,000",
    used: "Verified",
  },

  // Add more orders as needed
];

export default function NewItems() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/dashboard/items/swap/${order.id}`}
            className="bg-white rounded-lg shadow p-4 w-full flex flex-col"
          >
            <Image
              src={order.image}
              alt={order.productName}
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
                {order.location}
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
              {order.used}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
