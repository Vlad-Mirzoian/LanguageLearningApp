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

module.exports = mongoose.model("Word", wordSchema);
