const mongoose = require("mongoose");

const languageSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
});

module.exports = mongoose.model("Language", languageSchema);
