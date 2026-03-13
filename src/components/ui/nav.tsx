"use client";
import React, { useState, useEffect } from "react";
import {
  Bell,
  Menu,
  LayoutDashboard,
  UserRound,
  UsersRound,
  Clipboard,
  Receipt,
  Settings,
  MapPinCheckInside,
  HelpCircle,
  Activity,
} from "lucide-react";
import Link from "next/link";
// import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "../../lib/config";
import { useAuthToken } from "../../hooks/useAuthToken";

interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: string;
}

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
  {
    label: "Support",
    url: "/dashboard/support",
    icon: HelpCircle,
    roles: ["supportagent"],
  },
];

interface NavProps {
  title: string;
}

const Navbar: React.FC<NavProps> = ({ title }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const token = useAuthToken(); // Use the hook
  // const hasAvatar = !!user?.avatar && user.avatar.trim() !== "";

  useEffect(() => {
    // console.log("Token in Navbar:", token); // Debug line

    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setUserLoading(false);

        return;
      }
      setUserLoading(true);
      setUserError(null);
      try {
        const response = await fetch(`${API_URL}/api/admin/get-dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            setUserError("Unauthorized");

            // const currentUrl = window.location.href;
            // window.location.href = `http://localhost:3000/auth/login?redirect=${encodeURIComponent(
            //   currentUrl
            // )}`;
            return;
          } else {
            setUserError(`Error: ${response.status}`);
          }
          setUser(null);
          setUserLoading(false);
          return;
        }
        const data = await response.json();
        // console.log("API Respone", data);
        if (data.admin && typeof data.admin === "object") {
          const userData = {
            ...data.admin,
            name: `${data.admin.firstName} ${data.admin.lastName}`,
            // avatar: data.admin.avatar || "",
            email: data.admin.email || "",
            role: data.admin.role || "",
          };
          setUser(userData);
          // console.log("data:", data);
        } else {
          setUserError("Invalid user data");
          console.log("Unexpected user data format:", data);
          setUser(null);
        }
      } catch (error) {
        setUserError("Failed to fetch user");
        console.log("Error fetching user:", error);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUser();
  }, [token]);
  const displayName = user?.name || "User";
  // const displayEmail = user?.email || "";
  // const displayAvatar = user?.avatar || ""; // Remove Elipse 5.svg/png fallback

  function getInitials(name: string) {
    if (!name) return "OO";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return (
    <nav className="fixed top-0 right-0 left-0 h-[85px] bg-white flex items-center justify-between md:left-[280px] border-b px-4 md:px-8 z-[101]">
      {/* Desktop: Title, notification, user info */}
      <div className="hidden md:flex items-center justify-between w-full">
        <h2 className="text-[24px] font-bold text-[#353535]">{title}</h2>
        <div className="flex items-center gap-[32px]">
          <button className="flex cursor-pointer" aria-label="Notifications">
            <Bell size={24} color="#848484" />
          </button>
          <div className="h-8 w-px bg-gray-300" />

          <div className="flex items-center gap-[12px]">
            <span className="font-normal text-[#3E344F] text-[16px]">
              {userLoading ? "Loading..." : userError ? "Error" : displayName}
            </span>

            {/* Show initials if avatar is null, else show image */}
            <div
              className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "#00B9AE" }}
            >
              {getInitials(user?.name ?? "")}
            </div>

            {/* <span className="text-[13px] text-[#037F44]">
              {userLoading ? "" : userError ? "" : displayEmail}
            </span> */}
          </div>
        </div>
      </div>
      {/* Mobile: user, image/initials, bell, hamburger */}
      <div className="flex md:hidden items-center justify-between w-full">
        <div className="flex items-center gap-1 md:gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base"
            style={{ background: "#00B9AE" }}
          >
            {getInitials(user?.name ?? "")}
          </div>
          <span className="font-normal text-[#353535] text-[16px]">
            {userLoading ? "Loading..." : userError ? "Error" : displayName}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex cursor-pointer" aria-label="Notifications">
            <Bell size={22} color="#848484" />
          </button>
          <button
            className="flex cursor-pointer"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={28} color="#353535" />
          </button>
        </div>
      </div>
      {/* Example mobile menu overlay (implement your sidebar here if needed) */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex md:hidden">
          <div className="bg-white w-64 h-full shadow-lg p-6 flex flex-col justify-between">
            <div>
              <button
                className="mb-4 text-[#037F44] font-bold"
                onClick={() => setMenuOpen(false)}
              >
                Close
              </button>
              <ul className="flex flex-col gap-4">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 text-[#353535] text-[16px] font-medium hover:text-[#037F44] transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <item.icon size={20} />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="mt-8 w-full py-2 bg-[#F87171] text-white rounded font-semibold hover:bg-[#d32f2f] transition"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/";
              }}
            >
              Logout
            </button>
          </div>
          <div className="flex-1" onClick={() => setMenuOpen(false)} />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
