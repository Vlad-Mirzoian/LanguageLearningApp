const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  nativeLanguageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Language",
    default: null,
  },
  learningLanguagesIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      default: [],
    },
  ],
});

userSchema.index({ nativeLanguageId: 1 });
userSchema.index({ learningLanguagesIds: 1 });

module.exports = mongoose.model("User", userSchema);
