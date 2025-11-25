// staff.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const twilio = require("twilio");
const StaffRegistration = require("./models/staffRegistration");
const StaffLogin = require("./models/staffLogin");

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// ✅ MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/campustrack", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB (Staff)"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Twilio Credentials
const accountSid = "TWILIO_SID_HERE";
const authToken = "TWILIO_AUTH_TOKEN_HERE";
const TWILIO_NUMBER = "+18782512558";
const twilioClient = new twilio("TWILIO_SID_HERE", "TWILIO_AUTH_TOKEN_HERE");

// ✅ Temporary OTP stores
const otpStore = {}; // registration OTP
const loginOtpStore = {}; // login OTP

// =================================================================
// ✅ 1. SEND OTP — STAFF REGISTRATION
// =================================================================
app.post("/send-staff-otp", async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      return res
        .status(400)
        .json({ error: "⚠ Please fill all fields (name, phone, email)" });
    }

    // ✅ Check if staff already exists
    const existingStaff = await StaffRegistration.findOne({
      $or: [{ phone }, { email }],
    });

    if (existingStaff) {
      return res
        .status(400)
        .json({ error: "⚠ User already registered with this phone or email" });
    }

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // ✅ Store OTP temporarily
    otpStore[phone] = {
      otp,
      data: { name, phone, email },
      expiresAt: Date.now() + 2 * 60 * 1000, // 2 min expiry
    };

    // ✅ Send OTP via Twilio
    await twilioClient.messages.create({
      body: `👋 Hello ${name}! Your CampusTrack registration OTP is ${otp}. It expires in 2 minutes.`,
      from: TWILIO_NUMBER,
      to: phone.startsWith("+91") ? phone : `+91${phone}`,
    });

    console.log(`✅ Registration OTP sent to ${phone}: ${otp}`);
    res.json({ message: "✅ Registration OTP sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending registration OTP:", error);
    res.status(500).json({ error: "❌ Failed to send registration OTP" });
  }
});

// =================================================================
// ✅ 2. VERIFY OTP — STAFF REGISTRATION
// =================================================================
app.post("/verify-staff-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const stored = otpStore[phone];

    if (!stored) return res.status(400).json({ error: "⚠ No OTP found or expired" });

    if (Date.now() > stored.expiresAt) {
      delete otpStore[phone];
      return res.status(400).json({ error: "⚠ OTP expired" });
    }

    if (stored.otp.toString() !== otp.toString()) {
      return res.status(400).json({ error: "❌ Invalid OTP" });
    }

    const { name, email } = stored.data;

    let staff = await StaffRegistration.findOne({ phone });
    if (!staff) {
      staff = new StaffRegistration({ name, phone, email });
      await staff.save();
    }

    delete otpStore[phone];
    console.log(`✅ Staff registered: ${name} (${phone})`);

    res.json({
      message: "✅ Registration successful!",
      staff: { name: staff.name, phone: staff.phone, email: staff.email },
    });
  } catch (error) {
    console.error("❌ Error verifying registration OTP:", error);
    res.status(500).json({ error: "❌ Server error during OTP verification" });
  }
});

// =================================================================
// ✅ 3. SEND OTP — STAFF LOGIN
// =================================================================
app.post("/send-staff-login-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) return res.status(400).json({ error: "⚠ Phone number required" });

    const staff = await StaffRegistration.findOne({ phone });
    if (!staff) {
      return res
        .status(404)
        .json({ error: "❌ Staff not found. Please register first." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    loginOtpStore[phone] = { otp, expiresAt: Date.now() + 2 * 60 * 1000 };

    await twilioClient.messages.create({
      body: `👋 Hello ${staff.name.toUpperCase()}! Your CampusTrack login OTP is ${otp}. It expires in 2 minutes.`,
      from: TWILIO_NUMBER,
      to: phone.startsWith("+91") ? phone : `+91${phone}`,
    });

    console.log(`✅ Login OTP sent to ${phone}: ${otp}`);
    res.json({ message: "✅ Login OTP sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending login OTP:", error);
    res.status(500).json({ error: "❌ Failed to send login OTP" });
  }
});

// =================================================================
// ✅ 4. VERIFY OTP — STAFF LOGIN
// =================================================================
app.post("/verify-staff-login-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const stored = loginOtpStore[phone];

    if (!stored)
      return res.status(400).json({ error: "⚠ No OTP found or expired" });

    if (Date.now() > stored.expiresAt) {
      delete loginOtpStore[phone];
      return res.status(400).json({ error: "⚠ OTP expired" });
    }

    if (stored.otp.toString() !== otp.toString()) {
      return res.status(400).json({ error: "❌ Invalid OTP" });
    }

    const staff = await StaffRegistration.findOne({ phone });
    if (!staff)
      return res.status(404).json({ error: "❌ Staff not found. Please register first." });

    // ✅ Save login record
    const newLogin = new StaffLogin({
      name: staff.name,
      phone: staff.phone,
      email: staff.email,
      loginTime: new Date(),
    });
    await newLogin.save();

    delete loginOtpStore[phone];
    console.log(`✅ Login verified: ${staff.name} (${phone})`);

    res.json({
      message: "✅ Login successful!",
      staff: { name: staff.name, phone: staff.phone, email: staff.email },
    });
  } catch (error) {
    console.error("❌ Error verifying login OTP:", error);
    res.status(500).json({ error: "❌ Server error during login verification" });
  }
});

// ✅ Start Server
const PORT = 4000;
app.listen(PORT, () =>
  console.log(`🚀 Staff OTP server running on http://localhost:${PORT}`)
);