const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  birthDate: Date,
  isAdmin: { type: Boolean, default: false },
  favouriteFlats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flat' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
