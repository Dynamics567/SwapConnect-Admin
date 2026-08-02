"use client";
import React, { useState, useEffect } from "react";
import { Bell, Menu, Search } from "lucide-react";
import Link from "next/link";
import { navGroups, STANDALONE_ROLES } from "../../lib/navIndex";
import { useRole } from "../../hooks/useRole";
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

interface NavProps {
  title: string;
}

const Navbar: React.FC<NavProps> = ({ title }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const token = useAuthToken(); // Use the hook
  const { role } = useRole();
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
            window.location.href = "/auth/login";
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
          <button
            onClick={() => window.dispatchEvent(new Event("open-admin-command-palette"))}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-[#848484] hover:border-[#037F44] hover:text-[#037F44] transition text-sm"
            aria-label="Search pages"
          >
            <Search size={16} />
            Search
            <span className="text-[11px] border border-[#e5e7eb] rounded px-1.5 py-0.5 ml-1">Ctrl K</span>
          </button>
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
      {/* Mobile menu overlay -- sourced from the same navGroups used by the
          desktop sidebar (src/lib/navIndex.ts) and role-filtered the same
          way, instead of the separate, stale, incomplete list this used to
          hardcode (it was missing half the app's real pages). */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex md:hidden">
          <div className="bg-white w-72 h-full shadow-lg p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  className="flex items-center gap-1.5 text-[#037F44] font-medium text-sm"
                  onClick={() => {
                    setMenuOpen(false);
                    window.dispatchEvent(new Event("open-admin-command-palette"));
                  }}
                >
                  <Search size={16} /> Search
                </button>
                <button
                  className="text-[#037F44] font-bold"
                  onClick={() => setMenuOpen(false)}
                >
                  Close
                </button>
              </div>
              <ul className="flex flex-col gap-1">
                {navGroups.map((entry) => {
                  if (entry.url) {
                    if (role && !STANDALONE_ROLES.includes(role)) return null;
                    return (
                      <li key={entry.label}>
                        <Link
                          href={entry.url}
                          className="flex items-center gap-3 py-2 text-[#353535] text-[15px] font-medium hover:text-[#037F44] transition"
                          onClick={() => setMenuOpen(false)}
                        >
                          <entry.icon size={19} />
                          {entry.label}
                        </Link>
                      </li>
                    );
                  }
                  const children = role
                    ? (entry.children ?? []).filter((c) => c.roles.includes(role))
                    : (entry.children ?? []);
                  if (children.length === 0) return null;
                  return (
                    <li key={entry.label} className="mt-3 first:mt-0">
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#c0c0c0] mb-1">
                        <entry.icon size={13} /> {entry.label}
                      </p>
                      <ul className="flex flex-col gap-1 pl-1">
                        {children.map((child) => (
                          <li key={child.label}>
                            <Link
                              href={child.url}
                              className="flex items-center gap-3 py-1.5 text-[#353535] text-[14px] font-medium hover:text-[#037F44] transition"
                              onClick={() => setMenuOpen(false)}
                            >
                              <child.icon size={17} />
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
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
