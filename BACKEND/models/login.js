const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema({
  registerNumber: {
    type: String,
    required: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  }
});

// ✅ Prevent model overwrite error
const Login = mongoose.models.Login || mongoose.model('Login', loginSchema);

module.exports = Login;