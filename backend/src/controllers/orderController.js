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

    // Validate required fields
    if (!customerName?.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Customer name is required" });
    }
    if (!customerEmail?.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Customer email is required" });
    }
    if (!customerPhone?.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Customer phone is required" });
    }
    if (!address?.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Address is required" });
    }
    if (!city?.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "City is required" });
    }
    if (!postalCode?.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Postal code is required" });
    }
    if (!items || items.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Order must contain at least one item" });
    }

    // Log incoming data for debugging
    console.log("Creating order with data:", {
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      postalCode,
      itemsCount: items?.length,
      totalAmount,
    });

    console.log("📍 Address Details:", {
      address: address?.trim(),
      city: city?.trim(),
      postalCode: postalCode?.trim(),
      addressLength: address?.length,
    });

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

    console.log("Order inserted successfully:");
    console.log("Order ID:", orderId);
    console.log("Order data from DB:", orderResult.rows[0]);
    console.log("Address from DB:", orderResult.rows[0].address);

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
      `SELECT o.id, o.order_number, o.user_id, o.user_email, o.customer_name, o.customer_email, o.customer_phone, 
              o.address, o.city, o.postal_code, o.total_amount, o.status, o.payment_method, 
              o.shipping_method, o.notes, o.shipping_cost, o.created_at, o.updated_at,
              COALESCE(json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price, 'variant', oi.variant)) 
              FILTER (WHERE oi.id IS NOT NULL), '[]'::json) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id, o.order_number, o.user_id, o.user_email, o.customer_name, o.customer_email, o.customer_phone, o.address, o.city, o.postal_code, o.total_amount, o.status, o.payment_method, o.shipping_method, o.notes, o.shipping_cost, o.created_at, o.updated_at
       ORDER BY o.created_at DESC`,
    );

    console.log("All orders fetched, total count:", result.rows.length);
    if (result.rows.length > 0) {
      console.log("First order address:", result.rows[0].address);
      console.log("📋 First order full details:", {
        order_number: result.rows[0].order_number,
        customer_name: result.rows[0].customer_name,
        address: result.rows[0].address,
        city: result.rows[0].city,
        postal_code: result.rows[0].postal_code,
        status: result.rows[0].status,
      });
    }

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
      `SELECT o.id, o.order_number, o.user_id, o.user_email, o.customer_name, o.customer_email, o.customer_phone, 
              o.address, o.city, o.postal_code, o.total_amount, o.status, o.payment_method, 
              o.shipping_method, o.notes, o.shipping_cost, o.created_at, o.updated_at,
              COALESCE(json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price, 'variant', oi.variant)) 
              FILTER (WHERE oi.id IS NOT NULL), '[]'::json) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id, o.order_number, o.user_id, o.user_email, o.customer_name, o.customer_email, o.customer_phone, o.address, o.city, o.postal_code, o.total_amount, o.status, o.payment_method, o.shipping_method, o.notes, o.shipping_cost, o.created_at, o.updated_at`,
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

    await pool.query(
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

export const getHeroBannerUrl = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT value FROM settings WHERE key = 'hero_banner_url' LIMIT 1`,
    );

    res.json({
      heroBannerUrl:
        result.rows[0]?.value || "/images/banners/hero-banner.jpeg",
    });
  } catch (error) {
    console.error("Get hero banner URL error:", error);
    res.status(500).json({
      message: "Error fetching hero banner URL",
      error: error.message,
    });
  }
};

export const updateHeroBannerUrl = async (req, res) => {
  try {
    const { heroBannerUrl } = req.body;

    if (!heroBannerUrl || !String(heroBannerUrl).trim()) {
      return res
        .status(400)
        .json({ message: "Valid hero banner URL required" });
    }

    const normalizedUrl = String(heroBannerUrl).trim();

    await pool.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ('hero_banner_url', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [normalizedUrl],
    );

    res.json({
      message: "Hero banner updated successfully",
      heroBannerUrl: normalizedUrl,
    });
  } catch (error) {
    console.error("Update hero banner URL error:", error);
    res.status(500).json({
      message: "Error updating hero banner URL",
      error: error.message,
    });
  }
};
