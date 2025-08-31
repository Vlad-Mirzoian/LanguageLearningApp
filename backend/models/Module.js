const mongoose = require("mongoose");

const moduleScheme = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  languageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Language",
    required: true,
  },
  order: { type: Number, required: true },
  requiredScore: { type: Number, default: 80 },
  wordsCount: { type: Number, default: 0 },
});

moduleScheme.index({ languageId: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Module", moduleScheme);
