import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());



// ✅ MySQL 連線池（讀 .env）
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "p2314577",
  database: process.env.DB_NAME || "hinovapay",
});

// 📌 GET /merchant?merchantId=1 → 查商品
app.get("/merchant", async (req, res) => {
  const { merchantId } = req.query;
  try {
    const [rows] = await db.query(
      "SELECT ProductID AS id, Name AS name, Price AS price FROM Products WHERE MerchantID = ? AND Status = 'ACTIVE'",
      [merchantId]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch products error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 POST /merchant → 建立訂單（單價以資料庫為準）
// 📌 POST /merchant → 建立訂單（單價以 DB 為準，寫入 OrderDate）
app.post("/merchant", async (req, res) => {
  const { merchantId, customer, items = [] } = req.body;
  if (!merchantId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "merchantId & items are required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 先建訂單（Total 先 0，OrderDate 用 NOW()）
    const [orderResult] = await conn.query(
      "INSERT INTO Orders (MerchantID, Customer, TotalAmount, Status, OrderDate) VALUES (?, ?, 0, 'PENDING', NOW())",
      [Number(merchantId), customer || null]
    );
    const orderId = orderResult.insertId;

    // 2) 寫明細（用 DB 價格）＋ 累計總額
    let runningTotal = 0;
    for (const it of items) {
      const productId = Number(it.productId ?? it.id);
      const qty = Number(it.quantity ?? 1);

      if (!Number.isFinite(productId) || productId <= 0) {
        throw new Error(`INVALID_PRODUCT_ID: ${it.productId}`);
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error(`INVALID_QUANTITY for productId=${productId}: ${it.quantity}`);
      }

      const [[prod]] = await conn.query(
        "SELECT Price FROM Products WHERE ProductID=? AND MerchantID=? AND Status='ACTIVE' LIMIT 1",
        [productId, Number(merchantId)]
      );
      if (!prod) {
        throw new Error(`PRODUCT_NOT_FOUND_OR_INACTIVE: productId=${productId}, merchantId=${merchantId}`);
      }

      await conn.query(
        "INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice) VALUES (?, ?, ?, ?)",
        [orderId, productId, qty, prod.Price]
      );
      runningTotal += Number(prod.Price) * qty;
    }

    // 3) 回寫總額
    await conn.query("UPDATE Orders SET TotalAmount=? WHERE OrderID=?", [runningTotal, orderId]);

    await conn.commit();
    res.json({ orderId, success: true, total: runningTotal });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Insert order error:", err);
    // 開發期：把真正錯誤回給前端/ curl，便於定位
    res.status(400).json({ error: err.message || "Bad request" });
  } finally {
    conn.release();
  }
});



// 📌 GET /orders?merchantId=1&maxAgeMinutes=120
app.get("/orders", async (req, res) => {
  try {
    const merchantId = req.query.merchantId ? Number(req.query.merchantId) : null;
    const maxAgeMinutes = req.query.maxAgeMinutes ? Number(req.query.maxAgeMinutes) : null;

    // 動態 where
    const where = [];
    const params = [];

    if (merchantId) {
      where.push("o.MerchantID = ?");
      params.push(merchantId);
    }
    // 若有設定過期分鐘，就過濾掉太舊的訂單
    if (Number.isFinite(maxAgeMinutes) && maxAgeMinutes > 0) {
      where.push("o.OrderDate >= (NOW() - INTERVAL ? MINUTE)");
      params.push(maxAgeMinutes);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `
      SELECT 
        o.OrderID, o.Customer, o.TotalAmount, o.OrderDate, o.Status,
        oi.Quantity, oi.UnitPrice,
        p.Name AS ProductName
      FROM Orders o
      JOIN OrderItems oi ON o.OrderID = oi.OrderID
      JOIN Products p ON oi.ProductID = p.ProductID
      ${whereSql}
      ORDER BY o.OrderDate DESC
      `,
      params
    );

    // 聚合同一張訂單
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.OrderID)) {
        map.set(r.OrderID, {
          id: r.OrderID,
          customer: r.Customer,
          total: Number(r.TotalAmount),
          created_at: r.OrderDate,
          status: r.Status || "PENDING",
          items: [],
        });
      }
      map.get(r.OrderID).items.push({
        name: r.ProductName,
        quantity: r.Quantity,
        price: Number(r.UnitPrice),
      });
    }

    res.json(Array.from(map.values()));
  } catch (err) {
    console.error("❌ Fetch orders error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 POST /orders/:id/complete → 標記完成
app.post("/orders/:id/complete", async (req, res) => {
  const { id } = req.params;
  try {
    const [r] = await db.query(
      "UPDATE Orders SET Status='PAID' WHERE OrderID=?",
      [id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Complete order error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 DELETE /orders/:id → 硬刪
app.delete("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM OrderItems WHERE OrderID=?", [id]);
    const [r] = await conn.query("DELETE FROM Orders WHERE OrderID=?", [id]);
    await conn.commit();
    if (r.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Delete order error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});





// 啟動伺服器
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`✅ API running at http://localhost:${PORT}`)
);
