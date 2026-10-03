require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Product = require("./models/Product");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || process.env.PRODUCT_SERVICE_PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/product_db";

// Helper for parsing product ID (numeric 501, 1... or string/ObjectId)
function parseProductId(id) {
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
  res.json({ service: "Product Service", status: "running", port: PORT });
});

// GET /products - Retrieve all products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error fetching products" });
  }
});

// GET /products/:id - Retrieve product by ID
app.get("/products/:id", async (req, res) => {
  try {
    const targetId = parseProductId(req.params.id);
    const product = await Product.findById(targetId);
    if (!product) {
      return res.status(404).json({ message: `Product not found with ID: ${req.params.id}` });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error fetching product" });
  }
});

// POST /products - Create new product
app.post("/products", async (req, res) => {
  try {
    const { name, price, category, stock, _id, id } = req.body;
    const priceNum = Number(price);

    if (!name || typeof name !== "string" || !name.trim() || price === undefined || price === null || isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: "Invalid product data. Name and non-negative price are required." });
    }

    const productData = {
      name: name.trim(),
      price: priceNum,
      category: category ? category.trim() : "General",
      stock: stock !== undefined ? Number(stock) : 100
    };

    const customId = _id || id;
    if (customId !== undefined && customId !== null) {
      productData._id = parseProductId(customId);
    }

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid product data" });
    }
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Server error creating product" });
  }
});

// PUT /products/:id - Update product by ID
app.put("/products/:id", async (req, res) => {
  try {
    const targetId = parseProductId(req.params.id);
    const { name, price, category, stock } = req.body;
    const priceNum = Number(price);

    if (!name || typeof name !== "string" || !name.trim() || price === undefined || price === null || isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: "Invalid product data" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      targetId,
      {
        name: name.trim(),
        price: priceNum,
        category: category ? category.trim() : "General",
        stock: stock !== undefined ? Number(stock) : 100
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: `Product not found with ID: ${req.params.id}` });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error updating product" });
  }
});

// DELETE /products/:id - Delete product by ID
app.delete("/products/:id", async (req, res) => {
  try {
    const targetId = parseProductId(req.params.id);
    const deletedProduct = await Product.findByIdAndDelete(targetId);

    if (!deletedProduct) {
      return res.status(404).json({ message: `Product not found with ID: ${req.params.id}` });
    }

    res.status(200).json({ message: "Product deleted successfully", id: req.params.id });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error deleting product" });
  }
});

// Database Connection & Server Start
const startServer = async () => {
  try {
    console.log(`Connecting Product Service to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log("Product Service connected to MongoDB!");

    app.listen(PORT, () => {
      console.log(`Product Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Product Service MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
