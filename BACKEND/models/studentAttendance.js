const attendanceSchema = new mongoose.Schema({
  studentId: String,
  subjectName: String,
  date: String,       // example: "2025-11-16"
  present: Boolean,   // true = present, false = absent
});

const Attendance = mongoose.model("studentAttendance", attendanceSchema);