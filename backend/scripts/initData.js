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
    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Word.deleteMany({}),
      Card.deleteMany({}),
      Language.deleteMany({}),
      Category.deleteMany({}),
    ]);
    console.log("Collections cleared");

    // Create languages
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

    // Create categories
    const categories = [
      {
        name: "Greetings",
        description: "Words for greetings and introductions",
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
      { name: "Hobbies", description: "Vocabulary for hobbies and leisure" },
      { name: "Jobs", description: "Terms related to professions and work" },
      { name: "Health", description: "Words for health and medical terms" },
      { name: "Nature", description: "Vocabulary for natural phenomena" },
      {
        name: "Technology",
        description: "Terms related to technology and devices",
      },
    ];
    const categoryDocs = await Category.insertMany(categories);
    const categoryMap = categoryDocs.reduce((map, cat, index) => {
      map[categories[index].name.toLowerCase()] = cat._id;
      return map;
    }, {});
    console.log("Categories created:", categoryDocs.length);

    // Create words (100 words, 20 per language)
    const words = [
      // Ukrainian (20 words)
      { text: "привіт", languageId: languageMap.uk },
      { text: "дякую", languageId: languageMap.uk },
      { text: "хліб", languageId: languageMap.uk },
      { text: "яблуко", languageId: languageMap.uk },
      { text: "подорож", languageId: languageMap.uk },
      { text: "літак", languageId: languageMap.uk },
      { text: "мама", languageId: languageMap.uk },
      { text: "брат", languageId: languageMap.uk },
      { text: "один", languageId: languageMap.uk },
      { text: "червоний", languageId: languageMap.uk },
      { text: "спати", languageId: languageMap.uk },
      { text: "їсти", languageId: languageMap.uk },
      { text: "кіт", languageId: languageMap.uk },
      { text: "собака", languageId: languageMap.uk },
      { text: "сонце", languageId: languageMap.uk },
      { text: "дощ", languageId: languageMap.uk },
      { text: "сорочка", languageId: languageMap.uk },
      { text: "штани", languageId: languageMap.uk },
      { text: "читання", languageId: languageMap.uk },
      { text: "лікар", languageId: languageMap.uk },
      // English (20 words)
      { text: "hello", languageId: languageMap.en },
      { text: "thank you", languageId: languageMap.en },
      { text: "bread", languageId: languageMap.en },
      { text: "apple", languageId: languageMap.en },
      { text: "travel", languageId: languageMap.en },
      { text: "airplane", languageId: languageMap.en },
      { text: "mother", languageId: languageMap.en },
      { text: "brother", languageId: languageMap.en },
      { text: "one", languageId: languageMap.en },
      { text: "red", languageId: languageMap.en },
      { text: "sleep", languageId: languageMap.en },
      { text: "eat", languageId: languageMap.en },
      { text: "cat", languageId: languageMap.en },
      { text: "dog", languageId: languageMap.en },
      { text: "sun", languageId: languageMap.en },
      { text: "rain", languageId: languageMap.en },
      { text: "shirt", languageId: languageMap.en },
      { text: "pants", languageId: languageMap.en },
      { text: "reading", languageId: languageMap.en },
      { text: "doctor", languageId: languageMap.en },
      // French (20 words)
      { text: "bonjour", languageId: languageMap.fr },
      { text: "merci", languageId: languageMap.fr },
      { text: "pain", languageId: languageMap.fr },
      { text: "pomme", languageId: languageMap.fr },
      { text: "voyage", languageId: languageMap.fr },
      { text: "avion", languageId: languageMap.fr },
      { text: "mère", languageId: languageMap.fr },
      { text: "frère", languageId: languageMap.fr },
      { text: "un", languageId: languageMap.fr },
      { text: "rouge", languageId: languageMap.fr },
      { text: "dormir", languageId: languageMap.fr },
      { text: "manger", languageId: languageMap.fr },
      { text: "chat", languageId: languageMap.fr },
      { text: "chien", languageId: languageMap.fr },
      { text: "soleil", languageId: languageMap.fr },
      { text: "pluie", languageId: languageMap.fr },
      { text: "chemise", languageId: languageMap.fr },
      { text: "pantalon", languageId: languageMap.fr },
      { text: "lecture", languageId: languageMap.fr },
      { text: "médecin", languageId: languageMap.fr },
      // German (20 words)
      { text: "hallo", languageId: languageMap.de },
      { text: "danke", languageId: languageMap.de },
      { text: "Brot", languageId: languageMap.de },
      { text: "Apfel", languageId: languageMap.de },
      { text: "Reise", languageId: languageMap.de },
      { text: "Flugzeug", languageId: languageMap.de },
      { text: "Mutter", languageId: languageMap.de },
      { text: "Bruder", languageId: languageMap.de },
      { text: "eins", languageId: languageMap.de },
      { text: "rot", languageId: languageMap.de },
      { text: "schlafen", languageId: languageMap.de },
      { text: "essen", languageId: languageMap.de },
      { text: "Katze", languageId: languageMap.de },
      { text: "Hund", languageId: languageMap.de },
      { text: "Sonne", languageId: languageMap.de },
      { text: "Regen", languageId: languageMap.de },
      { text: "Hemd", languageId: languageMap.de },
      { text: "Hose", languageId: languageMap.de },
      { text: "Lesen", languageId: languageMap.de },
      { text: "Arzt", languageId: languageMap.de },
      // Spanish (20 words)
      { text: "hola", languageId: languageMap.es },
      { text: "gracias", languageId: languageMap.es },
      { text: "pan", languageId: languageMap.es },
      { text: "manzana", languageId: languageMap.es },
      { text: "viaje", languageId: languageMap.es },
      { text: "avión", languageId: languageMap.es },
      { text: "madre", languageId: languageMap.es },
      { text: "hermano", languageId: languageMap.es },
      { text: "uno", languageId: languageMap.es },
      { text: "rojo", languageId: languageMap.es },
      { text: "dormir", languageId: languageMap.es },
      { text: "comer", languageId: languageMap.es },
      { text: "gato", languageId: languageMap.es },
      { text: "perro", languageId: languageMap.es },
      { text: "sol", languageId: languageMap.es },
      { text: "lluvia", languageId: languageMap.es },
      { text: "camisa", languageId: languageMap.es },
      { text: "pantalones", languageId: languageMap.es },
      { text: "lectura", languageId: languageMap.es },
      { text: "médico", languageId: languageMap.es },
    ];
    const wordDocs = await Word.insertMany(words);
    const wordMap = wordDocs.reduce((map, word) => {
      map[`${word.text}_${word.languageId}`] = word._id;
      return map;
    }, {});
    console.log("Words created:", wordDocs.length);

    // Create cards (60 cards, Ukrainian as base language, translations to en/fr/de/es)
    const cards = [
      // Ukrainian -> English (15 cards)
      {
        wordId: wordMap["привіт_" + languageMap.uk],
        translationId: wordMap["hello_" + languageMap.en],
        categoryId: categoryMap.greetings,
        meaning: "вітання",
      },
      {
        wordId: wordMap["дякую_" + languageMap.uk],
        translationId: wordMap["thank you_" + languageMap.en],
        categoryId: categoryMap.greetings,
        meaning: "вираження вдячності",
      },
      {
        wordId: wordMap["хліб_" + languageMap.uk],
        translationId: wordMap["bread_" + languageMap.en],
        categoryId: categoryMap.food,
        meaning: "їжа з борошна",
      },
      {
        wordId: wordMap["яблуко_" + languageMap.uk],
        translationId: wordMap["apple_" + languageMap.en],
        categoryId: categoryMap.food,
        meaning: "фрукт",
      },
      {
        wordId: wordMap["подорож_" + languageMap.uk],
        translationId: wordMap["travel_" + languageMap.en],
        categoryId: categoryMap.travel,
        meaning: "переміщення між місцями",
      },
      {
        wordId: wordMap["літак_" + languageMap.uk],
        translationId: wordMap["airplane_" + languageMap.en],
        categoryId: categoryMap.travel,
        meaning: "транспорт у повітрі",
      },
      {
        wordId: wordMap["мама_" + languageMap.uk],
        translationId: wordMap["mother_" + languageMap.en],
        categoryId: categoryMap.family,
        meaning: "мати",
      },
      {
        wordId: wordMap["брат_" + languageMap.uk],
        translationId: wordMap["brother_" + languageMap.en],
        categoryId: categoryMap.family,
        meaning: "чоловічий родич",
      },
      {
        wordId: wordMap["один_" + languageMap.uk],
        translationId: wordMap["one_" + languageMap.en],
        categoryId: categoryMap.numbers,
        meaning: "перше число",
      },
      {
        wordId: wordMap["червоний_" + languageMap.uk],
        translationId: wordMap["red_" + languageMap.en],
        categoryId: categoryMap.colors,
        meaning: "колір",
      },
      {
        wordId: wordMap["спати_" + languageMap.uk],
        translationId: wordMap["sleep_" + languageMap.en],
        categoryId: categoryMap["daily activities"],
        meaning: "відпочинок уві сні",
      },
      {
        wordId: wordMap["їсти_" + languageMap.uk],
        translationId: wordMap["eat_" + languageMap.en],
        categoryId: categoryMap["daily activities"],
        meaning: "споживання їжі",
      },
      {
        wordId: wordMap["кіт_" + languageMap.uk],
        translationId: wordMap["cat_" + languageMap.en],
        categoryId: categoryMap.animals,
        meaning: "домашня тварина",
      },
      {
        wordId: wordMap["собака_" + languageMap.uk],
        translationId: wordMap["dog_" + languageMap.en],
        categoryId: categoryMap.animals,
        meaning: "домашня тварина",
      },
      {
        wordId: wordMap["сонце_" + languageMap.uk],
        translationId: wordMap["sun_" + languageMap.en],
        categoryId: categoryMap.weather,
        meaning: "небесне тіло",
      },
      // Ukrainian -> French (15 cards)
      {
        wordId: wordMap["привіт_" + languageMap.uk],
        translationId: wordMap["bonjour_" + languageMap.fr],
        categoryId: categoryMap.greetings,
        meaning: "вітання",
      },
      {
        wordId: wordMap["дякую_" + languageMap.uk],
        translationId: wordMap["merci_" + languageMap.fr],
        categoryId: categoryMap.greetings,
        meaning: "вираження вдячності",
      },
      {
        wordId: wordMap["хліб_" + languageMap.uk],
        translationId: wordMap["pain_" + languageMap.fr],
        categoryId: categoryMap.food,
        meaning: "їжа з борошна",
      },
      {
        wordId: wordMap["яблуко_" + languageMap.uk],
        translationId: wordMap["pomme_" + languageMap.fr],
        categoryId: categoryMap.food,
        meaning: "фрукт",
      },
      {
        wordId: wordMap["подорож_" + languageMap.uk],
        translationId: wordMap["voyage_" + languageMap.fr],
        categoryId: categoryMap.travel,
        meaning: "переміщення між місцями",
      },
      {
        wordId: wordMap["літак_" + languageMap.uk],
        translationId: wordMap["avion_" + languageMap.fr],
        categoryId: categoryMap.travel,
        meaning: "транспорт у повітрі",
      },
      {
        wordId: wordMap["мама_" + languageMap.uk],
        translationId: wordMap["mère_" + languageMap.fr],
        categoryId: categoryMap.family,
        meaning: "мати",
      },
      {
        wordId: wordMap["брат_" + languageMap.uk],
        translationId: wordMap["frère_" + languageMap.fr],
        categoryId: categoryMap.family,
        meaning: "чоловічий родич",
      },
      {
        wordId: wordMap["один_" + languageMap.uk],
        translationId: wordMap["un_" + languageMap.fr],
        categoryId: categoryMap.numbers,
        meaning: "перше число",
      },
      {
        wordId: wordMap["червоний_" + languageMap.uk],
        translationId: wordMap["rouge_" + languageMap.fr],
        categoryId: categoryMap.colors,
        meaning: "колір",
      },
      {
        wordId: wordMap["спати_" + languageMap.uk],
        translationId: wordMap["dormir_" + languageMap.fr],
        categoryId: categoryMap["daily activities"],
        meaning: "відпочинок уві сні",
      },
      {
        wordId: wordMap["їсти_" + languageMap.uk],
        translationId: wordMap["manger_" + languageMap.fr],
        categoryId: categoryMap["daily activities"],
        meaning: "споживання їжі",
      },
      {
        wordId: wordMap["кіт_" + languageMap.uk],
        translationId: wordMap["chat_" + languageMap.fr],
        categoryId: categoryMap.animals,
        meaning: "домашня тварина",
      },
      {
        wordId: wordMap["собака_" + languageMap.uk],
        translationId: wordMap["chien_" + languageMap.fr],
        categoryId: categoryMap.animals,
        meaning: "домашня тварина",
      },
      {
        wordId: wordMap["сонце_" + languageMap.uk],
        translationId: wordMap["soleil_" + languageMap.fr],
        categoryId: categoryMap.weather,
        meaning: "небесне тіло",
      },
      // Ukrainian -> German (15 cards)
      {
        wordId: wordMap["привіт_" + languageMap.uk],
        translationId: wordMap["hallo_" + languageMap.de],
        categoryId: categoryMap.greetings,
        meaning: "вітання",
      },
      {
        wordId: wordMap["дякую_" + languageMap.uk],
        translationId: wordMap["danke_" + languageMap.de],
        categoryId: categoryMap.greetings,
        meaning: "вираження вдячності",
      },
      {
        wordId: wordMap["хліб_" + languageMap.uk],
        translationId: wordMap["Brot_" + languageMap.de],
        categoryId: categoryMap.food,
        meaning: "їжа з борошна",
      },
      {
        wordId: wordMap["яблуко_" + languageMap.uk],
        translationId: wordMap["Apfel_" + languageMap.de],
        categoryId: categoryMap.food,
        meaning: "фрукт",
      },
      {
        wordId: wordMap["подорож_" + languageMap.uk],
        translationId: wordMap["Reise_" + languageMap.de],
        categoryId: categoryMap.travel,
        meaning: "переміщення між місцями",
      },
      {
        wordId: wordMap["літак_" + languageMap.uk],
        translationId: wordMap["Flugzeug_" + languageMap.de],
        categoryId: categoryMap.travel,
        meaning: "транспорт у повітрі",
      },
      {
        wordId: wordMap["мама_" + languageMap.uk],
        translationId: wordMap["Mutter_" + languageMap.de],
        categoryId: categoryMap.family,
        meaning: "мати",
      },
      {
        wordId: wordMap["брат_" + languageMap.uk],
        translationId: wordMap["Bruder_" + languageMap.de],
        categoryId: categoryMap.family,
        meaning: "чоловічий родич",
      },
      {
        wordId: wordMap["один_" + languageMap.uk],
        translationId: wordMap["eins_" + languageMap.de],
        categoryId: categoryMap.numbers,
        meaning: "перше число",
      },
      {
        wordId: wordMap["червоний_" + languageMap.uk],
        translationId: wordMap["rot_" + languageMap.de],
        categoryId: categoryMap.colors,
        meaning: "колір",
      },
      {
        wordId: wordMap["спати_" + languageMap.uk],
        translationId: wordMap["schlafen_" + languageMap.de],
        categoryId: categoryMap["daily activities"],
        meaning: "відпочинок уві сні",
      },
      {
        wordId: wordMap["їсти_" + languageMap.uk],
        translationId: wordMap["essen_" + languageMap.de],
        categoryId: categoryMap["daily activities"],
        meaning: "споживання їжі",
      },
      {
        wordId: wordMap["кіт_" + languageMap.uk],
        translationId: wordMap["Katze_" + languageMap.de],
        categoryId: categoryMap.animals,
        meaning: "домашня тварина",
      },
      {
        wordId: wordMap["собака_" + languageMap.uk],
        translationId: wordMap["Hund_" + languageMap.de],
        categoryId: categoryMap.animals,
        meaning: "домашня тварина",
      },
      {
        wordId: wordMap["сонце_" + languageMap.uk],
        translationId: wordMap["Sonne_" + languageMap.de],
        categoryId: categoryMap.weather,
        meaning: "небесне тіло",
      },
      // Ukrainian -> Spanish (15 cards)
      {
        wordId: wordMap["привіт_" + languageMap.uk],
        translationId: wordMap["hola_" + languageMap.es],
        categoryId: categoryMap.greetings,
        meaning: "вітання",
      },
      {
        wordId: wordMap["дякую_" + languageMap.uk],
        translationId: wordMap["gracias_" + languageMap.es],
        categoryId: categoryMap.greetings,
        meaning: "вираження вдячності",
      },
      {
        wordId: wordMap["хліб_" + languageMap.uk],
        translationId: wordMap["pan_" + languageMap.es],
        categoryId: categoryMap.food,
        meaning: "їжа з борошна",
      },
      {
        wordId: wordMap["яблуко_" + languageMap.uk],
        translationId: wordMap["manzana_" + languageMap.es],
        categoryId: categoryMap.food,
        meaning: "фрукт",
      },
      {
        wordId: wordMap["подорож_" + languageMap.uk],
        translationId: wordMap["viaje_" + languageMap.es],
        categoryId: categoryMap.travel,
        meaning: "переміщення між місцями",
      },
      {
        wordId: wordMap["літак_" + languageMap.uk],
        translationId: wordMap["avión_" + languageMap.es],
        categoryId: categoryMap.travel,
        meaning: "транспорт у повітрі",
      },
      {
        wordId: wordMap["мама_" + languageMap.uk],
        translationId: wordMap["madre_" + languageMap.es],
        categoryId: categoryMap.family,
        meaning: "мати",
      },
      {
        wordId: wordMap["брат_" + languageMap.uk],
        translationId: wordMap["hermano_" + languageMap.es],
        categoryId: categoryMap.family,
        meaning: "чоловічий родич",
      },
      {
        wordId: wordMap["один_" + languageMap.uk],
        translationId: wordMap["uno_" + languageMap.es],
        categoryId: categoryMap.numbers,
        meaning: "перше число",
      },
      {
        wordId: wordMap["червоний_" + languageMap.uk],
        translationId: wordMap["rojo_" + languageMap.es],
        categoryId: categoryMap.colors,
        meaning: "колір",
      },
      {
        wordId: wordMap["спати_" + languageMap.uk],
        translationId: wordMap["dormir_" + languageMap.es],
        categoryId: categoryMap["daily activities"],
        meaning: "відпочинок уві сні",
      },
      {
        wordId: wordMap["їсти_" + languageMap.uk],
        translationId: wordMap["comer_" + languageMap.es],
        categoryId: categoryMap["daily activities"],
        meaning: "споживання їжі",
      },
      {
        wordId: wordMap["кіт_" + languageMap.uk],
        translationId: wordMap["gato_" + languageMap.es],
        categoryId: categoryMap.animals,
        meaning: "домашня тварина",
      },
      {
        wordId: wordMap["собака_" + languageMap.uk],
        translationId: wordMap["perro_" + languageMap.es],
        categoryId: categoryMap.animals,
        meaning: "домашня тварина",
      },
      {
        wordId: wordMap["сонце_" + languageMap.uk],
        translationId: wordMap["sol_" + languageMap.es],
        categoryId: categoryMap.weather,
        meaning: "небесне тіло",
      },
    ];
    const cardDocs = await Card.insertMany(cards);
    console.log("Cards created:", cardDocs.length);

    // Create users
    const hashedPassword = await bcrypt.hash("password123", 10);
    const users = [
      {
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
        nativeLanguageId: languageMap.uk,
        learningLanguagesIds: [
          languageMap.en,
          languageMap.fr,
          languageMap.de,
          languageMap.es,
        ],
        isVerified: true,
      },
      {
        email: "test@example.com",
        password: hashedPassword,
        role: "user",
        nativeLanguageId: languageMap.uk,
        learningLanguagesIds: [
          languageMap.en,
          languageMap.fr,
          languageMap.de,
          languageMap.es,
        ],
        isVerified: true,
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
