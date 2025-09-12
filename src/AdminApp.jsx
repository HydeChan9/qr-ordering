import { useEffect, useState } from "react";

const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://qr-ordering-server-production.up.railway.app"
    : "http://localhost:4000";

function AdminApp() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin Dashboard</h1>

      <button
        onClick={fetchOrders}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
      >
        {loading ? "Refreshing..." : "Refresh Orders"}
      </button>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li
              key={o.id}
              className="p-4 border rounded bg-black shadow flex justify-between"
            >
              <div>
                <p>
                  <span className="font-semibold">Customer:</span> {o.customer}
                </p>
                <p>
                  <span className="font-semibold">Items:</span>{" "}
                  {o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">${o.total}</p>
                <p className="text-sm text-gray-500">{o.created_at}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminApp;
