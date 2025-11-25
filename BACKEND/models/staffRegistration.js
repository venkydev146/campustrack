const mongoose = require("mongoose");

const staffRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("StaffRegistration", staffRegistrationSchema, "staff_registration");