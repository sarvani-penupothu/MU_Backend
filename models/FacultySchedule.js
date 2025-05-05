const mongoose = require('mongoose');

const facultyScheduleSchema = new mongoose.Schema({
  facultyEmail: { type: String, required: true },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    required: true
  },
  entries: [
    {
      time: { type: String, required: true },
      subject: { type: String, required: true },
      classroom: { type: String, required: true },
      branch: { type: String, required: true },
      year: { type: Number, required: true }
    }
  ]
});

module.exports = mongoose.model('FacultySchedule', facultyScheduleSchema);