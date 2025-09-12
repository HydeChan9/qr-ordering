import { useState, useEffect } from "react";

function CustomerApp({ merchantId = 1 }) {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE =
  process.env.NODE_ENV === "production"
    ? 
    "https://qr-ordering-server-production.up.railway.app": "http://localhost:4000";

// 🚀 載入商品清單 (包含圖片)
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_BASE}/merchant?merchantId=${merchantId}`);
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        setMenu(data);
      } catch (err) {
        console.warn("⚠️ 使用預設商品清單:", err);
        setMenu([
          { id: 1, name: "Latte", price: 5, imageUrl: "/images/coffeimage202.png" },
          { id: 2, name: "Cappuccino", price: 6, imageUrl: "/images/coffeimage202.png" },
          { id: 3, name: "Green Tea", price: 4, imageUrl: "/images/coffeimage202.png" },
        ]);
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
        .map((p) =>
          p.id === id ? { ...p, quantity: p.quantity - 1 } : p
        )
        .filter((p) => p.quantity > 0)
    );
  };

  // 💰 總金額
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ✅ 結帳
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
            price: i.price,
          })),
          total,
        }),
      });
      const data = await res.json();
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
    <div className="min-h-screen bg-black p-6 max-w-lg mx-auto ">
      <h1 className="text-2xl font-bold mb-6 text-center">Menu</h1>

      {/* 菜單 */}
      <div className="space-y-6 mb-8">
        {menu.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center border-b pb-4"
          >
            <div className="flex items-center space-x-4">
              <img
                src={item.imageUrl || "./public/images/coffeimage202.png"}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-gray-600">${item.price}</div>
              </div>
            </div>
            <button
              onClick={() => addToCart(item)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {/* 購物車 */}
      <div className="p-4 border rounded bg-black shadow">
        <h2 className="text-xl font-semibold mb-2">Cart</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500">Cart is empty</p>
        ) : (
          <ul className="space-y-2 mb-2">
            {cart.map((item) => (
              <li key={item.id} className="flex justify-between items-center">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <div className="flex items-center space-x-2">
                  <span>${item.price * item.quantity}</span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    -
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="font-bold bg-black">Total: ${total}</div>
        <button
          onClick={checkout}
          disabled={cart.length === 0 || loading}
          className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
        >
          {loading ? "Processing..." : "Checkout"}
        </button>
      </div>
    </div>
  );
}

export default CustomerApp;