const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});
const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema)
module.exports = RefreshToken;