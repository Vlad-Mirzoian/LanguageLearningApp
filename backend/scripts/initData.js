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
const Attempt = require("../models/Attempt");

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
      Attempt.deleteMany({}),
    ]);

    // Create Languages
    const languages = [
      { code: "uk", name: "Українська" },
      { code: "en", name: "English" },
      { code: "es", name: "Español" },
      { code: "fr", name: "Français" },
      { code: "de", name: "Deutsch" },
    ];
    const createdLanguages = await Language.insertMany(languages);
    const ukrainianLang = createdLanguages.find((lang) => lang.code === "uk");
    const otherLangIds = createdLanguages
      .filter((lang) => lang.code !== "uk")
      .map((lang) => lang._id);

    // Create Users with hashed passwords and different interface languages
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("password123", saltRounds);
    const users = [
      {
        email: "admin@example.com",
        username: "test_admin",
        password: hashedPassword,
        role: "admin",
        interfaceLanguageId: createdLanguages.find((lang) => lang.code === "uk")
          ._id,
        nativeLanguageId: ukrainianLang._id,
        learningLanguagesIds: otherLangIds,
        isVerified: true,
      },
      {
        email: "user1@example.com",
        username: "test_user1",
        password: hashedPassword,
        role: "user",
        interfaceLanguageId: createdLanguages.find((lang) => lang.code === "en")
          ._id,
        nativeLanguageId: ukrainianLang._id,
        learningLanguagesIds: otherLangIds,
        isVerified: true,
      },
      {
        email: "user2@example.com",
        username: "test_user2",
        password: hashedPassword,
        role: "user",
        interfaceLanguageId: createdLanguages.find((lang) => lang.code === "es")
          ._id,
        nativeLanguageId: ukrainianLang._id,
        learningLanguagesIds: otherLangIds,
        isVerified: true,
      },
      {
        email: "user3@example.com",
        username: "test_user3",
        password: hashedPassword,
        role: "user",
        interfaceLanguageId: createdLanguages.find((lang) => lang.code === "fr")
          ._id,
        nativeLanguageId: ukrainianLang._id,
        learningLanguagesIds: otherLangIds,
        isVerified: true,
      },
      {
        email: "user4@example.com",
        username: "test_user4",
        password: hashedPassword,
        role: "user",
        interfaceLanguageId: createdLanguages.find((lang) => lang.code === "de")
          ._id,
        nativeLanguageId: ukrainianLang._id,
        learningLanguagesIds: otherLangIds,
        isVerified: true,
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

    // Define concepts per category (3 per category, 30 total concepts)
    const conceptsPerCategory = [
      // Vocabulary
      [
        {
          trans: {
            uk: "привіт",
            en: "hello",
            es: "hola",
            fr: "bonjour",
            de: "hallo",
          },
          examples: {
            en: "Hello, how are you today?",
            es: "Hola, ¿cómo estás hoy?",
            fr: "Bonjour, comment vas-tu aujourd'hui ?",
            de: "Hallo, wie geht's dir heute?",
          },
        },
        {
          trans: {
            uk: "дякую",
            en: "thank you",
            es: "gracias",
            fr: "merci",
            de: "danke",
          },
          examples: {
            en: "Thank you for your help!",
            es: "¡Gracias por tu ayuda!",
            fr: "Merci pour ton aide !",
            de: "Danke für deine Hilfe!",
          },
        },
        {
          trans: {
            uk: "будь ласка",
            en: "please",
            es: "por favor",
            fr: "s'il vous plaît",
            de: "bitte",
          },
          examples: {
            en: "Please pass the salt.",
            es: "Por favor, pasa la sal.",
            fr: "S'il vous plaît, passe le sel.",
            de: "Bitte gib mir das Salz.",
          },
        },
      ],
      // Food
      [
        {
          trans: {
            uk: "яблуко",
            en: "apple",
            es: "manzana",
            fr: "pomme",
            de: "Apfel",
          },
          examples: {
            en: "I ate a juicy apple for breakfast.",
            es: "Comí una manzana jugosa para el desayuno.",
            fr: "J'ai mangé une pomme juteuse au petit déjeuner.",
            de: "Ich habe einen saftigen Apfel zum Frühstück gegessen.",
          },
        },
        {
          trans: {
            uk: "хліб",
            en: "bread",
            es: "pan",
            fr: "pain",
            de: "Brot",
          },
          examples: {
            en: "I baked fresh bread this morning.",
            es: "Horneé pan fresco esta mañana.",
            fr: "J'ai fait du pain frais ce matin.",
            de: "Ich habe heute Morgen frisches Brot gebacken.",
          },
        },
        {
          trans: {
            uk: "молоко",
            en: "milk",
            es: "leche",
            fr: "lait",
            de: "Milch",
          },
          examples: {
            en: "She drinks milk with her cereal.",
            es: "Ella bebe leche con su cereal.",
            fr: "Elle boit du lait avec ses céréales.",
            de: "Sie trinkt Milch mit ihrem Müsli.",
          },
        },
      ],
      // Travel
      [
        {
          trans: {
            uk: "літак",
            en: "airplane",
            es: "avión",
            fr: "avion",
            de: "Flugzeug",
          },
          examples: {
            en: "The airplane took off on time.",
            es: "El avión despegó a tiempo.",
            fr: "L'avion a décollé à l'heure.",
            de: "Das Flugzeug ist pünktlich gestartet.",
          },
        },
        {
          trans: {
            uk: "готель",
            en: "hotel",
            es: "hotel",
            fr: "hôtel",
            de: "Hotel",
          },
          examples: {
            en: "We stayed at a cozy hotel by the beach.",
            es: "Nos quedamos en un hotel acogedor junto a la playa.",
            fr: "Nous avons séjourné dans un hôtel confortable près de la plage.",
            de: "Wir haben in einem gemütlichen Hotel am Strand übernachtet.",
          },
        },
        {
          trans: {
            uk: "карта",
            en: "map",
            es: "mapa",
            fr: "carte",
            de: "Karte",
          },
          examples: {
            en: "I used a map to find the museum.",
            es: "Usé un mapa para encontrar el museo.",
            fr: "J'ai utilisé une carte pour trouver le musée.",
            de: "Ich habe eine Karte benutzt, um das Museum zu finden.",
          },
        },
      ],
      // Family
      [
        {
          trans: {
            uk: "мати",
            en: "mother",
            es: "madre",
            fr: "mère",
            de: "Mutter",
          },
          examples: {
            en: "My mother cooks delicious meals.",
            es: "Mi madre cocina comidas deliciosas.",
            fr: "Ma mère cuisine des plats délicieux.",
            de: "Meine Mutter kocht leckere Mahlzeiten.",
          },
        },
        {
          trans: {
            uk: "батько",
            en: "father",
            es: "padre",
            fr: "père",
            de: "Vater",
          },
          examples: {
            en: "My father taught me how to ride a bike.",
            es: "Mi padre me enseñó a montar en bicicleta.",
            fr: "Mon père m'a appris à faire du vélo.",
            de: "Mein Vater hat mir beigebracht, Fahrrad zu fahren.",
          },
        },
        {
          trans: {
            uk: "брат",
            en: "brother",
            es: "hermano",
            fr: "frère",
            de: "Bruder",
          },
          examples: {
            en: "My brother is good at soccer.",
            es: "Mi hermano es bueno en fútbol.",
            fr: "Mon frère est doué pour le football.",
            de: "Mein Bruder ist gut im Fußball.",
          },
        },
      ],
      // Nature
      [
        {
          trans: {
            uk: "дерево",
            en: "tree",
            es: "árbol",
            fr: "arbre",
            de: "Baum",
          },
          examples: {
            en: "The tree in our yard is very old.",
            es: "El árbol en nuestro patio es muy viejo.",
            fr: "L'arbre dans notre jardin est très vieux.",
            de: "Der Baum in unserem Garten ist sehr alt.",
          },
        },
        {
          trans: {
            uk: "річка",
            en: "river",
            es: "río",
            fr: "rivière",
            de: "Fluss",
          },
          examples: {
            en: "We went fishing by the river.",
            es: "Fuimos a pescar al río.",
            fr: "Nous sommes allés pêcher près de la rivière.",
            de: "Wir waren am Fluss angeln.",
          },
        },
        {
          trans: {
            uk: "гора",
            en: "mountain",
            es: "montaña",
            fr: "montagne",
            de: "Berg",
          },
          examples: {
            en: "We hiked up the mountain last weekend.",
            es: "Subimos la montaña el fin de semana pasado.",
            fr: "Nous avons escaladé la montagne le week-end dernier.",
            de: "Wir sind am letzten Wochenende den Berg hinaufgewandert.",
          },
        },
      ],
      // Work
      [
        {
          trans: {
            uk: "робота",
            en: "job",
            es: "trabajo",
            fr: "travail",
            de: "Arbeit",
          },
          examples: {
            en: "She loves her new job at the hospital.",
            es: "Ella ama su nuevo trabajo en el hospital.",
            fr: "Elle adore son nouveau travail à l'hôpital.",
            de: "Sie liebt ihren neuen Job im Krankenhaus.",
          },
        },
        {
          trans: {
            uk: "офіс",
            en: "office",
            es: "oficina",
            fr: "bureau",
            de: "Büro",
          },
          examples: {
            en: "The office is open from 9 to 5.",
            es: "La oficina está abierta de 9 a 5.",
            fr: "Le bureau est ouvert de 9h à 17h.",
            de: "Das Büro ist von 9 bis 17 Uhr geöffnet.",
          },
        },
        {
          trans: {
            uk: "комп'ютер",
            en: "computer",
            es: "computadora",
            fr: "ordinateur",
            de: "Computer",
          },
          examples: {
            en: "I use my computer for work and gaming.",
            es: "Uso mi computadora para trabajar y jugar.",
            fr: "J'utilise mon ordinateur pour travailler et jouer.",
            de: "Ich benutze meinen Computer für Arbeit und Spiele.",
          },
        },
      ],
      // Clothing
      [
        {
          trans: {
            uk: "сорочка",
            en: "shirt",
            es: "camisa",
            fr: "chemise",
            de: "Hemd",
          },
          examples: {
            en: "He wore a blue shirt to the party.",
            es: "Llevó una camisa azul a la fiesta.",
            fr: "Il a porté une chemise bleue à la fête.",
            de: "Er trug ein blaues Hemd zur Party.",
          },
        },
        {
          trans: {
            uk: "штани",
            en: "pants",
            es: "pantalones",
            fr: "pantalon",
            de: "Hose",
          },
          examples: {
            en: "These pants are very comfortable.",
            es: "Estos pantalones son muy cómodos.",
            fr: "Ce pantalon est très confortable.",
            de: "Diese Hose ist sehr bequem.",
          },
        },
        {
          trans: {
            uk: "взуття",
            en: "shoes",
            es: "zapatos",
            fr: "chaussures",
            de: "Schuhe",
          },
          examples: {
            en: "I need new shoes for running.",
            es: "Necesito zapatos nuevos para correr.",
            fr: "J'ai besoin de nouvelles chaussures pour courir.",
            de: "Ich brauche neue Schuhe zum Laufen.",
          },
        },
      ],
      // Weather
      [
        {
          trans: {
            uk: "дощ",
            en: "rain",
            es: "lluvia",
            fr: "pluie",
            de: "Regen",
          },
          examples: {
            en: "It's going to rain this afternoon.",
            es: "Va a llover esta tarde.",
            fr: "Il va pleuvoir cet après-midi.",
            de: "Es wird heute Nachmittag regnen.",
          },
        },
        {
          trans: {
            uk: "сонце",
            en: "sun",
            es: "sol",
            fr: "soleil",
            de: "Sonne",
          },
          examples: {
            en: "The sun is shining brightly today.",
            es: "El sol brilla intensamente hoy.",
            fr: "Le soleil brille fort aujourd'hui.",
            de: "Die Sonne scheint heute hell.",
          },
        },
        {
          trans: {
            uk: "вітер",
            en: "wind",
            es: "viento",
            fr: "vent",
            de: "Wind",
          },
          examples: {
            en: "The wind is blowing strongly today.",
            es: "El viento sopla fuerte hoy.",
            fr: "Le vent souffle fort aujourd'hui.",
            de: "Der Wind weht heute stark.",
          },
        },
      ],
      // Emotions
      [
        {
          trans: {
            uk: "щасливий",
            en: "happy",
            es: "feliz",
            fr: "heureux",
            de: "glücklich",
          },
          examples: {
            en: "She was so happy to see her friends.",
            es: "Estaba tan feliz de ver a sus amigos.",
            fr: "Elle était si heureuse de voir ses amis.",
            de: "Sie war so glücklich, ihre Freunde zu sehen.",
          },
        },
        {
          trans: {
            uk: "сумний",
            en: "sad",
            es: "triste",
            fr: "triste",
            de: "traurig",
          },
          examples: {
            en: "He felt sad after the movie.",
            es: "Se sintió triste después de la película.",
            fr: "Il s'est senti triste après le film.",
            de: "Er fühlte sich nach dem Film traurig.",
          },
        },
        {
          trans: {
            uk: "злий",
            en: "angry",
            es: "enojado",
            fr: "en colère",
            de: "wütend",
          },
          examples: {
            en: "She was angry about the mistake.",
            es: "Estaba enojada por el error.",
            fr: "Elle était en colère à cause de l'erreur.",
            de: "Sie war wegen des Fehlers wütend.",
          },
        },
      ],
      // Technology
      [
        {
          trans: {
            uk: "телефон",
            en: "phone",
            es: "teléfono",
            fr: "téléphone",
            de: "Telefon",
          },
          examples: {
            en: "I left my phone at home.",
            es: "Dejé mi teléfono en casa.",
            fr: "J'ai oublié mon téléphone à la maison.",
            de: "Ich habe mein Telefon zu Hause vergessen.",
          },
        },
        {
          trans: {
            uk: "інтернет",
            en: "internet",
            es: "internet",
            fr: "internet",
            de: "Internet",
          },
          examples: {
            en: "The internet is down again.",
            es: "El internet está caído otra vez.",
            fr: "L'internet ne fonctionne plus.",
            de: "Das Internet ist wieder ausgefallen.",
          },
        },
        {
          trans: {
            uk: "додаток",
            en: "app",
            es: "aplicación",
            fr: "application",
            de: "App",
          },
          examples: {
            en: "I downloaded a new app for learning.",
            es: "Descargué una nueva aplicación para aprender.",
            fr: "J'ai téléchargé une nouvelle application pour apprendre.",
            de: "Ich habe eine neue App zum Lernen heruntergeladen.",
          },
        },
      ],
    ];

    // Create Words (150 words, 30 per language)
    const words = [];
    for (let catIdx = 0; catIdx < conceptsPerCategory.length; catIdx++) {
      const catConcepts = conceptsPerCategory[catIdx];
      for (const concept of catConcepts) {
        for (const lang of createdLanguages) {
          words.push({
            text: concept.trans[lang.code],
            languageId: lang._id,
          });
        }
      }
    }
    const createdWords = await Word.insertMany(words);

    // Create wordMap for easy lookup (langId -> text -> wordId)
    const wordMap = {};
    createdWords.forEach((word) => {
      const langIdStr = word.languageId.toString();
      if (!wordMap[langIdStr]) wordMap[langIdStr] = {};
      wordMap[langIdStr][word.text] = word._id;
    });

    // Create Cards (120 cards, Ukrainian to each learning language, grouped by category)
    const cards = [];
    for (let catIdx = 0; catIdx < conceptsPerCategory.length; catIdx++) {
      const categoryId = createdCategories[catIdx]._id;
      const catConcepts = conceptsPerCategory[catIdx];
      for (const concept of catConcepts) {
        const ukText = concept.trans.uk;
        const ukWordId = wordMap[ukrainianLang._id.toString()][ukText];
        for (const targetLang of createdLanguages.filter(
          (l) => l.code !== "uk"
        )) {
          const targetText = concept.trans[targetLang.code];
          const targetWordId = wordMap[targetLang._id.toString()][targetText];
          cards.push({
            wordId: ukWordId,
            translationId: targetWordId,
            categoryId,
            example: concept.examples[targetLang.code],
          });
        }
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
