const mongoose = require("mongoose");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const Category = require("../models/Category");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const categories = [
  { name: "Greetings", description: "Words for greetings and introductions" },
  { name: "Food", description: "Words related to food and dining" },
  { name: "Animals", description: "Words for animals and pets" },
  { name: "Travel", description: "Words related to travel and transportation" },
  { name: "Family", description: "Words for family members and relationships" },
];

const initCategories = async () => {
  try {
    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log("Categories initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }
};

initCategories();
