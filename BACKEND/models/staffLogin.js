const mongoose = require("mongoose");

const staffLoginSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
});

module.exports = mongoose.model("StaffLogin", staffLoginSchema, "staff_login");