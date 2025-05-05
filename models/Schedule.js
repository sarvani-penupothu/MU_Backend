const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], required: true },
  entries: [{
    time: String,
    subject: String,
    classroom: String,
    facultyName: String,
    facultyEmail: String // ✅ We'll use this to route feedback
  }]
});

module.exports = mongoose.model('Schedule', scheduleSchema);
