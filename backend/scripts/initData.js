const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const User = require("../models/User");
const Language = require("../models/Language");
const Category = require("../models/Category");
const Word = require("../models/Word");
const Card = require("../models/Card");
const UserProgress = require("../models/UserProgress");

async function initDB() {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Language.deleteMany({}),
      Category.deleteMany({}),
      Word.deleteMany({}),
      Card.deleteMany({}),
      UserProgress.deleteMany({}),
    ]);

    // Create Languages
    const languages = [
      { code: "uk", name: "Ukrainian" },
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
    ];
    const createdLanguages = await Language.insertMany(languages);
    const ukrainianLang = createdLanguages.find((lang) => lang.code === "uk");
    const otherLangIds = createdLanguages
      .filter((lang) => lang.code !== "uk")
      .map((lang) => lang._id);

    // Create Users with hashed passwords
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("password123", saltRounds);
    const users = [
      {
        email: "user@example.com",
        username: "test_user",
        password: hashedPassword,
        role: "user",
        isVerified: true,
        nativeLanguageId: ukrainianLang._id,
        learningLanguagesIds: otherLangIds,
      },
      {
        email: "admin@example.com",
        username: "test_admin",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        nativeLanguageId: ukrainianLang._id,
        learningLanguagesIds: otherLangIds,
      },
    ];
    const createdUsers = await User.insertMany(users);

    // Create Categories (10 general categories, shared across all languages)
    const categories = [
      { name: "Vocabulary", order: 1, description: "Basic everyday words" },
      {
        name: "Food",
        order: 2,
        description: "Words related to food and cooking",
      },
      {
        name: "Travel",
        order: 3,
        description: "Travel and tourism vocabulary",
      },
      { name: "Family", order: 4, description: "Family and relationships" },
      {
        name: "Nature",
        order: 5,
        description: "Words about nature and environment",
      },
      {
        name: "Work",
        order: 6,
        description: "Work and profession-related words",
      },
      { name: "Clothing", order: 7, description: "Clothing and fashion terms" },
      {
        name: "Weather",
        order: 8,
        description: "Weather and climate vocabulary",
      },
      { name: "Emotions", order: 9, description: "Words describing feelings" },
      { name: "Technology", order: 10, description: "Tech-related vocabulary" },
    ];
    const createdCategories = await Category.insertMany(categories);

    // Create Words (125 words, ~25 per language)
    const words = [];
    const wordSets = {
      uk: [
        "дім",
        "книга",
        "дерево",
        "сонце",
        "місяць",
        "вода",
        "небо",
        "вітер",
        "квітка",
        "птах",
        "друг",
        "любов",
        "час",
        "шлях",
        "світ",
        "рука",
        "око",
        "серце",
        "голова",
        "ніч",
        "день",
        "життя",
        "мрія",
        "земля",
        "зірка",
      ],
      en: [
        "house",
        "book",
        "tree",
        "sun",
        "moon",
        "water",
        "sky",
        "wind",
        "flower",
        "bird",
        "friend",
        "love",
        "time",
        "path",
        "world",
        "hand",
        "eye",
        "heart",
        "head",
        "night",
        "day",
        "life",
        "dream",
        "earth",
        "star",
      ],
      es: [
        "casa",
        "libro",
        "árbol",
        "sol",
        "luna",
        "agua",
        "cielo",
        "viento",
        "flor",
        "pájaro",
        "amigo",
        "amor",
        "tiempo",
        "camino",
        "mundo",
        "mano",
        "ojo",
        "corazón",
        "cabeza",
        "noche",
        "día",
        "vida",
        "sueño",
        "tierra",
        "estrella",
      ],
      fr: [
        "maison",
        "livre",
        "arbre",
        "soleil",
        "lune",
        "eau",
        "ciel",
        "vent",
        "fleur",
        "oiseau",
        "ami",
        "amour",
        "temps",
        "chemin",
        "monde",
        "main",
        "œil",
        "cœur",
        "tête",
        "nuit",
        "jour",
        "vie",
        "rêve",
        "terre",
        "étoile",
      ],
      de: [
        "Haus",
        "Buch",
        "Baum",
        "Sonne",
        "Mond",
        "Wasser",
        "Himmel",
        "Wind",
        "Blume",
        "Vogel",
        "Freund",
        "Liebe",
        "Zeit",
        "Weg",
        "Welt",
        "Hand",
        "Auge",
        "Herz",
        "Kopf",
        "Nacht",
        "Tag",
        "Leben",
        "Traum",
        "Erde",
        "Stern",
      ],
    };

    for (const lang of createdLanguages) {
      const langWords = wordSets[lang.code].map((text) => ({
        text,
        languageId: lang._id,
      }));
      words.push(...langWords);
    }
    const createdWords = await Word.insertMany(words);

    // Create Cards (100 cards, Ukrainian to each learning language)
    const cards = [];
    const meanings = [
      "A place where people live",
      "A collection of written pages",
      "A tall plant with branches",
      "The star that provides light and heat",
      "Earth's natural satellite",
      "A clear liquid essential for life",
      "The atmosphere above the earth",
      "Moving air",
      "A colorful plant part",
      "A feathered animal",
      "A close companion",
      "Deep affection",
      "A measure of duration",
      "A route or track",
      "The planet we live on",
      "The part of the body used for grasping",
      "The organ of sight",
      "The organ of emotion",
      "The part containing the brain",
      "The time after sunset",
      "The time when the sun is up",
      "The state of being alive",
      "A vision during sleep",
      "The ground we walk on",
      "A celestial body",
    ];

    const ukWords = createdWords.filter(
      (w) => w.languageId.toString() === ukrainianLang._id.toString()
    );
    let cardCount = 0;
    for (const lang of createdLanguages.filter((l) => l.code !== "uk")) {
      const targetWords = createdWords.filter(
        (w) => w.languageId.toString() === lang._id.toString()
      );
      for (let i = 0; i < 25 && cardCount < 100; i++) {
        const category = createdCategories[i % createdCategories.length]; // Distribute across all categories
        cards.push({
          wordId: ukWords[i]._id,
          translationId: targetWords[i]._id,
          categoryId: category._id,
          meaning: meanings[i % meanings.length],
        });
        cardCount++;
      }
    }
    await Card.insertMany(cards);

    // Create UserProgress
    const userProgress = [];
    for (const user of createdUsers) {
      for (const lang of createdLanguages.filter((l) => l.code !== "uk")) {
        for (const category of createdCategories) {
          const totalCards = await Card.countDocuments({
            categoryId: category._id,
            translationId: {
              $in: createdWords
                .filter((w) => w.languageId.toString() === lang._id.toString())
                .map((w) => w._id),
            },
          });
          userProgress.push({
            userId: user._id,
            languageId: lang._id,
            categoryId: category._id,
            totalCards,
            unlocked: category.order === 1,
          });
        }
      }
    }
    await UserProgress.insertMany(userProgress);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

initDB();
