const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
  city: String,
  streetName: String,
  streetNumber: String,
  areaSize: Number,
  hasAc: Boolean,
  yearBuilt: Number,
  rentPrice: Number,
  dateAvailable: Date,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  photos: [String],
}, { timestamps: true });

module.exports = mongoose.model('Flat', flatSchema);
