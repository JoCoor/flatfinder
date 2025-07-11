const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  flatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
