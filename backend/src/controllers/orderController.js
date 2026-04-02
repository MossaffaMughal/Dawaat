import pool from "../config/database.js";

const generateOrderNumber = () => {
  return (
    "ORD-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substr(2, 9).toUpperCase()
  );
};

export const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      postalCode,
      items,
      totalAmount,
      paymentMethod,
      shippingMethod,
      userId,
    } = req.body;

    // Get shipping cost from settings
    const settingsResult = await client.query(
      `SELECT value FROM settings WHERE key = 'shipping_cost' LIMIT 1`,
    );
    const shippingCost = settingsResult.rows[0]?.value || 250;

    const orderNumber = generateOrderNumber();

    // Calculate final total with shipping
    const finalTotal = parseFloat(totalAmount) + parseFloat(shippingCost);

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, user_id, user_email, customer_name, customer_email, customer_phone, address, city, postal_code, total_amount, shipping_cost, payment_method, shipping_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
       RETURNING *`,
      [
        orderNumber,
        userId || null,
        customerEmail,
        customerName,
        customerEmail,
        customerPhone,
        address,
        city,
        postalCode,
        totalAmount,
        shippingCost,
        paymentMethod,
        shippingMethod,
      ],
    );

    const orderId = orderResult.rows[0].id;

    // Add order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, variant)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          item.productId,
          item.productName,
          item.quantity,
          item.price,
          item.variant || null,
        ],
      );

      // Update product stock
      await client.query(
        "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
        [item.quantity, item.productId],
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order created successfully",
      order: { ...orderResult.rows[0], shippingCost },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create order error:", error);
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  } finally {
    client.release();
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, 
              json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price, 'variant', oi.variant)) 
              FILTER (WHERE oi.id IS NOT NULL) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get orders error:", error);
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT o.*, 
              json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price, 'variant', oi.variant)) 
              FILTER (WHERE oi.id IS NOT NULL) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get order by id error:", error);
    res
      .status(500)
      .json({ message: "Error fetching order", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await pool.query(
      "UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order updated successfully",
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Update order error:", error);
    res
      .status(500)
      .json({ message: "Error updating order", error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM orders WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    res
      .status(500)
      .json({ message: "Error deleting order", error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT o.*, 
              json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price)) 
              FILTER (WHERE oi.id IS NOT NULL) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get user orders error:", error);
    res
      .status(500)
      .json({ message: "Error fetching user orders", error: error.message });
  }
};

// Settings controllers
export const getShippingCost = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT value FROM settings WHERE key = 'shipping_cost' LIMIT 1`,
    );
    const shippingCost = result.rows[0]?.value || 250;
    res.json({ shippingCost: parseFloat(shippingCost) });
  } catch (error) {
    console.error("Get shipping cost error:", error);
    res
      .status(500)
      .json({ message: "Error fetching shipping cost", error: error.message });
  }
};

export const updateShippingCost = async (req, res) => {
  try {
    const { shippingCost } = req.body;

    if (!shippingCost || shippingCost <= 0) {
      return res.status(400).json({ message: "Valid shipping cost required" });
    }

    const result = await pool.query(
      `UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE key = 'shipping_cost'
       RETURNING *`,
      [shippingCost],
    );

    res.json({
      message: "Shipping cost updated successfully",
      shippingCost: parseFloat(shippingCost),
    });
  } catch (error) {
    console.error("Update shipping cost error:", error);
    res
      .status(500)
      .json({ message: "Error updating shipping cost", error: error.message });
  }
};
