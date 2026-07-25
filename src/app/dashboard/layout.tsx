"use client";
import { Inter } from "next/font/google";
import "../globals.css";
import Sidebar from "../../components/ui/sidebar";
import Navbar from "../../components/ui/nav";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";

const inter = Inter({
  weight: ["400", "500", "700", "800", "900"],
  subsets: ["latin"],
});

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
  if (pathname.startsWith("/dashboard/reports")) return "Reports";
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
    <div className={`${inter.className} flex min-h-screen w-full`}>
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} />
        <main className="flex-1 w-full">{children}</main>
      </div>
    </div>
  );
}
