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
} from "lucide-react";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const menuItems = [
  { label: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { label: "User management", url: "/dashboard/user", icon: UserRound },
  { label: "Teams", url: "/dashboard/team", icon: UsersRound }, //

  { label: "Item management", url: "/dashboard/items", icon: Clipboard },
  { label: "Transaction oversight", url: "/dashboard/wallet", icon: Receipt },
  {
    label: "Physical store",
    url: "/dashboard/store",
    icon: MapPinCheckInside,
  },
  { label: "Settings", url: "/dashboard/setting", icon: Settings },
];

const supportItems = [
  { label: "Support", url: "/dashboard/support", icon: HelpCircle },
  { label: "Log out", url: "/settings", icon: LogOut },
];

const Sidebar: React.FC = () => (
  <aside className="fixed flex flex-col h-screen w-[280px] bg-white text-[#848484] p-8 shadow-[2px_0_8px_rgba(0,0,0,0.05)] z-100 justify-between">
    <div>
      <div className="flex justify-center items-center mb-10">
        <Image
          src="/logo.png"
          width={100}
          height={100}
          alt="SwapConnect Logo"
          className="h-10 w-auto"
        />
      </div>{" "}
      <nav>
        <ul className="list-none">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.url}
                className="flex items-center cursor-pointer py-3  text-base transition-colors duration-200 hover:text-[#037F44]"
              >
                <span className="mr-[16px] text-[20px]">
                  <item.icon size={20} />
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
    <nav>
      <ul className="list-none">
        {supportItems.map((item) => (
          <li key={item.label}>
            <Link
              href={item.url}
              className="flex items-center cursor-pointer py-3 text-[17px] transition-colors duration-200 hover:text-[#037F44]"
            >
              <span className="text-[20px] mr-[16px]">
                <item.icon size={20} />
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  </aside>
);

export default Sidebar;
