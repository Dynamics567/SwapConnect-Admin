import React from "react";

const recentOrders = [
  {
    id: "ORD-001",
    product: "iPhone 14",
    category: "Electronics",
    description: "Latest Apple smartphone.",
    price: "$900",
    date: "2025-06-20",
  },
  {
    id: "ORD-002",
    product: "MacBook Pro",
    category: "Computers",
    description: "Apple laptop, 16-inch, M3 chip.",
    price: "$2,000",
    date: "2025-06-19",
  },
  {
    id: "ORD-003",
    product: "Samsung TV",
    category: "Electronics",
    description: "55-inch 4K UHD Smart TV.",
    price: "$700",
    date: "2025-06-18",
  },
];

function RecentOrders() {
  return (
    <div>
      <div className="bg-white rounded shadow p-6 overflow-x-auto">
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
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="py-2 pl-4 text-[#434343] pr-4">{order.id}</td>
                <td className="py-2 text-[#434343] pr-4">{order.product}</td>
                <td className="py-2 text-[#434343] pr-4">{order.category}</td>
                <td className="py-2 text-[#434343] pr-4">
                  {order.description}
                </td>
                <td className="py-2 text-[#434343] pr-4">{order.price}</td>
                <td className="py-2 text-[#434343]">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentOrders;
