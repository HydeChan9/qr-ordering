import { useState } from "react";

function CustomerApp() {
  const menu = [
    { id: 1, name: "Latte", price: 5 },
    { id: 2, name: "Cappuccino", price: 6 },
    { id: 3, name: "Green Tea", price: 4 },
  ];

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const addToCart = (item) => setCart((prev) => [...prev, item]);
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const checkout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const checkout = async () => {
  if (cart.length === 0) return;
  setLoading(true);
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: "Guest",
        items: cart.map((i) => i.name),
        total,
      }),
    });
    const data = await res.json();
    alert(`✅ 訂單已送出！ID: ${data.id}`);
    setCart([]);
  } catch (err) {
    console.error("❌ Checkout error:", err);
    alert("送出訂單失敗");
  } finally {
    setLoading(false);
  }
};


      const data = await res.json();
      alert(`✅ 訂單已送出！ID: ${data.id}`);
      setCart([]); // 清空購物車
    } catch (err) {
      console.error("❌ Checkout error:", err);
      alert("送出訂單失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Menu</h1>

      {/* 菜單 */}
      <div className="space-y-4 mb-8">
        {menu.map((item) => (
          <div key={item.id} className="flex justify-between items-center border-b pb-2">
            <span>{item.name}</span>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">${item.price}</span>
              <button
                onClick={() => addToCart(item)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 購物車 */}
      <div className="p-4 border rounded bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Cart</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500">Cart is empty</p>
        ) : (
          <ul className="space-y-1 mb-2">
            {cart.map((item, index) => (
              <li key={index} className="flex justify-between">
                <span>{item.name}</span>
                <span>${item.price}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="font-bold">Total: ${total}</div>
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
