const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  father: String,
  mother: String,
  parentsPhone: String,
  registerNumber: { type: String, required: true, unique: true },
  registerPassword: { type: String, required: true },
  department: String,
  branch: String,
  section: String,
  photo: String
});

module.exports = mongoose.model("Student", studentSchema);