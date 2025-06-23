"use client";
// import { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Sidebar from "../../components/ui/sidebar";
import Navbar from "../../components/ui/nav";
import { usePathname } from "next/navigation";

const inter = Inter({
  weight: ["400", "500", "700", "800", "900"],
  subsets: ["latin"],
});

function getTitleFromPath(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/dashboard/products")) return "Products";
  if (pathname.startsWith("/dashboard/orders")) return "Orders";
  if (pathname.startsWith("/dashboard/wallet")) return "Wallet";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "Dashboard";
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const title = getTitleFromPath(pathname);

  return (
    <div className={`${inter.className} flex min-h-screen w-full`}>
      {/* Only render sidebar on md+ screens */}
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
