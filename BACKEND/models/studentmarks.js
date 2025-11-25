const marksSchema = new mongoose.Schema({
  studentId: String,
  subjectName: String,
  subjectCode: String,
  examType: String,  // CAT1, CAT2, Model, Semester
  marks: Number,
});

const Marks = mongoose.model("studentMarks", marksSchema);