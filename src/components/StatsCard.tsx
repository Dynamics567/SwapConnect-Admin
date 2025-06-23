import React from "react";
import { CircleDollarSign, Store } from "lucide-react";

const stats = [
  {
    label: "Revenue",
    value: "$12,500",
    icon: <CircleDollarSign size={24} className="text-[#037F44]" />,
  },
  {
    label: "Total Users",
    value: "1,200",
    icon: <Store size={24} className="text-[#037F44]" />,
  },
  {
    label: "Total Items Listed",
    value: "350",
    icon: <Store size={24} className="text-[#037F44]" />,
  },
  {
    label: "Active Swaps",
    value: "42",
    icon: <Store size={24} className="text-[#037F44]" />,
  },
];

function StatsCard() {
  return (
    <div>
      <div className="flex gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white w-[244px] h-[90px] rounded-lg shadow p-6 flex flex-col justify-center"
          >
            <div className="flex items-center gap-3">
              <span className="bg-[#F7F8FB] rounded-full p-2 flex items-center justify-center">
                {stat.icon}
              </span>
              <div>
                <div className="text-sm text-[#BEBEBE] mb-1">{stat.label}</div>
                <div className="text-2xl font-bold text-[#353535]">
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatsCard;
