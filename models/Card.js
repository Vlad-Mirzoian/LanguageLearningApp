const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  word: { type: String, required: true },
  translation: { type: String, required: true },
  category: { type: String, default: '' },
  interval: { type: Number, default: 1 },
  nextReview: { type: Date, default: Date.now },
  easiness: { type: Number, default: 2.5 },
});

module.exports = mongoose.model('Card', cardSchema);
