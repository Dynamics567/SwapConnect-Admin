"use client";
import { HelpCircle, LogOut, ChevronDown } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { navGroups, STANDALONE_ROLES, type NavLeaf } from "@/lib/navIndex";

const Sidebar: React.FC = () => {
  const { role } = useRole();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [userExpanded, setUserExpanded] = useState(false);

  const activeGroupLabel = useMemo(() => {
    if (!pathname) return null;
    const group = navGroups.find((g) =>
      g.children?.some((c) => c.url.split("?")[0] === pathname)
    );
    return group?.label ?? null;
  }, [pathname]);

  // Auto-expand whichever group contains the current page, but only take
  // over the open group until the admin manually toggles one themselves.
  useEffect(() => {
    if (!userExpanded && activeGroupLabel) setExpanded(activeGroupLabel);
  }, [activeGroupLabel, userExpanded]);

  const handleClick = (url: string) => {
    if (loading) return; // prevent double click
    setLoading(true);
    window.location.href = url; // let Next.js handle navigation
  };

  const visibleChildren = (children: NavLeaf[]) =>
    role ? children.filter((c) => c.roles.includes(role)) : children;

  return (
    <aside className="sticky top-0 flex flex-col h-screen w-[280px] shrink-0 bg-white text-[#848484] p-8 shadow-[2px_0_8px_rgba(0,0,0,0.05)] z-20 justify-between overflow-y-auto">
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
        </Link>
        <nav>
          <ul className="list-none">
            {navGroups.map((entry) => {
              // Standalone entry: direct link, no expand/collapse.
              if (entry.url) {
                if (role && !STANDALONE_ROLES.includes(role)) return null;
                const isActive = pathname === entry.url;
                return (
                  <li key={entry.label}>
                    <button
                      onClick={() => handleClick(entry.url as string)}
                      disabled={loading}
                      className={`flex items-center w-full py-3 text-base cursor-pointer transition-colors duration-200 ${
                        loading
                          ? "opacity-50 cursor-not-allowed"
                          : isActive
                            ? "text-[#037F44] font-semibold"
                            : "hover:text-[#037F44]"
                      }`}
                    >
                      <span className="mr-[16px] text-[20px]">
                        <entry.icon size={20} />
                      </span>
                      {entry.label}
                    </button>
                  </li>
                );
              }

              // Group entry: filter children by role, hide the whole group
              // if nothing inside it is visible to this role.
              const children = visibleChildren(entry.children ?? []);
              if (children.length === 0) return null;
              const isOpen = expanded === entry.label;

              return (
                <li key={entry.label}>
                  <button
                    onClick={() => {
                      setUserExpanded(true);
                      setExpanded(isOpen ? null : entry.label);
                    }}
                    className="flex items-center w-full py-3 text-base cursor-pointer transition-colors duration-200 hover:text-[#037F44]"
                    aria-expanded={isOpen}
                  >
                    <span className="mr-[16px] text-[20px]">
                      <entry.icon size={20} />
                    </span>
                    <span className="flex-1 text-left">{entry.label}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <ul className="list-none ml-[36px] border-l border-[#eee] pl-3 mb-1">
                      {children.map((child) => {
                        const isActive = pathname === child.url.split("?")[0];
                        return (
                          <li key={child.label}>
                            <button
                              onClick={() => handleClick(child.url)}
                              disabled={loading}
                              className={`flex items-center w-full py-2.5 text-[14px] cursor-pointer transition-colors duration-200 ${
                                loading
                                  ? "opacity-50 cursor-not-allowed"
                                  : isActive
                                    ? "text-[#037F44] font-semibold"
                                    : "hover:text-[#037F44]"
                              }`}
                            >
                              <span className="mr-[10px] text-[16px]">
                                <child.icon size={16} />
                              </span>
                              {child.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
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
