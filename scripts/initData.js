const mongoose = require("mongoose");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Word = require("../models/Word");
const Card = require("../models/Card");
const Language = require("../models/Language");
const Category = require("../models/Category");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const initData = async () => {
  try {
    // Очистка существующих коллекций
    await Promise.all([
      User.deleteMany({}),
      Word.deleteMany({}),
      Card.deleteMany({}),
      Language.deleteMany({}),
      Category.deleteMany({}),
    ]);
    console.log("Collections cleared");

    // Создание языков
    const languages = [
      { code: "uk", name: "Ukrainian" },
      { code: "en", name: "English" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "es", name: "Spanish" },
    ];
    const languageDocs = await Language.insertMany(languages);
    const languageMap = languageDocs.reduce((map, lang) => {
      map[lang.code] = lang._id;
      return map;
    }, {});
    console.log("Languages created:", languageDocs.length);

    // Создание категорий (на английском)
    const categories = [
      {
        name: "Greetings",
        description: "Words and phrases for greetings and introductions",
      },
      { name: "Food", description: "Vocabulary related to food and dining" },
      { name: "Travel", description: "Words for travel and transportation" },
      {
        name: "Family",
        description: "Terms related to family and relationships",
      },
      { name: "Numbers", description: "Numbers and counting vocabulary" },
      { name: "Colors", description: "Words for colors and descriptions" },
      {
        name: "Daily Activities",
        description: "Phrases for everyday activities",
      },
      { name: "Animals", description: "Vocabulary related to animals" },
      { name: "Weather", description: "Terms for weather and climate" },
      { name: "Clothing", description: "Words for clothing and fashion" },
    ];
    const categoryDocs = await Category.insertMany(categories);
    const categoryMap = categoryDocs.reduce((map, cat, index) => {
      map[categories[index].name.toLowerCase()] = cat._id;
      return map;
    }, {});
    console.log("Categories created:", categoryDocs.length);

    // Создание слов (по 10 слов на язык, с meaning на том же языке)
    const words = [
      // Ukrainian
      {
        text: "привіт",
        languageId: languageMap.uk,
        categoryId: categoryMap.greetings,
        meaning: "вітання",
      },
      {
        text: "дякую",
        languageId: languageMap.uk,
        categoryId: categoryMap.greetings,
        meaning: "вираження вдячності",
      },
      {
        text: "хліб",
        languageId: languageMap.uk,
        categoryId: categoryMap.food,
        meaning: "їжа з борошна",
      },
      {
        text: "яблуко",
        languageId: languageMap.uk,
        categoryId: categoryMap.food,
        meaning: "фрукт",
      },
      {
        text: "подорож",
        languageId: languageMap.uk,
        categoryId: categoryMap.travel,
        meaning: "переміщення між місцями",
      },
      {
        text: "літак",
        languageId: languageMap.uk,
        categoryId: categoryMap.travel,
        meaning: "транспорт у повітрі",
      },
      {
        text: "мама",
        languageId: languageMap.uk,
        categoryId: categoryMap.family,
        meaning: "мати",
      },
      {
        text: "брат",
        languageId: languageMap.uk,
        categoryId: categoryMap.family,
        meaning: "чоловічий родич",
      },
      {
        text: "один",
        languageId: languageMap.uk,
        categoryId: categoryMap.numbers,
        meaning: "перше число",
      },
      {
        text: "червоний",
        languageId: languageMap.uk,
        categoryId: categoryMap.colors,
        meaning: "колір",
      },
      // English
      {
        text: "hello",
        languageId: languageMap.en,
        categoryId: categoryMap.greetings,
        meaning: "greeting",
      },
      {
        text: "thank you",
        languageId: languageMap.en,
        categoryId: categoryMap.greetings,
        meaning: "expression of gratitude",
      },
      {
        text: "bread",
        languageId: languageMap.en,
        categoryId: categoryMap.food,
        meaning: "food made from flour",
      },
      {
        text: "apple",
        languageId: languageMap.en,
        categoryId: categoryMap.food,
        meaning: "fruit",
      },
      {
        text: "travel",
        languageId: languageMap.en,
        categoryId: categoryMap.travel,
        meaning: "movement between places",
      },
      {
        text: "airplane",
        languageId: languageMap.en,
        categoryId: categoryMap.travel,
        meaning: "air transport",
      },
      {
        text: "mother",
        languageId: languageMap.en,
        categoryId: categoryMap.family,
        meaning: "female parent",
      },
      {
        text: "brother",
        languageId: languageMap.en,
        categoryId: categoryMap.family,
        meaning: "male sibling",
      },
      {
        text: "one",
        languageId: languageMap.en,
        categoryId: categoryMap.numbers,
        meaning: "first number",
      },
      {
        text: "red",
        languageId: languageMap.en,
        categoryId: categoryMap.colors,
        meaning: "color",
      },
      // French
      {
        text: "bonjour",
        languageId: languageMap.fr,
        categoryId: categoryMap.greetings,
        meaning: "salutation",
      },
      {
        text: "merci",
        languageId: languageMap.fr,
        categoryId: categoryMap.greetings,
        meaning: "expression de gratitude",
      },
      {
        text: "pain",
        languageId: languageMap.fr,
        categoryId: categoryMap.food,
        meaning: "aliment à base de farine",
      },
      {
        text: "pomme",
        languageId: languageMap.fr,
        categoryId: categoryMap.food,
        meaning: "fruit",
      },
      {
        text: "voyage",
        languageId: languageMap.fr,
        categoryId: categoryMap.travel,
        meaning: "déplacement entre lieux",
      },
      {
        text: "avion",
        languageId: languageMap.fr,
        categoryId: categoryMap.travel,
        meaning: "transport aérien",
      },
      {
        text: "mère",
        languageId: languageMap.fr,
        categoryId: categoryMap.family,
        meaning: "parent féminin",
      },
      {
        text: "frère",
        languageId: languageMap.fr,
        categoryId: categoryMap.family,
        meaning: "frère masculin",
      },
      {
        text: "un",
        languageId: languageMap.fr,
        categoryId: categoryMap.numbers,
        meaning: "premier nombre",
      },
      {
        text: "rouge",
        languageId: languageMap.fr,
        categoryId: categoryMap.colors,
        meaning: "couleur",
      },
      // German
      {
        text: "hallo",
        languageId: languageMap.de,
        categoryId: categoryMap.greetings,
        meaning: "Gruß",
      },
      {
        text: "danke",
        languageId: languageMap.de,
        categoryId: categoryMap.greetings,
        meaning: "Ausdruck der Dankbarkeit",
      },
      {
        text: "Brot",
        languageId: languageMap.de,
        categoryId: categoryMap.food,
        meaning: "Nahrung aus Mehl",
      },
      {
        text: "Apfel",
        languageId: languageMap.de,
        categoryId: categoryMap.food,
        meaning: "Frucht",
      },
      {
        text: "Reise",
        languageId: languageMap.de,
        categoryId: categoryMap.travel,
        meaning: "Bewegung zwischen Orten",
      },
      {
        text: "Flugzeug",
        languageId: languageMap.de,
        categoryId: categoryMap.travel,
        meaning: "Lufttransport",
      },
      {
        text: "Mutter",
        languageId: languageMap.de,
        categoryId: categoryMap.family,
        meaning: "weiblicher Elternteil",
      },
      {
        text: "Bruder",
        languageId: languageMap.de,
        categoryId: categoryMap.family,
        meaning: "männliches Geschwisterkind",
      },
      {
        text: "eins",
        languageId: languageMap.de,
        categoryId: categoryMap.numbers,
        meaning: "erste Zahl",
      },
      {
        text: "rot",
        languageId: languageMap.de,
        categoryId: categoryMap.colors,
        meaning: "Farbe",
      },
      // Spanish
      {
        text: "hola",
        languageId: languageMap.es,
        categoryId: categoryMap.greetings,
        meaning: "saludo",
      },
      {
        text: "gracias",
        languageId: languageMap.es,
        categoryId: categoryMap.greetings,
        meaning: "expresión de gratitud",
      },
      {
        text: "pan",
        languageId: languageMap.es,
        categoryId: categoryMap.food,
        meaning: "alimento de harina",
      },
      {
        text: "manzana",
        languageId: languageMap.es,
        categoryId: categoryMap.food,
        meaning: "fruta",
      },
      {
        text: "viaje",
        languageId: languageMap.es,
        categoryId: categoryMap.travel,
        meaning: "movimiento entre lugares",
      },
      {
        text: "avión",
        languageId: languageMap.es,
        categoryId: categoryMap.travel,
        meaning: "transporte aéreo",
      },
      {
        text: "madre",
        languageId: languageMap.es,
        categoryId: categoryMap.family,
        meaning: "progenitor femenino",
      },
      {
        text: "hermano",
        languageId: languageMap.es,
        categoryId: categoryMap.family,
        meaning: "hermano masculino",
      },
      {
        text: "uno",
        languageId: languageMap.es,
        categoryId: categoryMap.numbers,
        meaning: "primer número",
      },
      {
        text: "rojo",
        languageId: languageMap.es,
        categoryId: categoryMap.colors,
        meaning: "color",
      },
    ];
    const wordDocs = await Word.insertMany(words);
    const wordMap = wordDocs.reduce((map, word) => {
      map[`${word.text}_${word.languageId}`] = word._id;
      return map;
    }, {});
    console.log("Words created:", wordDocs.length);

    // Создание карточек (wordId: украинский, translationId: en/fr/de/es)
    const cards = [
      // Ukrainian -> English
      {
        wordId: wordMap["привіт_" + languageMap.uk],
        translationId: wordMap["hello_" + languageMap.en],
      },
      {
        wordId: wordMap["дякую_" + languageMap.uk],
        translationId: wordMap["thank you_" + languageMap.en],
      },
      {
        wordId: wordMap["хліб_" + languageMap.uk],
        translationId: wordMap["bread_" + languageMap.en],
      },
      {
        wordId: wordMap["яблуко_" + languageMap.uk],
        translationId: wordMap["apple_" + languageMap.en],
      },
      {
        wordId: wordMap["подорож_" + languageMap.uk],
        translationId: wordMap["travel_" + languageMap.en],
      },
      {
        wordId: wordMap["літак_" + languageMap.uk],
        translationId: wordMap["airplane_" + languageMap.en],
      },
      {
        wordId: wordMap["мама_" + languageMap.uk],
        translationId: wordMap["mother_" + languageMap.en],
      },
      {
        wordId: wordMap["брат_" + languageMap.uk],
        translationId: wordMap["brother_" + languageMap.en],
      },
      {
        wordId: wordMap["один_" + languageMap.uk],
        translationId: wordMap["one_" + languageMap.en],
      },
      {
        wordId: wordMap["червоний_" + languageMap.uk],
        translationId: wordMap["red_" + languageMap.en],
      },
      // Ukrainian -> French
      {
        wordId: wordMap["привіт_" + languageMap.uk],
        translationId: wordMap["bonjour_" + languageMap.fr],
      },
      {
        wordId: wordMap["дякую_" + languageMap.uk],
        translationId: wordMap["merci_" + languageMap.fr],
      },
      {
        wordId: wordMap["хліб_" + languageMap.uk],
        translationId: wordMap["pain_" + languageMap.fr],
      },
      {
        wordId: wordMap["яблуко_" + languageMap.uk],
        translationId: wordMap["pomme_" + languageMap.fr],
      },
      {
        wordId: wordMap["подорож_" + languageMap.uk],
        translationId: wordMap["voyage_" + languageMap.fr],
      },
      {
        wordId: wordMap["літак_" + languageMap.uk],
        translationId: wordMap["avion_" + languageMap.fr],
      },
      {
        wordId: wordMap["мама_" + languageMap.uk],
        translationId: wordMap["mère_" + languageMap.fr],
      },
      {
        wordId: wordMap["брат_" + languageMap.uk],
        translationId: wordMap["frère_" + languageMap.fr],
      },
      {
        wordId: wordMap["один_" + languageMap.uk],
        translationId: wordMap["un_" + languageMap.fr],
      },
      {
        wordId: wordMap["червоний_" + languageMap.uk],
        translationId: wordMap["rouge_" + languageMap.fr],
      },
      // Ukrainian -> German
      {
        wordId: wordMap["привіт_" + languageMap.uk],
        translationId: wordMap["hallo_" + languageMap.de],
      },
      {
        wordId: wordMap["дякую_" + languageMap.uk],
        translationId: wordMap["danke_" + languageMap.de],
      },
      {
        wordId: wordMap["хліб_" + languageMap.uk],
        translationId: wordMap["Brot_" + languageMap.de],
      },
      {
        wordId: wordMap["яблуко_" + languageMap.uk],
        translationId: wordMap["Apfel_" + languageMap.de],
      },
      {
        wordId: wordMap["подорож_" + languageMap.uk],
        translationId: wordMap["Reise_" + languageMap.de],
      },
      // Ukrainian -> Spanish
      {
        wordId: wordMap["привіт_" + languageMap.uk],
        translationId: wordMap["hola_" + languageMap.es],
      },
      {
        wordId: wordMap["дякую_" + languageMap.uk],
        translationId: wordMap["gracias_" + languageMap.es],
      },
      {
        wordId: wordMap["хліб_" + languageMap.uk],
        translationId: wordMap["pan_" + languageMap.es],
      },
      {
        wordId: wordMap["яблуко_" + languageMap.uk],
        translationId: wordMap["manzana_" + languageMap.es],
      },
      {
        wordId: wordMap["подорож_" + languageMap.uk],
        translationId: wordMap["viaje_" + languageMap.es],
      },
    ];
    const cardDocs = await Card.insertMany(cards);
    console.log("Cards created:", cardDocs.length);

    // Создание пользователей
    const hashedPassword = await bcrypt.hash("password123", 10);
    const users = [
      {
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
        nativeLanguageId: languageMap.uk,
        learningLanguagesIds: [languageMap.en, languageMap.fr],
      },
      {
        email: "user1@example.com",
        password: hashedPassword,
        role: "user",
        nativeLanguageId: languageMap.uk,
        learningLanguagesIds: [languageMap.en],
      },
      {
        email: "user2@example.com",
        password: hashedPassword,
        role: "user",
        nativeLanguageId: languageMap.uk,
        learningLanguagesIds: [languageMap.fr, languageMap.de],
      },
      {
        email: "user3@example.com",
        password: hashedPassword,
        role: "user",
        nativeLanguageId: languageMap.en,
        learningLanguagesIds: [languageMap.fr],
      },
      {
        email: "user4@example.com",
        password: hashedPassword,
        role: "user",
        nativeLanguageId: languageMap.fr,
        learningLanguagesIds: [languageMap.es, languageMap.de],
      },
    ];
    const userDocs = await User.insertMany(users);
    console.log("Users created:", userDocs.length);

    console.log("Initialization completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }
};

initData();
