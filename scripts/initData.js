const mongoose = require("mongoose");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const Language = require("../models/Language");
const Category = require("../models/Category");
const Word = require("../models/Word");
const Card = require("../models/Card");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const userId = "68796fd52d72ec61579703d7";

const initData = async () => {
  try {
    await Language.deleteMany({});
    await Category.deleteMany({});
    await Word.deleteMany({ createdBy: userId });
    await Card.deleteMany({ userId: userId });

    // Create Languages
    const languages = [
      { code: "uk", name: "Ukrainian" },
      { code: "en", name: "English" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "es", name: "Spanish" },
    ];
    const createdLanguages = await Language.insertMany(languages);
    console.log("Created 5 languages");

    const languageMap = {};
    createdLanguages.forEach((lang) => {
      languageMap[lang.code] = lang._id;
    });

    // Create Categories
    const categories = [
      {
        name: "Greetings",
        description: "Words for greetings and introductions",
      },
      { name: "Food", description: "Words related to food and dining" },
      { name: "Travel", description: "Words for travel and transportation" },
      { name: "Work", description: "Words related to jobs and professions" },
      {
        name: "Family",
        description: "Words for family members and relationships",
      },
    ];
    const createdCategories = await Category.insertMany(categories);
    console.log("Created 5 categories");

    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    // Create Words (6 per language, 30 total)
    const words = [
      // Ukrainian
      {
        text: "привіт",
        languageId: languageMap.uk,
        categoryId: categoryMap.Greetings,
        meaning: "вітання",
        createdBy: userId,
      },
      {
        text: "дякую",
        languageId: languageMap.uk,
        categoryId: categoryMap.Greetings,
        meaning: "подяка",
        createdBy: userId,
      },
      {
        text: "хліб",
        languageId: languageMap.uk,
        categoryId: categoryMap.Food,
        meaning: "їжа з борошна",
        createdBy: userId,
      },
      {
        text: "вода",
        languageId: languageMap.uk,
        categoryId: categoryMap.Food,
        meaning: "рідина для пиття",
        createdBy: userId,
      },
      {
        text: "поїзд",
        languageId: languageMap.uk,
        categoryId: categoryMap.Travel,
        meaning: "транспорт на рейках",
        createdBy: userId,
      },
      {
        text: "літак",
        languageId: languageMap.uk,
        categoryId: null,
        meaning: "повітряний транспорт",
        createdBy: userId,
      },

      // English
      {
        text: "hello",
        languageId: languageMap.en,
        categoryId: categoryMap.Greetings,
        meaning: "greeting",
        createdBy: userId,
      },
      {
        text: "thank you",
        languageId: languageMap.en,
        categoryId: categoryMap.Greetings,
        meaning: "expression of gratitude",
        createdBy: userId,
      },
      {
        text: "bread",
        languageId: languageMap.en,
        categoryId: categoryMap.Food,
        meaning: "food made from flour",
        createdBy: userId,
      },
      {
        text: "water",
        languageId: languageMap.en,
        categoryId: categoryMap.Food,
        meaning: "drinking liquid",
        createdBy: userId,
      },
      {
        text: "train",
        languageId: languageMap.en,
        categoryId: categoryMap.Travel,
        meaning: "rail transport",
        createdBy: userId,
      },
      {
        text: "airplane",
        languageId: languageMap.en,
        categoryId: null,
        meaning: "air transport",
        createdBy: userId,
      },

      // French
      {
        text: "bonjour",
        languageId: languageMap.fr,
        categoryId: categoryMap.Greetings,
        meaning: "salutation",
        createdBy: userId,
      },
      {
        text: "merci",
        languageId: languageMap.fr,
        categoryId: categoryMap.Greetings,
        meaning: "remerciement",
        createdBy: userId,
      },
      {
        text: "pain",
        languageId: languageMap.fr,
        categoryId: categoryMap.Food,
        meaning: "aliment à base de farine",
        createdBy: userId,
      },
      {
        text: "eau",
        languageId: languageMap.fr,
        categoryId: categoryMap.Food,
        meaning: "liquide potable",
        createdBy: userId,
      },
      {
        text: "train",
        languageId: languageMap.fr,
        categoryId: categoryMap.Travel,
        meaning: "transport ferroviaire",
        createdBy: userId,
      },
      {
        text: "avion",
        languageId: languageMap.fr,
        categoryId: null,
        meaning: "transport aérien",
        createdBy: userId,
      },

      // German
      {
        text: "hallo",
        languageId: languageMap.de,
        categoryId: categoryMap.Greetings,
        meaning: "Begrüßung",
        createdBy: userId,
      },
      {
        text: "danke",
        languageId: languageMap.de,
        categoryId: categoryMap.Greetings,
        meaning: "Dank",
        createdBy: userId,
      },
      {
        text: "Brot",
        languageId: languageMap.de,
        categoryId: categoryMap.Food,
        meaning: "Nahrung aus Mehl",
        createdBy: userId,
      },
      {
        text: "Wasser",
        languageId: languageMap.de,
        categoryId: categoryMap.Food,
        meaning: "Trinkflüssigkeit",
        createdBy: userId,
      },
      {
        text: "Zug",
        languageId: languageMap.de,
        categoryId: categoryMap.Travel,
        meaning: "Schienentransport",
        createdBy: userId,
      },
      {
        text: "Flugzeug",
        languageId: languageMap.de,
        categoryId: null,
        meaning: "Lufttransport",
        createdBy: userId,
      },

      // Spanish
      {
        text: "hola",
        languageId: languageMap.es,
        categoryId: categoryMap.Greetings,
        meaning: "saludo",
        createdBy: userId,
      },
      {
        text: "gracias",
        languageId: languageMap.es,
        categoryId: categoryMap.Greetings,
        meaning: "agradecimiento",
        createdBy: userId,
      },
      {
        text: "pan",
        languageId: languageMap.es,
        categoryId: categoryMap.Food,
        meaning: "alimento de harina",
        createdBy: userId,
      },
      {
        text: "agua",
        languageId: languageMap.es,
        categoryId: categoryMap.Food,
        meaning: "líquido para beber",
        createdBy: userId,
      },
      {
        text: "tren",
        languageId: languageMap.es,
        categoryId: categoryMap.Travel,
        meaning: "transporte ferroviario",
        createdBy: userId,
      },
      {
        text: "avión",
        languageId: languageMap.es,
        categoryId: null,
        meaning: "transporte aéreo",
        createdBy: userId,
      },
    ];
    const createdWords = await Word.insertMany(words);
    console.log("Created 30 words");

    const wordMap = {};
    createdWords.forEach((word) => {
      wordMap[`${word.text}_${word.languageId}`] = word._id;
    });

    // Create Cards (15 cards, linking Ukrainian to English/French/Spanish with varied translations)
    const cards = [
      // Greetings
      {
        userId,
        wordId: wordMap[`привіт_${languageMap.uk}`],
        translationId: wordMap[`hello_${languageMap.en}`],
      },
      {
        userId,
        wordId: wordMap[`привіт_${languageMap.uk}`],
        translationId: wordMap[`bonjour_${languageMap.fr}`],
      }, // Different translation
      {
        userId,
        wordId: wordMap[`привіт_${languageMap.uk}`],
        translationId: wordMap[`hola_${languageMap.es}`],
      }, // Different translation
      {
        userId,
        wordId: wordMap[`дякую_${languageMap.uk}`],
        translationId: wordMap[`thank you_${languageMap.en}`],
      },
      {
        userId,
        wordId: wordMap[`дякую_${languageMap.uk}`],
        translationId: wordMap[`merci_${languageMap.fr}`],
      }, // Different translation

      // Food
      {
        userId,
        wordId: wordMap[`хліб_${languageMap.uk}`],
        translationId: wordMap[`bread_${languageMap.en}`],
      },
      {
        userId,
        wordId: wordMap[`хліб_${languageMap.uk}`],
        translationId: wordMap[`pain_${languageMap.fr}`],
      }, // Different translation
      {
        userId,
        wordId: wordMap[`вода_${languageMap.uk}`],
        translationId: wordMap[`water_${languageMap.en}`],
      },
      {
        userId,
        wordId: wordMap[`вода_${languageMap.uk}`],
        translationId: wordMap[`agua_${languageMap.es}`],
      }, // Different translation

      // Travel
      {
        userId,
        wordId: wordMap[`поїзд_${languageMap.uk}`],
        translationId: wordMap[`train_${languageMap.en}`],
      },
      {
        userId,
        wordId: wordMap[`поїзд_${languageMap.uk}`],
        translationId: wordMap[`train_${languageMap.fr}`],
      }, // Different translation
      {
        userId,
        wordId: wordMap[`літак_${languageMap.uk}`],
        translationId: wordMap[`airplane_${languageMap.en}`],
      },
      {
        userId,
        wordId: wordMap[`літак_${languageMap.uk}`],
        translationId: wordMap[`avión_${languageMap.es}`],
      }, // Different translation

      // Additional pairs (to reach 15)
      {
        userId,
        wordId: wordMap[`дякую_${languageMap.uk}`],
        translationId: wordMap[`gracias_${languageMap.es}`],
      }, // Different translation
      {
        userId,
        wordId: wordMap[`хліб_${languageMap.uk}`],
        translationId: wordMap[`pan_${languageMap.es}`],
      }, // Different translation
    ];
    await Card.insertMany(cards);
    console.log("Created 15 cards");

    console.log("Initialization completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }
};

initData();
