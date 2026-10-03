require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || process.env.USER_SERVICE_PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/user_db";

// Helper for parsing user ID (numeric 101, 1... or string/ObjectId)
function parseUserId(id) {
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
  res.json({ service: "User Service", status: "running", port: PORT });
});

// GET /users - Retrieve all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
});

// GET /users/:id - Retrieve user by ID
app.get("/users/:id", async (req, res) => {
  try {
    const targetId = parseUserId(req.params.id);
    const user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({ message: `User not found with ID: ${req.params.id}` });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error fetching user" });
  }
});

// POST /users - Create new user
app.post("/users", async (req, res) => {
  try {
    const { name, email, role, department, _id, id } = req.body;
    if (!name || typeof name !== "string" || !name.trim() || !email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "Invalid user data. Name and valid email are required." });
    }

    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role ? role.trim() : "student",
      department: department ? department.trim() : "Computer Science"
    };

    const customId = _id || id;
    if (customId !== undefined && customId !== null) {
      userData._id = parseUserId(customId);
    }

    const newUser = new User(userData);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid user data" });
    }
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error creating user" });
  }
});

// PUT /users/:id - Update user by ID
app.put("/users/:id", async (req, res) => {
  try {
    const targetId = parseUserId(req.params.id);
    const { name, email, role, department } = req.body;

    if (!name || typeof name !== "string" || !name.trim() || !email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "Invalid user data" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetId,
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role ? role.trim() : "student",
        department: department ? department.trim() : "Computer Science"
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: `User not found with ID: ${req.params.id}` });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error updating user" });
  }
});

// DELETE /users/:id - Delete user by ID
app.delete("/users/:id", async (req, res) => {
  try {
    const targetId = parseUserId(req.params.id);
    const deletedUser = await User.findByIdAndDelete(targetId);

    if (!deletedUser) {
      return res.status(404).json({ message: `User not found with ID: ${req.params.id}` });
    }

    res.status(200).json({ message: "User deleted successfully", id: req.params.id });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error deleting user" });
  }
});

// Database Connection & Server Start
const startServer = async () => {
  try {
    console.log(`Connecting User Service to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log("User Service connected to MongoDB!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`User Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("User Service MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
