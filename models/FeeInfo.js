// models/FeeInfo.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: String, // e.g., '30-Apr-2025'
  amount: Number,
  mode: String,
  status: { type: String, enum: ['Paid', 'Pending'] }
});

const feeInfoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNumber: String,
  branch: String,
  semester: Number,
  tuitionFee: { type: Number, default: 225000 },
  hostelFee: { type: Number, default: 100000 },
  transactions: [transactionSchema]
});

module.exports = mongoose.model('FeeInfo', feeInfoSchema);
