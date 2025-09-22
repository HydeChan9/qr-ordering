import { useEffect, useState } from "react";

const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://qr-ordering-server-production.up.railway.app"
    : "http://localhost:4000";

function AdminApp() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // 讀取訂單
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 標記付款
  const completeOrder = async (id) => {
    if (!window.confirm("確定要將此訂單標記為已付款嗎？")) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/complete`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Fail (${res.status})`);
      await fetchOrders();
    } catch (err) {
      console.error("❌ Complete order error:", err);
      alert(`標記付款失敗：${err.message || err}`);
    }
  };

  // 刪除訂單
  const deleteOrder = async (id) => {
    if (!window.confirm("刪除後無法復原，確定要刪除嗎？")) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Fail (${res.status})`);
      }
      await fetchOrders();
    } catch (err) {
      console.error("❌ Delete order error:", err);
      alert(`刪除訂單失敗：${err.message || err}`);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fmtCurrency = (n) =>
    Number.isFinite(Number(n))
      ? `$${Number(n).toFixed(2)}`
      : "$0.00";

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto text-white bg-slate-900">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin Dashboard</h1>

      <button
        onClick={fetchOrders}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Refreshing..." : "Refresh Orders"}
      </button>

      {orders.length === 0 ? (
        <p className="text-gray-400">No orders yet</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li
              key={o.id}
              className="p-4 border border-slate-700 rounded bg-slate-800 shadow"
            >
              <div className="flex justify-between">
                <div>
                  <p>
                    <span className="font-semibold">Customer:</span>{" "}
                    {o.customer || "Guest"}
                  </p>
                  <p className="text-sm text-gray-300">
                    Status: {o.status}
                  </p>
                  <p className="text-sm text-gray-400">
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right font-bold text-green-400">
                  {fmtCurrency(o.total)}
                </div>
              </div>

              {/* 商品明細 */}
              {o.items && o.items.length > 0 && (
                <ul className="mt-2 text-sm text-gray-200 list-disc list-inside">
                  {o.items.map((it, idx) => (
                    <li key={idx}>
                      {it.name} × {it.quantity} —{" "}
                      {fmtCurrency(Number(it.price) * Number(it.quantity))}
                    </li>
                  ))}
                </ul>
              )}

              {/* 操作按鈕 */}
              <div className="mt-3 flex space-x-3">
                {o.status !== "PAID" && (
                  <button
                    onClick={() => completeOrder(o.id)}
                    className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
                  >
                    Mark Paid
                  </button>
                )}
                <button
                  onClick={() => deleteOrder(o.id)}
                  className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminApp;
