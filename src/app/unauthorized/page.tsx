// app/unauthorized/page.tsx or pages/unauthorized.tsx
"use client";
import Navbar from "@/components/ui/nav";
import Sidebar from "@/components/ui/sidebar";

export default function UnauthorizedPage() {
  return (
    <>
      <Navbar title="Unauthourized" />
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-3">
            403 - Access Denied
          </h1>
          <p className="text-gray-600">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    </>
  );
}
