const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  wordId: { type: mongoose.Schema.Types.ObjectId, ref: "Word", required: true },
  translationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Word",
    required: true,
  },
  interval: { type: Number, default: 1 },
  nextReview: { type: Date, default: Date.now },
  easiness: { type: Number, default: 2.5 },
  repetitions: { type: Number, default: 0 },
  lastReviewed: { type: Date, default: Date.now },
});

cardSchema.index({ userId: 1, nextReview: 1 });

module.exports = mongoose.model("Card", cardSchema);
