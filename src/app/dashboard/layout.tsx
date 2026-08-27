"use client";
import "../globals.css";
import Sidebar from "../../components/ui/sidebar";
import Navbar from "../../components/ui/nav";
import CommandPalette from "../../components/ui/CommandPalette";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";

function getTitleFromPath(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/dashboard/user")) return "User Management";
  if (pathname.startsWith("/dashboard/team")) return "Teams";
  if (pathname.startsWith("/dashboard/items")) return "Item Management";
  if (pathname.startsWith("/dashboard/wallet")) return "Transaction Oversight";
  if (pathname.startsWith("/dashboard/store")) return "Physical Store";
  if (pathname.startsWith("/dashboard/trade-ins")) return "Trade-Ins";
  if (pathname.startsWith("/dashboard/disputes")) return "Dispute Resolution";
  if (pathname.startsWith("/dashboard/seller-verification")) return "Seller Verification";
  if (pathname.startsWith("/dashboard/coupons")) return "Coupons & Campaigns";
  if (pathname.startsWith("/dashboard/blog/posts")) return "Blog Posts";
  if (pathname.startsWith("/dashboard/blog/categories")) return "Categories & Tags";
  if (pathname.startsWith("/dashboard/blog/media")) return "Media Library";
  if (pathname.startsWith("/dashboard/blog")) return "Content & Blog";
  if (pathname.startsWith("/dashboard/reports")) return "Reports";
  if (pathname.startsWith("/dashboard/ai-studio")) return "AI Studio";
  if (pathname.startsWith("/dashboard/risk")) return "Risk & Fraud Review";
  if (pathname.startsWith("/dashboard/activity")) return "Activity Log";
  if (pathname.startsWith("/dashboard/setting")) return "Settings";
  if (pathname.startsWith("/dashboard/support")) return "Support";
  return "Dashboard";
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthToken();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/auth/login");
    }
  }, [hydrated, token, router]);

  if (!hydrated || !token) return null;

  const title = getTitleFromPath(pathname);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-screen w-full bg-[#F8F9FB]">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-col min-w-0">
        <Navbar title={title} />
        <main className="flex-1 min-w-0 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
