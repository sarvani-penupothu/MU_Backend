const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty'], required: true },

  studentInfo: {
    type: new mongoose.Schema({
      rollNumber: String,
      branch: String,
      year: Number,
      section: String
    }, { _id: false }),
    default: undefined // ✅ prevents empty object when not set
  },

  facultyInfo: {
    type: new mongoose.Schema({
      department: String,
      designation: { type: String, default: "Faculty" }
    }, { _id: false }),
    default: undefined // ✅ same here
  },

  classes: [{
    branch: String,
    year: Number,
    section: String
  }]
}, { minimize: true });

module.exports = mongoose.model('User', userSchema);
