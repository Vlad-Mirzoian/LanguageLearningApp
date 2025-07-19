const mongoose = require("mongoose");

const wordSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  languageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Language",
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },
  meaning: { type: String, default: "" },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

wordSchema.index({ text: 1, languageId: 1, createdBy: 1 }, { unique: true });

module.exports = mongoose.model("Word", wordSchema);
