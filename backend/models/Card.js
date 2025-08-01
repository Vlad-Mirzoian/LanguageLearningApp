const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  wordId: { type: mongoose.Schema.Types.ObjectId, ref: "Word", required: true },
  translationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Word",
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  meaning: { type: String, default: "" },
  interval: { type: Number, default: 1 },
  nextReview: { type: Date, default: Date.now },
  easiness: { type: Number, default: 2.5 },
  repetitions: { type: Number, default: 0 },
  lastReviewed: { type: Date, default: Date.now },
});

cardSchema.index({ nextReview: 1 });
cardSchema.index({ wordId: 1 });
cardSchema.index({ translationId: 1 });
cardSchema.index({ wordId: 1, translationId: 1 });
cardSchema.index({ lastReviewed: 1 });
cardSchema.index({ repetitions: 1 });
cardSchema.index({ categoryId: 1 });

module.exports = mongoose.model("Card", cardSchema);
