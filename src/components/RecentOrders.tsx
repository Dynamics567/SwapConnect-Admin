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

      {/* Mobile/Card View */}

      <div className="block md:hidden bg-white rounded shadow p-4">
        <h3 className="font-semibold text-[#353535] mb-4 text-lg">
          Recent Orders
        </h3>
        <div className="flex flex-col gap-4">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-4 shadow-sm bg-[#F7F8FB]"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-[#353535]">
                  {order.product}
                </span>
                <span className="font-bold text-[#037F44]">{order.price}</span>
              </div>
              <div className="text-xs text-[#505050] mb-1">
                {order.description}
              </div>
              <div className="flex justify-between items-center text-xs text-[#BEBEBE]">
                <span>{order.category}</span>
                <span>{order.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RecentOrders;
