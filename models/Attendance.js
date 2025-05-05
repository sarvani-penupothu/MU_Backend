const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  subject: { type: String, required: true },
  time: { type: String, required: true },
  classroom: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  facultyEmail: { type: String, required: true },
  presentStudents: [{ type: String }] // array of roll numbers
});

module.exports = mongoose.model("Attendance", attendanceSchema);
