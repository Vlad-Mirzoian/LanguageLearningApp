const mongoose = require("mongoose");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const Word = require("../models/Word");
const Language = require("../models/Language");
const Category = require("../models/Category");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const initWords = async () => {
  try {
    const languages = await Language.find();
    if (languages.length < 5) {
      console.error("Not enough languages. Run initLanguages.js first.");
      process.exit(1);
    }

    const categories = await Category.find();
    if (categories.length < 5) {
      console.error("Not enough categories. Run initCategories.js first.");
      process.exit(1);
    }

    const languageMap = {
      en: languages.find((lang) => lang.code === "en")._id,
      uk: languages.find((lang) => lang.code === "uk")._id,
      es: languages.find((lang) => lang.code === "es")._id,
      fr: languages.find((lang) => lang.code === "fr")._id,
      de: languages.find((lang) => lang.code === "de")._id,
    };

    const categoryMap = {
      greetings: categories.find((cat) => cat.name === "Greetings")._id,
      food: categories.find((cat) => cat.name === "Food")._id,
      animals: categories.find((cat) => cat.name === "Animals")._id,
      travel: categories.find((cat) => cat.name === "Travel")._id,
      family: categories.find((cat) => cat.name === "Family")._id,
    };

    const words = [
      // English (5 words)
      {
        text: "hello",
        languageId: languageMap.en,
        categoryId: categoryMap.greetings,
        meaning: "A word used to greet someone",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "apple",
        languageId: languageMap.en,
        categoryId: categoryMap.food,
        meaning: "A common fruit",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "dog",
        languageId: languageMap.en,
        categoryId: categoryMap.animals,
        meaning: "A domesticated animal",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "train",
        languageId: languageMap.en,
        categoryId: categoryMap.travel,
        meaning: "A vehicle for long-distance travel",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "mother",
        languageId: languageMap.en,
        categoryId: categoryMap.family,
        meaning: "A female parent",
        createdBy: "68796fd52d72ec61579703d7",
      },

      // Ukrainian (5 words)
      {
        text: "привіт",
        languageId: languageMap.uk,
        categoryId: categoryMap.greetings,
        meaning: "Слово для привітання",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "яблуко",
        languageId: languageMap.uk,
        categoryId: categoryMap.food,
        meaning: "Поширений фрукт",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "собака",
        languageId: languageMap.uk,
        categoryId: categoryMap.animals,
        meaning: "Домашня тварина",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "поїзд",
        languageId: languageMap.uk,
        categoryId: categoryMap.travel,
        meaning: "Транспорт для далеких поїздок",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "мати",
        languageId: languageMap.uk,
        categoryId: categoryMap.family,
        meaning: "Жіночий батьківський зв’язок",
        createdBy: "68796fd52d72ec61579703d7",
      },

      // Spanish (5 words)
      {
        text: "hola",
        languageId: languageMap.es,
        categoryId: categoryMap.greetings,
        meaning: "Una palabra para saludar",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "manzana",
        languageId: languageMap.es,
        categoryId: categoryMap.food,
        meaning: "Una fruta común",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "perro",
        languageId: languageMap.es,
        categoryId: categoryMap.animals,
        meaning: "Un animal doméstico",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "tren",
        languageId: languageMap.es,
        categoryId: categoryMap.travel,
        meaning: "Un vehículo para viajes largos",
        createdBy: "68796fd52d72ec61579703d7",
      },
      {
        text: "madre",
        languageId: languageMap.es,
        categoryId: null,
        meaning: "Una progenitora femenina",
        createdBy: "68796fd52d72ec61579703d7",
      },

      // French (5 words)
      {
        text: "bonjour",
        languageId: languageMap.fr,
        categoryId: categoryMap.greetings,
        meaning: "Un mot pour saluer",
        createdBy: "68797474ef4b8c328f010382",
      },
      {
        text: "pomme",
        languageId: languageMap.fr,
        categoryId: categoryMap.food,
        meaning: "Un fruit commun",
        createdBy: "68797474ef4b8c328f010382",
      },
      {
        text: "chien",
        languageId: languageMap.fr,
        categoryId: categoryMap.animals,
        meaning: "Un animal domestique",
        createdBy: "68797474ef4b8c328f010382",
      },
      {
        text: "train",
        languageId: languageMap.fr,
        categoryId: categoryMap.travel,
        meaning: "Un véhicule pour les longs voyages",
        createdBy: "68797474ef4b8c328f010382",
      },
      {
        text: "mère",
        languageId: languageMap.fr,
        categoryId: null,
        meaning: "Une parente féminine",
        createdBy: "68797474ef4b8c328f010382",
      },

      // German (5 words)
      {
        text: "hallo",
        languageId: languageMap.de,
        categoryId: categoryMap.greetings,
        meaning: "Ein Wort zum Grüßen",
        createdBy: "68797474ef4b8c328f010382",
      },
      {
        text: "apfel",
        languageId: languageMap.de,
        categoryId: categoryMap.food,
        meaning: "Eine häufige Frucht",
        createdBy: "68797474ef4b8c328f010382",
      },
      {
        text: "hund",
        languageId: languageMap.de,
        categoryId: categoryMap.animals,
        meaning: "Ein Haustier",
        createdBy: "68797474ef4b8c328f010382",
      },
      {
        text: "zug",
        languageId: languageMap.de,
        categoryId: categoryMap.travel,
        meaning: "Ein Fahrzeug für weite Reisen",
        createdBy: "68797474ef4b8c328f010382",
      },
      {
        text: "mutter",
        languageId: languageMap.de,
        categoryId: null,
        meaning: "Eine weibliche Elternperson",
        createdBy: "68797474ef4b8c328f010382",
      },
    ];

    const existingWords = await Word.find();
    if (existingWords.length > 0) {
      console.log("Words already exist");
      process.exit(0);
    }

    await Word.insertMany(words);
    console.log("Words created:", words.length);
    process.exit(0);
  } catch (error) {
    console.error("Error creating words:", error);
    process.exit(1);
  }
};

initWords();
