console.log("🔥 ACTIVE BACKEND FILE: THIS ONE IS RUNNING");
const path = require("path");

const bcrypt = require("bcryptjs");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "10mb" })); // To handle Base64 images

// -------------------------------------------
// 🔗 CONNECT TO MONGODB
// -------------------------------------------
mongoose
  .connect("mongodb://localhost:27017/campustrack", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// -------------------------------------------
// 🧩 STUDENT SCHEMA + MODEL
// -------------------------------------------
const studentSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  father: String,
  mother: String,
  parentsPhone: String,
  registerNumber: { type: String, unique: true },
  registerPassword: String,
  department: String,
  branch: String,
  section: String,
  photo: String,
});

const Student = mongoose.model("studentRegistration", studentSchema);

// -------------------------------------------
// 📝 LOGIN HISTORY SCHEMA + MODEL
// -------------------------------------------
const loginHistorySchema = new mongoose.Schema({
  studentId: String,
  registerNumber: String,
  loginTime: { type: Date, default: Date.now }
});

const LoginHistory = mongoose.model("studentLoginHistory", loginHistorySchema);

// -------------------------------------------
// 🟢 STUDENT REGISTRATION ROUTE
// -------------------------------------------
app.use(express.static(path.join(__dirname, "FRONTEND")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "FRONTEND", "index.html"));
});

app.post("/register", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      father,
      mother,
      parentsPhone,
      registerNumber,
      registerPassword,
      department,
      branch,
      section,
      photo,
    } = req.body;

    // 🔍 Check if already registered
    const existingStudent = await Student.findOne({
      $or: [{ email }, { registerNumber }],
    });

    if (existingStudent) {
      return res.status(400).json({ error: "User already registered" });
    }

    // 📝 Save new student
    const newStudent = new Student({
      name,
      phone,
      email,
      father,
      mother,
      parentsPhone,
      registerNumber,
      registerPassword: await bcrypt.hash(registerPassword, 10), // 🔐 Hashing
      department,
      branch,
      section,
      photo,
    });

    await newStudent.save();

    const studentWithoutPassword = {
      name,
      phone,
      email,
      registerNumber,
      department,
      branch,
      section,
      photo,
    };

    res.status(201).json({
      message: "🎉 Registration successful!",
      student: studentWithoutPassword,
    });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// -------------------------------------------
// 🔐 STUDENT LOGIN ROUTE (FINAL)
// -------------------------------------------
app.post("/student-login", async (req, res) => {
  try {
    const { registerNumber, registerPassword } = req.body;

    // Check empty fields
    if (!registerNumber || !registerPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if student exists
    const student = await Student.findOne({ registerNumber });

    if (!student) {
      return res.status(404).json({ error: "Invalid Register Number" });
    }

    // Check password
    const isMatch = await bcrypt.compare(registerPassword, student.registerPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect Password" });
    }

    // Safe student details (no password)
    const safeStudent = {
      id: student._id,
      name: student.name,
      phone: student.phone,
      email: student.email,
      registerNumber: student.registerNumber,
      department: student.department,
      branch: student.branch,
      section: student.section,
      photo: student.photo,
    };

    // -------------------------------
    // 📌 SAVE LOGIN HISTORY HERE
    // -------------------------------
    await LoginHistory.create({
      studentId: student._id,
      registerNumber: student.registerNumber
    });

    res.status(200).json({
      message: "Login successful",
      student: safeStudent,
    });

  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "Server login error" });
  }
});

app.post("/add-marks", async (req, res) => {
  try {
    const { studentId, subjectName, subjectCode, examType, marks } = req.body;

    const newMarks = new Marks({
      studentId,
      subjectName,
      subjectCode,
      examType,
      marks,
    });

    await newMarks.save();

    res.status(201).json({ message: "Marks added successfully" });
  } catch (err) {
    console.log("❌ Marks Add Error:", err);
    res.status(500).json({ error: "Server error adding marks" });
  }
});
app.get("/student-marks/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const marks = await Marks.find({ studentId });

    res.status(200).json({
      message: "Marks fetched successfully",
      marks,
    });
  } catch (err) {
    console.log("❌ Fetch Marks Error:", err);
    res.status(500).json({ error: "Server error fetching marks" });
  }
});
app.post("/mark-attendance", async (req, res) => {
  try {
    const { studentId, subjectName, date, present } = req.body;

    await Attendance.create({
      studentId,
      subjectName,
      date,
      present,
    });

    res.status(201).json({ message: "Attendance marked successfully" });

  } catch (err) {
    console.log("❌ Attendance Marking Error:", err);
    res.status(500).json({ error: "Server error while marking attendance" });
  }
});
app.get("/student-attendance/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const attendance = await Attendance.find({ studentId });

    res.status(200).json({
      message: "Attendance fetched successfully",
      attendance,
    });

  } catch (err) {
    console.log("❌ Attendance Fetch Error:", err);
    res.status(500).json({ error: "Server error fetching attendance" });
  }
});
app.get("/student-attendance/:studentId/:subjectName", async (req, res) => {
  try {
    const { studentId, subjectName } = req.params;

    const attendance = await Attendance.find({
      studentId,
      subjectName
    });

    res.status(200).json({
      message: "Subject-wise attendance fetched",
      attendance,
    });

  } catch (err) {
    console.log("❌ Subject-wise Attendance Error:", err);
    res.status(500).json({ error: "Server error fetching subject-wise attendance" });
  }
});

// -------------------------------------------
// 🟢 CREATE ANNOUNCEMENT
// -------------------------------------------
app.post("/create-announcement", async (req, res) => {
  try {
    const { title, message, target } = req.body;

    const newAnn = new Announcement({
      title,
      message,
      target: target || "all"
    });

    await newAnn.save();

    res.status(201).json({ message: "Announcement created successfully" });
  } catch (err) {
    console.error("Announcement create error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// -------------------------------------------
// 🔍 GET ANNOUNCEMENTS FOR A STUDENT
// -------------------------------------------
app.get("/notifications/:registerNumber", async (req, res) => {
  try {
    const registerNumber = req.params.registerNumber;

    const announcements = await Announcement.find({
      $or: [
        { target: "all" },
        { target: registerNumber }
      ]
    }).sort({ _id: -1 }); // latest first

    res.json(announcements);
  } catch (err) {
    console.error("Fetch announcement error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------------
// 🚀 START SERVER
// -------------------------------------------
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);