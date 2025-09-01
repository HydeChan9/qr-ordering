import { useState } from "react";
import CustomerApp from "./CustomerApp";
import AdminApp from "./AdminApp";

function App() {
  const [mode, setMode] = useState("customer"); // customer/admin
  const [orders, setOrders] = useState([]);

  // 新增訂單
  const handleCheckout = (cart, total) => {
    const newOrder = {
      id: orders.length + 1,
      customer: "Guest", // 這裡可以之後加輸入名字或手機號
      items: cart.map((i) => i.name),
      total,
    };
    setOrders((prev) => [...prev, newOrder]);
    alert("✅ 訂單已送出！");
  };

  return (
    <div>
      {/* 切換模式 */}
      <div className="flex justify-center space-x-4 p-4 bg-gray-100 shadow">
        <button
          onClick={() => setMode("customer")}
          className={`px-4 py-2 rounded ${mode === "customer" ? "bg-green-600 text-white" : "bg-gray-300"}`}
        >
          Customer
        </button>
        <button
          onClick={() => setMode("admin")}
          className={`px-4 py-2 rounded ${mode === "admin" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
        >
          Admin
        </button>
      </div>

      {mode === "customer" 
        ? <CustomerApp onCheckout={handleCheckout} /> 
        : <AdminApp orders={orders} />}
    </div>
  );
}

export default App;
