const mongoose = require('mongoose');

const courseRegistrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseName: String,
  courseCode: String,
  instructor: String,
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CourseRegistration', courseRegistrationSchema);
