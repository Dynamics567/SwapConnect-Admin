import React, { useEffect, useState } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { API_URL } from "@/lib/config";

interface Category {
  id: number;
  name: string;
}
interface OrderProduct {
  id: number;
  name: string;
  price: string;
  description: string;
  Category: Category;
  // add more fields if needed
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

function RecentOrders() {
  const token = useAuthToken();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/get-dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        // console.log("Recent Orders data:", data);
        if (data?.dashboard?.recentOrders) {
          setOrders(data.dashboard.recentOrders || []);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Failed to fetch recent orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  return (
    <div>
      {loading ? (
        <div className="w-full py-20 flex justify-center items-center">
          <p className="text-gray-500 font-medium text-sm">
            Loading recent orders...
          </p>
        </div>
      ) : (
        <>
          {/* Desktop/Table View */}
          <div className="hidden md:block bg-white rounded shadow p-6 overflow-x-auto">
            <h3 className="font-semibold text-[#353535] mb-4 text-lg">
              Recent Orders
            </h3>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left bg-[#CCDCD4] text-gray-500">
                  <th className="py-2 pl-4 text-[#505050] pr-4">ORDER ID</th>
                  <th className="py-2 text-[#505050] pr-4">PRODUCT NAME</th>
                  <th className="py-2  text-[#505050] pr-4">CATEGORY</th>
                  <th className="py-2  text-[#505050] pr-4">DESCRIPTION</th>
                  <th className="py-2  text-[#505050] pr-4">PRICE</th>
                  <th className="py-2 text-[#505050]">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) =>
                  order.OrderProducts?.map((product) => (
                    <tr key={`${order.id}-${product.id}`} className="border-t">
                      <td className="py-2 pl-4 text-[#434343] pr-4">
                        {order.id}
                      </td>
                      <td className="py-2 text-[#434343] pr-4">
                        {product.name}
                      </td>
                      <td className="py-2 text-[#434343] pr-4">
                        {product.Category.name}
                      </td>
                      <td className="py-2 text-[#434343] pr-4">
                        {product.description}
                      </td>
                      <td className="py-2 text-[#434343] pr-4">
                        ₦{product.price}
                      </td>
                      <td className="py-2 text-[#434343]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile/Card View */}
          <div className="block md:hidden bg-white rounded shadow p-4">
            <h3 className="font-semibold text-[#353535] mb-4 text-lg">
              Recent Orders
            </h3>
            <div className="flex flex-col gap-4">
              {orders.map((order) =>
                order.OrderProducts?.map((product) => (
                  <div
                    key={`${order.id}-${product.id}`}
                    className="border rounded-lg p-4 shadow-sm bg-[#F7F8FB]"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-[#353535]">
                        {product.name}
                      </span>
                      <span className="font-bold text-[#037F44]">
                        ₦{product.price}
                      </span>
                    </div>
                    <div className="text-xs text-[#505050] mb-1">
                      Payment: {order.paymentMode}
                    </div>
                    <div className="flex justify-between items-center text-xs text-[#BEBEBE]">
                      <span>Status: {order.status}</span>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RecentOrders;
