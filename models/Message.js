const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: String,
  flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
