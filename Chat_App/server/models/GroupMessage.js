const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  group: { type: String, required: true }, // group name
  sender: { type: String, required: true },
  message: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
