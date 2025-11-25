// -------------------------------------------
// 📢 ANNOUNCEMENT SCHEMA
// -------------------------------------------
const announcementSchema = new mongoose.Schema({
  title: String,
  message: String,
  date: { type: String, default: new Date().toLocaleDateString() },
  target: String   // "all" or "registerNumber"
});

const Announcement = mongoose.model("announcements", announcementSchema);