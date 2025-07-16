const mongoose = require("mongoose");

const categorySсhema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
});

categorySсhema.index({ userId: 1 });

module.exports = mongoose.model("Category", categorySсhema);
