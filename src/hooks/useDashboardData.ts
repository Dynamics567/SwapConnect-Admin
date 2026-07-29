import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuthToken } from "@/hooks/useAuthToken";

interface RevenuePoint {
  date: string;
  amount: number;
}

interface SignupPoint {
  date: string;
  count: number;
}

interface OrderProduct {
  id: number;
  name: string;
  price: string;
  description: string;
  Category: { id: number; name: string };
}

interface Order {
  id: number;
  address: string;
  paymentMode: string;
  totalAmount: string;
  createdAt: string;
  status: string;
  OrderProducts: OrderProduct[];
}

interface Totals {
  users: number;
  products: number;
  activeSwaps: number;
  completedOrders: number;
  recentSignups: number;
  newListings: number;
  totalRevenue: string;
}

interface DashboardData {
  admin: { role: string } | null;
  dashboard: {
    totals: Totals;
    revenueData: RevenuePoint[];
    signupsData: SignupPoint[];
    recentOrders: Order[];
  } | null;
}

export function useDashboardData() {
  const token = useAuthToken();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDashboard = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/get-dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await response.json();
        if (!cancelled) setData(json);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        if (!cancelled) setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return { data, loading, error };
}
