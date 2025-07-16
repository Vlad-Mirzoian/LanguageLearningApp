const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  word: { type: String, required: true },
  translation: { type: String, required: true },
  category: { type: String, default: "" },
  // categoryId: {type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null},
  interval: { type: Number, default: 1 },
  nextReview: { type: Date, default: Date.now },
  easiness: { type: Number, default: 2.5 },
  repetitions: { type: Number, default: 0 },
  lastReviewed: { type: Date, default: Date.now },
});

cardSchema.index({ userId: 1, nextReview: 1 });

module.exports = mongoose.model("Card", cardSchema);
