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
});

cardSchema.index({ wordId: 1, translationId: 1 }, { unique: true });
cardSchema.index({ wordId: 1 });
cardSchema.index({ translationId: 1 });
cardSchema.index({ categoryId: 1 });

module.exports = mongoose.model("Card", cardSchema);
