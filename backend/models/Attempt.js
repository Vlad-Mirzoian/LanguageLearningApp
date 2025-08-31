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
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Level",
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
attemptSchema.index({ moduleId: 1 });
attemptSchema.index({ levelId: 1 });

module.exports = mongoose.model("Attempt", attemptSchema);
