const mongoose = require("mongoose");

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
  totalCards: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  unlocked: { type: Boolean, default: false },
});

userProgressSchema.index(
  { userId: 1, languageId: 1, categoryId: 1 },
  { unique: true }
);

module.exports = mongoose.model("UserProgress", userProgressSchema);
