const mongoose = require("mongoose");

const categorySсhema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  order: { type: Number, required: true },
  requiredScore: { type: Number, default: 80 },
});

categorySсhema.index({ order: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySсhema);
