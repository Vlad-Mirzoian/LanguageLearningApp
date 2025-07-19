const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const User = require("../models/User");
const Language = require("../models/Language");
const Category = require("../models/Category");
const Word = require("../models/Word");
const Card = require("../models/Card");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const userId1 = new mongoose.Types.ObjectId(); // User 1 ID (user)
const userId2 = new mongoose.Types.ObjectId(); // User 2 ID (user)
const userId3 = new mongoose.Types.ObjectId(); // User 3 ID (admin)

const initData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Language.deleteMany({});
    await Category.deleteMany({});
    await Word.deleteMany({ createdBy: { $in: [userId1, userId2] } });
    await Card.deleteMany({ userId: { $in: [userId1, userId2] } });

    // Create Users
    const users = [
      {
        _id: userId1,
        email: "user1@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "user",
      },
      {
        _id: userId2,
        email: "user2@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "user",
      },
            {
        _id: userId3,
        email: "admin@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "admin",
      },
    ];
    const createdUsers = await User.insertMany(users);
    console.log("Created 2 users");

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

    // Assign languages to users
    await User.updateOne(
      { _id: userId1 },
      { nativeLanguageId: languageMap.uk, learningLanguagesIds: [languageMap.en] }
    );
    await User.updateOne(
      { _id: userId2 },
      { nativeLanguageId: null, learningLanguagesIds: [languageMap.fr, languageMap.es] }
    );
    console.log("Assigned languages to users");

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
        createdBy: userId1,
      },
      {
        text: "дякую",
        languageId: languageMap.uk,
        categoryId: categoryMap.Greetings,
        meaning: "подяка",
        createdBy: userId1,
      },
      {
        text: "хліб",
        languageId: languageMap.uk,
        categoryId: categoryMap.Food,
        meaning: "їжа з борошна",
        createdBy: userId1,
      },
      {
        text: "вода",
        languageId: languageMap.uk,
        categoryId: categoryMap.Food,
        meaning: "рідина для пиття",
        createdBy: userId1,
      },
      {
        text: "поїзд",
        languageId: languageMap.uk,
        categoryId: categoryMap.Travel,
        meaning: "транспорт на рейках",
        createdBy: userId1,
      },
      {
        text: "літак",
        languageId: languageMap.uk,
        categoryId: null,
        meaning: "повітряний транспорт",
        createdBy: userId1,
      },

      // English
      {
        text: "hello",
        languageId: languageMap.en,
        categoryId: categoryMap.Greetings,
        meaning: "greeting",
        createdBy: userId1,
      },
      {
        text: "thank you",
        languageId: languageMap.en,
        categoryId: categoryMap.Greetings,
        meaning: "expression of gratitude",
        createdBy: userId1,
      },
      {
        text: "bread",
        languageId: languageMap.en,
        categoryId: categoryMap.Food,
        meaning: "food made from flour",
        createdBy: userId1,
      },
      {
        text: "water",
        languageId: languageMap.en,
        categoryId: categoryMap.Food,
        meaning: "drinking liquid",
        createdBy: userId1,
      },
      {
        text: "train",
        languageId: languageMap.en,
        categoryId: categoryMap.Travel,
        meaning: "rail transport",
        createdBy: userId1,
      },
      {
        text: "airplane",
        languageId: languageMap.en,
        categoryId: null,
        meaning: "air transport",
        createdBy: userId1,
      },

      // French
      {
        text: "bonjour",
        languageId: languageMap.fr,
        categoryId: categoryMap.Greetings,
        meaning: "salutation",
        createdBy: userId2,
      },
      {
        text: "merci",
        languageId: languageMap.fr,
        categoryId: categoryMap.Greetings,
        meaning: "remerciement",
        createdBy: userId2,
      },
      {
        text: "pain",
        languageId: languageMap.fr,
        categoryId: categoryMap.Food,
        meaning: "aliment à base de farine",
        createdBy: userId2,
      },
      {
        text: "eau",
        languageId: languageMap.fr,
        categoryId: categoryMap.Food,
        meaning: "liquide potable",
        createdBy: userId2,
      },
      {
        text: "train",
        languageId: languageMap.fr,
        categoryId: categoryMap.Travel,
        meaning: "transport ferroviaire",
        createdBy: userId2,
      },
      {
        text: "avion",
        languageId: languageMap.fr,
        categoryId: null,
        meaning: "transport aérien",
        createdBy: userId2,
      },

      // German
      {
        text: "hallo",
        languageId: languageMap.de,
        categoryId: categoryMap.Greetings,
        meaning: "Begrüßung",
        createdBy: userId1,
      },
      {
        text: "danke",
        languageId: languageMap.de,
        categoryId: categoryMap.Greetings,
        meaning: "Dank",
        createdBy: userId1,
      },
      {
        text: "Brot",
        languageId: languageMap.de,
        categoryId: categoryMap.Food,
        meaning: "Nahrung aus Mehl",
        createdBy: userId1,
      },
      {
        text: "Wasser",
        languageId: languageMap.de,
        categoryId: categoryMap.Food,
        meaning: "Trinkflüssigkeit",
        createdBy: userId1,
      },
      {
        text: "Zug",
        languageId: languageMap.de,
        categoryId: categoryMap.Travel,
        meaning: "Schienentransport",
        createdBy: userId1,
      },
      {
        text: "Flugzeug",
        languageId: languageMap.de,
        categoryId: null,
        meaning: "Lufttransport",
        createdBy: userId1,
      },

      // Spanish
      {
        text: "hola",
        languageId: languageMap.es,
        categoryId: categoryMap.Greetings,
        meaning: "saludo",
        createdBy: userId2,
      },
      {
        text: "gracias",
        languageId: languageMap.es,
        categoryId: categoryMap.Greetings,
        meaning: "agradecimiento",
        createdBy: userId2,
      },
      {
        text: "pan",
        languageId: languageMap.es,
        categoryId: categoryMap.Food,
        meaning: "alimento de harina",
        createdBy: userId2,
      },
      {
        text: "agua",
        languageId: languageMap.es,
        categoryId: categoryMap.Food,
        meaning: "líquido para beber",
        createdBy: userId2,
      },
      {
        text: "tren",
        languageId: languageMap.es,
        categoryId: categoryMap.Travel,
        meaning: "transporte ferroviario",
        createdBy: userId2,
      },
      {
        text: "avión",
        languageId: languageMap.es,
        categoryId: null,
        meaning: "transporte aéreo",
        createdBy: userId2,
      },
    ];
    const createdWords = await Word.insertMany(words);
    console.log("Created 30 words");

    const wordMap = {};
    createdWords.forEach((word) => {
      wordMap[`${word.text}_${word.languageId}`] = word._id;
    });

    // Create Cards (15 for User 1: Ukrainian to English/French/Spanish, 5 for User 2: Ukrainian to French)
    const cards = [
      // User 1 Cards (Ukrainian to English/French/Spanish)
      {
        userId: userId1,
        wordId: wordMap[`привіт_${languageMap.uk}`],
        translationId: wordMap[`hello_${languageMap.en}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`привіт_${languageMap.uk}`],
        translationId: wordMap[`bonjour_${languageMap.fr}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`привіт_${languageMap.uk}`],
        translationId: wordMap[`hola_${languageMap.es}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`дякую_${languageMap.uk}`],
        translationId: wordMap[`thank you_${languageMap.en}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`дякую_${languageMap.uk}`],
        translationId: wordMap[`merci_${languageMap.fr}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`хліб_${languageMap.uk}`],
        translationId: wordMap[`bread_${languageMap.en}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`хліб_${languageMap.uk}`],
        translationId: wordMap[`pain_${languageMap.fr}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`вода_${languageMap.uk}`],
        translationId: wordMap[`water_${languageMap.en}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`вода_${languageMap.uk}`],
        translationId: wordMap[`agua_${languageMap.es}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`поїзд_${languageMap.uk}`],
        translationId: wordMap[`train_${languageMap.en}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`поїзд_${languageMap.uk}`],
        translationId: wordMap[`train_${languageMap.fr}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`літак_${languageMap.uk}`],
        translationId: wordMap[`airplane_${languageMap.en}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`літак_${languageMap.uk}`],
        translationId: wordMap[`avión_${languageMap.es}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`дякую_${languageMap.uk}`],
        translationId: wordMap[`gracias_${languageMap.es}`],
      },
      {
        userId: userId1,
        wordId: wordMap[`хліб_${languageMap.uk}`],
        translationId: wordMap[`pan_${languageMap.es}`],
      },

      // User 2 Cards (Ukrainian to French)
      {
        userId: userId2,
        wordId: wordMap[`привіт_${languageMap.uk}`],
        translationId: wordMap[`bonjour_${languageMap.fr}`],
      },
      {
        userId: userId2,
        wordId: wordMap[`дякую_${languageMap.uk}`],
        translationId: wordMap[`merci_${languageMap.fr}`],
      },
      {
        userId: userId2,
        wordId: wordMap[`хліб_${languageMap.uk}`],
        translationId: wordMap[`pain_${languageMap.fr}`],
      },
      {
        userId: userId2,
        wordId: wordMap[`вода_${languageMap.uk}`],
        translationId: wordMap[`eau_${languageMap.fr}`],
      },
      {
        userId: userId2,
        wordId: wordMap[`поїзд_${languageMap.uk}`],
        translationId: wordMap[`train_${languageMap.fr}`],
      },
    ];
    await Card.insertMany(cards);
    console.log("Created 20 cards (15 for User 1, 5 for User 2)");

    console.log("Initialization completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }
};

initData();