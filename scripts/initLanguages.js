const mongoose = require("mongoose");
require("dotenv").config({ path: require('path').resolve(__dirname, '../.env') });
const Language = require("../models/Language");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const languages = [
  { code: 'en', name: 'English' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
];

const initLanguages = async () => {
  try {
    await Language.deleteMany({});
    await Language.insertMany(languages);
    console.log("Languages initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }
};

initLanguages();
