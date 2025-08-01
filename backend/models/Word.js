const mongoose = require("mongoose");

const wordSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  languageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Language",
    required: true,
  },
});

wordSchema.index({ text: 1, languageId: 1 }, { unique: true });
wordSchema.index({ languageId: 1 });

module.exports = mongoose.model("Word", wordSchema);
