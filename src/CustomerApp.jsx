import { useState, useEffect, useMemo } from "react";

/* ✅ 本地資產：最不會出路徑問題的作法 */
import latteImg from "./assets/latte.png";
import cappuccinoImg from "./assets/latte.png";
import greenTeaImg from "./assets/latte.png";
import placeholderImg from "./assets/latte.png"; // 準備一張備援圖

/* 產品名稱 → 本地圖片對應表（後端沒給 imageUrl 時使用） */
const localImageMap = {
  latte: latteImg,
  "cappuccino": cappuccinoImg,
  "green tea": greenTeaImg,
};

const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://qr-ordering-server-production.up.railway.app"
    : "http://localhost:4000";

function CustomerApp({ merchantId = 1 }) {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🚀 載入商品清單（後端目前只回 id,name,price；沒有 imageUrl）
  useEffect(() => {
  const fetchMenu = async () => {
    try {
      const url = `${API_BASE}/merchant?merchantId=${Number(merchantId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();

      const withImages = data.map((p) => {
        const key = String(p.name || "").toLowerCase().trim();
        const localImg = localImageMap[key] || null;
        return {
          ...p,
          id: Number(p.id),
          price: Number(p.price) || 0,
          imageUrl: p.imageUrl || localImg || placeholderImg,
        };
      });

      setMenu(withImages);
    } catch (err) {
      console.error("⚠️ 菜單載入失敗：", err);
      alert("菜單載入失敗，請稍後再試");
    }
  };
  fetchMenu();
}, [merchantId]);


  // ➕ 加入購物車（同商品數量累加）
  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // ➖ 從購物車刪除一件
  const removeFromCart = (id) => {
    setCart((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, quantity: p.quantity - 1 } : p))
        .filter((p) => p.quantity > 0)
    );
  };

  // 💰 總金額（格式化）
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

  // ✅ 結帳（不傳單價，後端會用 DB 價格）
  const checkout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/merchant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          customer: "Guest",
          items: cart.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
          })),
          // total 可以不傳或傳目前計算值，後端可忽略或用於校驗
          total,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed");
      alert(`✅ 訂單已送出！ID: ${data.orderId}`);
      setCart([]);
    } catch (err) {
      console.error("❌ Checkout error:", err);
      alert("送出訂單失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Menu</h1>

      {/* 菜單 */}
      <div className="space-y-6 mb-8">
        {menu.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center border-b border-slate-800 pb-4"
          >
            <div className="flex items-center space-x-4">
              <img
                src={item.imageUrl || placeholderImg}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = placeholderImg;
                }}
              />
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-gray-300">${fmt(item.price)}</div>
              </div>
            </div>
            <button
              onClick={() => addToCart(item)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {/* 購物車 */}
      <div className="p-4 border border-slate-800 rounded bg-slate-900/40 shadow">
        <h2 className="text-xl font-semibold mb-2">Cart</h2>
        {cart.length === 0 ? (
          <p className="text-gray-400">Cart is empty</p>
        ) : (
          <ul className="space-y-2 mb-2">
            {cart.map((item) => (
              <li key={item.id} className="flex justify-between items-center">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <div className="flex items-center space-x-2">
                  <span>${fmt(item.price * item.quantity)}</span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    -
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="font-bold">Total: ${fmt(total)}</div>
        <button
          onClick={checkout}
          disabled={cart.length === 0 || loading}
          className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600"
        >
          {loading ? "Processing..." : "Checkout"}
        </button>
      </div>
    </div>
  );
}

export default CustomerApp;
