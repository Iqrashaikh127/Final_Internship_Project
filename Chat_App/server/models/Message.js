const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true }, // username or groupId
  message: { type: String },
  imageUrl: { type: String }, // Added field
  type: { type: String, enum: ['text', 'image'], default: 'text' },
  isGroup: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
