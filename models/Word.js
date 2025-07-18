const mongoose = require("mongoose");

const wordSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  languageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Language",
    required: true,
  },
  context: { type: String, default: "" },
  pronunciation: { type: String, default: "" },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

wordSchema.index({ text: 1, language: 1, createdBy: 1 }, { unique: true });

module.exports = mongoose.model("Word", wordSchema);
