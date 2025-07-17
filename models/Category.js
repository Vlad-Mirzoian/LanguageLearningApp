const mongoose = require("mongoose");

const categorySсhema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
});

module.exports = mongoose.model("Category", categorySсhema);
