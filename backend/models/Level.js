const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },
  order: { type: Number, required: true },
  tasks: { type: String, enum: ["flash", "test", "dictation"], required: true },
  requiredScore: { type: Number, default: 80 },
});

levelSchema.index({ moduleId: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Level", levelSchema);
