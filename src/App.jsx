import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomerApp from "./CustomerApp";
import AdminApp from "./AdminApp";
import HeadOfficeApp from "./HeadOfficeApp";

function App() {
  const [mode, setMode] = useState("customer"); // customer / admin / headoffice
  const [orders, setOrders] = useState([]);
  const [merchantId, setMerchantId] = useState(1);

  // 讀取模式
  useEffect(() => {
    const savedMode = localStorage.getItem("appMode");
    if (savedMode) setMode(savedMode);
  }, []);

  // 讀取 merchantId（URL -> localStorage -> 預設 1）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl =
      Number(params.get("m")) ||
      Number(params.get("merchantId"));

    if (Number.isFinite(fromUrl) && fromUrl > 0) {
      setMerchantId(fromUrl);
      localStorage.setItem("merchantId", String(fromUrl));
    } else {
      const saved = Number(localStorage.getItem("merchantId"));
      setMerchantId(Number.isFinite(saved) && saved > 0 ? saved : 1);
    }
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem("appMode", newMode);
  };

  // （僅前端模擬用）本地累加 orders，不影響後端
  const handleCheckout = (cart, total) => {
    const newOrder = {
      id: orders.length + 1,
      customer: "Guest",
      items: cart.map((i) => i.name),
      total,
    };
    setOrders((prev) => [...prev, newOrder]);
    alert("✅ 訂單已送出！");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* 頂部品牌導航條 + 顯示當前商戶ID（除錯方便） */}
      <nav className="z-20 bg-black/80 backdrop-blur border-b border-blue-800 shadow-lg">
        <div className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-400/50">
              hi
            </div>
            <span className="text-xl font-bold tracking-wide text-blue-300">
              Novapay Hub
            </span>
            <span className="ml-3 text-xs px-2 py-0.5 rounded bg-slate-800 text-blue-200">
              Merchant #{merchantId}
            </span>
          </div>

          <div className="flex space-x-6">
            {[
              { key: "customer", label: "Customer" },
              { key: "admin", label: "Admin" },
              { key: "headoffice", label: "Head Office" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleModeChange(tab.key)}
                className={`relative px-5 py-2 rounded-lg font-medium transition ${
                  mode === tab.key
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                    : "bg-slate-800/70 text-gray-300 hover:bg-blue-700/60 hover:text-white"
                }`}
              >
                {tab.label}
                {mode === tab.key && (
                  <span className="absolute left-0 bottom-0 h-0.5 w-full bg-blue-400 rounded-t"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="flex-grow flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {mode === "customer" && (
            <motion.div
              key="customer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-4xl"
            >
              {/* ✅ 把 merchantId 傳下去 */}
              <CustomerApp merchantId={merchantId} onCheckout={handleCheckout} />
            </motion.div>
          )}
          {mode === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-4xl"
            >
              {/* 若你的 Admin API 也需要商戶篩選，可一併傳下去使用 */}
              <AdminApp merchantId={merchantId} orders={orders} />
            </motion.div>
          )}
          {mode === "headoffice" && (
            <motion.div
              key="headoffice"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-5xl"
            >
              <HeadOfficeApp />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
