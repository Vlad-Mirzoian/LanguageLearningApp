const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema({
  attemptId: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  languageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Language",
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  type: { type: String, enum: ["flash", "test", "dictation"], required: true },
  date: { type: Date, default: Date.now() },
  score: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  totalAnswers: { type: Number, default: 0 },
  shareToken: { type: String, default: null },
  shareTokenExpires: { type: Date, default: null },
});

attemptSchema.index(
  { shareToken: 1 },
  { unique: true, partialFilterExpression: { shareToken: { $type: "string" } } }
);

module.exports = mongoose.model("Attempt", attemptSchema);
