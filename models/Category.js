const mongoose = require("mongoose");

const categoryShema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
});

module.exports = mongoose.model("Category", categoryShema);
