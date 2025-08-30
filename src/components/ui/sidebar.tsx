"use client";
import {
  LayoutDashboard,
  Settings,
  HelpCircle,
  LogOut,
  UserRound,
  UsersRound,
  Clipboard,
  Receipt,
  MapPinCheckInside,
  Activity,
} from "lucide-react";
import React from "react";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
// import { useRole } from "@/hooks/useRole"; // ✅ import your role hook

const menuItems = [
  {
    label: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
  },
  {
    label: "User management",
    url: "/dashboard/user",
    icon: UserRound,
    roles: ["superadmin", "admin"],
  },
  {
    label: "Teams",
    url: "/dashboard/team",
    icon: UsersRound,
    roles: ["superadmin"],
  }, //

  {
    label: "Item management",
    url: "/dashboard/items",
    icon: Clipboard,
    roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
  },
  {
    label: "Transaction oversight",
    url: "/dashboard/wallet",
    icon: Receipt,
    roles: ["superadmin", "supportagent", "verificationofficer"],
  },
  {
    label: "Physical store",
    url: "/dashboard/store",
    icon: MapPinCheckInside,
    roles: ["superadmin", "admin", "verificationofficer"],
  },
  {
    label: "Activity Log",
    url: "/dashboard/activity",
    icon: Activity,
    roles: ["superadmin"],
  },
  {
    label: "Settings",
    url: "/dashboard/setting",
    icon: Settings,
    roles: ["superadmin", "admin", "supportagent", "verificationofficer"],
  },
];

const Sidebar: React.FC = () => {
  // const { role } = useRole(); // ✅ get current user's role
  const [loading, setLoading] = useState(false);

  const handleClick = (url: string) => {
    if (loading) return; // prevent double click
    setLoading(true);
    window.location.href = url; // let Next.js handle navigation
  };

  return (
    <aside className="fixed flex flex-col h-screen w-[280px] bg-white text-[#848484] p-8 shadow-[2px_0_8px_rgba(0,0,0,0.05)] z-100 justify-between">
      <div>
        <Link
          href="/dashboard"
          className="flex justify-center items-center mb-10"
        >
          <Image
            src="/logo.png"
            width={100}
            height={100}
            alt="SwapConnect Logo"
            className="h-10 w-auto"
          />
        </Link>{" "}
        <nav>
          <ul className="list-none">
            {menuItems.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => handleClick(item.url)}
                  disabled={loading}
                  className={`flex items-center w-full py-3 text-base cursor-pointer transition-colors duration-200 ${
                    loading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:text-[#037F44]"
                  }`}
                >
                  <span className="mr-[16px] text-[20px]">
                    <item.icon size={20} />
                  </span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <nav>
        <ul className="list-none">
          <li>
            <Link
              href="/dashboard/support"
              className="flex items-center cursor-pointer py-3 text-[17px] transition-colors duration-200 hover:text-[#037F44]"
            >
              <span className="text-[20px] mr-[16px]">
                <HelpCircle size={20} />
              </span>
              Support
            </Link>
          </li>
          <li>
            <button
              className="flex items-center w-full cursor-pointer py-3 text-[17px] transition-colors duration-200 hover:text-[#037F44] bg-transparent border-none outline-none"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.replace("/");
              }}
            >
              <span className="text-[20px] mr-[16px]">
                <LogOut size={20} />
              </span>
              Log out
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
