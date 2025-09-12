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

// 📌 POST /merchant → 建立訂單
app.post("/merchant", async (req, res) => {
  const { merchantId, customer, items, total } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 建立訂單
    const [orderResult] = await conn.query(
      "INSERT INTO Orders (MerchantID, Customer, TotalAmount) VALUES (?, ?, ?)",
      [merchantId, customer, total]
    );
    const orderId = orderResult.insertId;

    // 插入訂單明細
    for (let item of items) {
      await conn.query(
        "INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice) VALUES (?, ?, ?, ?)",
        [orderId, item.productId, item.quantity || 1, item.price]
      );
    }

    await conn.commit();
    res.json({ orderId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Insert order error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});

// 📌 GET /orders → 查詢所有訂單 + 明細
app.get("/orders", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         o.OrderID, o.Customer, o.TotalAmount, o.OrderDate,
         oi.Quantity, oi.UnitPrice,
         p.Name AS ProductName
       FROM Orders o
       JOIN OrderItems oi ON o.OrderID = oi.OrderID
       JOIN Products p ON oi.ProductID = p.ProductID
       ORDER BY o.OrderDate DESC`
    );

    // 整理成每筆訂單一組
    const orders = {};
    rows.forEach((r) => {
      if (!orders[r.OrderID]) {
        orders[r.OrderID] = {
          id: r.OrderID,
          customer: r.Customer,
          total: r.TotalAmount,
          created_at: r.OrderDate,
          items: [],
        };
      }
      orders[r.OrderID].items.push({
        name: r.ProductName,
        quantity: r.Quantity,
        price: r.UnitPrice,
      });
    });

    res.json(Object.values(orders));
  } catch (err) {
    console.error("❌ Fetch orders error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 啟動伺服器
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`✅ API running at http://localhost:${PORT}`)
);
