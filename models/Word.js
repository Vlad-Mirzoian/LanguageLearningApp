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
});

wordSchema.index({ text: 1, languageId: 1 }, { unique: true });
wordSchema.index({ languageId: 1 });
wordSchema.index({ categoryId: 1 });

module.exports = mongoose.model("Word", wordSchema);
