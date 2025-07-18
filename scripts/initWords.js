const mongoose = require("mongoose");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const Word = require("../models/Word");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const words = [
  // Ukrainian (uk)
  {
    text: "привіт",
    languageId: "687a55cc37a24b457cdc8c90",
    meaning: "вітання",
    createdBy: "68796fd52d72ec61579703d7",
  },
  {
    text: "дякую",
    languageId: "687a55cc37a24b457cdc8c90",
    meaning: "вираз подяки",
    createdBy: "68796fd52d72ec61579703d7",
  },
  {
    text: "книга",
    languageId: "687a55cc37a24b457cdc8c90",
    meaning: "друковане видання",
    createdBy: "68796fd52d72ec61579703d7",
  },
  {
    text: "сонце",
    languageId: "687a55cc37a24b457cdc8c90",
    meaning: "зоря в центрі сонячної системи",
    createdBy: "68796fd52d72ec61579703d7",
  },
  {
    text: "друг",
    languageId: "687a55cc37a24b457cdc8c90",
    meaning: "близька людина",
    createdBy: "68796fd52d72ec61579703d7",
  },
  // English (en)
  {
    text: "hello",
    languageId: "687a55cc37a24b457cdc8c91",
    meaning: "greeting",
    createdBy: "68796fd52d72ec61579703d7",
  },
  {
    text: "thank you",
    languageId: "687a55cc37a24b457cdc8c91",
    meaning: "expression of gratitude",
    createdBy: "68796fd52d72ec61579703d7",
  },
  {
    text: "book",
    languageId: "687a55cc37a24b457cdc8c91",
    meaning: "written or printed work",
    createdBy: "68796fd52d72ec61579703d7",
  },
  {
    text: "sun",
    languageId: "687a55cc37a24b457cdc8c91",
    meaning: "star at the center of the solar system",
    createdBy: "68796fd52d72ec61579703d7",
  },
  {
    text: "friend",
    languageId: "687a55cc37a24b457cdc8c91",
    meaning: "close person you enjoy being with",
    createdBy: "68796fd52d72ec61579703d7",
  },
  // French (fr)
  {
    text: "bonjour",
    languageId: "687a55cc37a24b457cdc8c92",
    meaning: "salutation",
    createdBy: "68797474ef4b8c328f010382",
  },
  {
    text: "merci",
    languageId: "687a55cc37a24b457cdc8c92",
    meaning: "expression de gratitude",
    createdBy: "68797474ef4b8c328f010382",
  },
  {
    text: "livre",
    languageId: "687a55cc37a24b457cdc8c92",
    meaning: "œuvre imprimée",
    createdBy: "68797474ef4b8c328f010382",
  },
  {
    text: "soleil",
    languageId: "687a55cc37a24b457cdc8c92",
    meaning: "étoile du système solaire",
    createdBy: "68797474ef4b8c328f010382",
  },
  {
    text: "ami",
    languageId: "687a55cc37a24b457cdc8c92",
    meaning: "personne proche",
    createdBy: "68797474ef4b8c328f010382",
  },
  // Spanish (es)
  {
    text: "hola",
    languageId: "687a55cc37a24b457cdc8c93",
    meaning: "saludo",
    createdBy: "68797474ef4b8c328f010382",
  },
  {
    text: "gracias",
    languageId: "687a55cc37a24b457cdc8c93",
    meaning: "expresión de gratitud",
    createdBy: "68797474ef4b8c328f010382",
  },
  {
    text: "libro",
    languageId: "687a55cc37a24b457cdc8c93",
    meaning: "obra escrita o impresa",
    createdBy: "68797474ef4b8c328f010382",
  },
  {
    text: "sol",
    languageId: "687a55cc37a24b457cdc8c93",
    meaning: "estrella del sistema solar",
    createdBy: "68797474ef4b8c328f010382",
  },
  {
    text: "amigo",
    languageId: "687a55cc37a24b457cdc8c93",
    meaning: "persona cercana",
    createdBy: "68797474ef4b8c328f010382",
  },
];

const initWords = async () => {
  try {
    await Word.deleteMany({});
    await Word.insertMany(words);
    console.log("Words initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }
};

initWords();
