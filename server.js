require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const YAML = require("yaml");
const path = require("path");

const Student = require("./models/Student");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files if built
const clientDistPath = path.join(__dirname, "student-client", "dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Swagger Documentation
if (fs.existsSync("./swagger.yaml")) {
  const swaggerDocument = YAML.parse(fs.readFileSync("./swagger.yaml", "utf8"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/student_db";

// Base Route
app.get("/", (req, res) => {
  if (fs.existsSync(path.join(clientDistPath, "index.html"))) {
    return res.sendFile(path.join(clientDistPath, "index.html"));
  }
  res.send("Student REST API is running");
});

// GET /students - Retrieve all students
app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error fetching students" });
  }
});

// GET /students/:id - Retrieve student by ID
app.get("/students/:id", async (req, res) => {
  try {
    const targetId = parseStudentId(req.params.id);
    if (targetId === null) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = await Student.findById(targetId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: "Server error fetching student" });
  }
});

// Helper for parsing student ID (numeric 1, 2... or legacy ObjectId)
function parseStudentId(id) {
  const num = Number(id);
  if (!isNaN(num) && Number.isInteger(num)) {
    return num;
  }
  if (mongoose.Types.ObjectId.isValid(id)) {
    return id;
  }
  return null;
}

// Helper for validating student input
function validateStudentInput(body) {
  const { name, email, course, semester } = body;
  const semNum = Number(semester);
  if (
    !name ||
    typeof name !== "string" ||
    !name.trim() ||
    !email ||
    typeof email !== "string" ||
    !email.includes("@") ||
    !course ||
    typeof course !== "string" ||
    !course.trim() ||
    semester === undefined ||
    semester === null ||
    isNaN(semNum) ||
    semNum <= 0
  ) {
    return false;
  }
  return true;
}

// POST /students - Create new student
app.post("/students", async (req, res) => {
  try {
    if (!validateStudentInput(req.body)) {
      return res.status(400).json({ message: "Invalid student data" });
    }

    const { name, email, course, semester } = req.body;
    const newStudent = new Student({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      course: course.trim(),
      semester: Number(semester)
    });

    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid student data" });
    }
    console.error("Error creating student:", error);
    res.status(500).json({ message: "Server error creating student" });
  }
});

// PUT /students/:id - Update existing student
app.put("/students/:id", async (req, res) => {
  try {
    const targetId = parseStudentId(req.params.id);
    if (targetId === null) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!validateStudentInput(req.body)) {
      return res.status(400).json({ message: "Invalid student data" });
    }

    const { name, email, course, semester } = req.body;
    const updatedStudent = await Student.findByIdAndUpdate(
      targetId,
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        course: course.trim(),
        semester: Number(semester)
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid student data" });
    }
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Server error updating student" });
  }
});

// DELETE /students/:id - Delete student
app.delete("/students/:id", async (req, res) => {
  try {
    const targetId = parseStudentId(req.params.id);
    if (targetId === null) {
      return res.status(404).json({ message: "Student not found" });
    }

    const deletedStudent = await Student.findByIdAndDelete(targetId);
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Server error deleting student" });
  }
});

// Database Connection & Server Start Function
const startServer = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connection successful!");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();