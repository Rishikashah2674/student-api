require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Order = require("./models/Order");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || process.env.ORDER_SERVICE_PORT || 3003;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/order_db";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:3001";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://product-service:3002";

// Helper for parsing order ID (numeric 1001, 1... or string/ObjectId)
function parseOrderId(id) {
  const num = Number(id);
  if (!isNaN(num) && Number.isInteger(num)) {
    return num;
  }
  if (mongoose.Types.ObjectId.isValid(id)) {
    return id;
  }
  return id;
}

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    service: "Order Service",
    status: "running",
    port: PORT,
    dependencies: {
      userServiceUrl: USER_SERVICE_URL,
      productServiceUrl: PRODUCT_SERVICE_URL
    }
  });
});

// GET /orders - Retrieve all orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error fetching orders" });
  }
});

// GET /orders/:id - Retrieve order by ID
app.get("/orders/:id", async (req, res) => {
  try {
    const targetId = parseOrderId(req.params.id);
    const order = await Order.findById(targetId);
    if (!order) {
      return res.status(404).json({ message: `Order not found with ID: ${req.params.id}` });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error fetching order" });
  }
});

// POST /orders - Create a new order (Validates user & product via REST APIs)
app.post("/orders", async (req, res) => {
  try {
    const { userId, productId, quantity, _id, id } = req.body;

    if (userId === undefined || userId === null || productId === undefined || productId === null) {
      return res.status(400).json({ message: "userId and productId are required to create an order." });
    }

    const orderQty = quantity !== undefined && quantity !== null ? Number(quantity) : 1;
    if (isNaN(orderQty) || orderQty < 1) {
      return res.status(400).json({ message: "Quantity must be a positive integer." });
    }

    // 1. Contact User Service: GET http://user-service:3001/users/{userId}
    let userResponse;
    const userApiUrl = `${USER_SERVICE_URL.replace(/\/$/, "")}/users/${userId}`;
    console.log(`Order Service calling User Service at: ${userApiUrl}`);
    try {
      userResponse = await fetch(userApiUrl, {
        signal: AbortSignal.timeout(4000)
      });
    } catch (err) {
      console.error(`User Service call failed: ${err.message}`);
      return res.status(503).json({
        error: "Service Unavailable",
        message: "User Service is currently unavailable. Order creation cannot proceed."
      });
    }

    if (userResponse.status === 404) {
      return res.status(404).json({ message: `User with ID '${userId}' not found.` });
    }
    if (!userResponse.ok) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: `User Service returned unexpected status: ${userResponse.status}`
      });
    }
    const userData = await userResponse.json();

    // 2. Contact Product Service: GET http://product-service:3002/products/{productId}
    let productResponse;
    const productApiUrl = `${PRODUCT_SERVICE_URL.replace(/\/$/, "")}/products/${productId}`;
    console.log(`Order Service calling Product Service at: ${productApiUrl}`);
    try {
      productResponse = await fetch(productApiUrl, {
        signal: AbortSignal.timeout(4000)
      });
    } catch (err) {
      console.error(`Product Service call failed: ${err.message}`);
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Product Service is currently unavailable. Order creation cannot proceed."
      });
    }

    if (productResponse.status === 404) {
      return res.status(404).json({ message: `Product with ID '${productId}' not found.` });
    }
    if (!productResponse.ok) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: `Product Service returned unexpected status: ${productResponse.status}`
      });
    }
    const productData = await productResponse.json();

    // 3. Calculate total price and save order
    const totalPrice = (productData.price || 0) * orderQty;
    const orderData = {
      userId: userData.id || userData._id || userId,
      productId: productData.id || productData._id || productId,
      quantity: orderQty,
      totalPrice: totalPrice,
      userSnapshot: {
        name: userData.name,
        email: userData.email,
        role: userData.role
      },
      productSnapshot: {
        name: productData.name,
        price: productData.price,
        category: productData.category
      },
      status: "CREATED"
    };

    const customId = _id || id;
    if (customId !== undefined && customId !== null) {
      orderData._id = parseOrderId(customId);
    }

    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error creating order" });
  }
});

// Database Connection & Server Start
const startServer = async () => {
  try {
    console.log(`Connecting Order Service to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log("Order Service connected to MongoDB!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Order Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Order Service MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
