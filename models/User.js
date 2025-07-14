const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  settings: { type: Object, default: { language: 'ua' } },
});

module.exports = mongoose.model('User', userSchema);