"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TradeInsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/items?tab=trade-ins");
  }, [router]);

  return null;
}
