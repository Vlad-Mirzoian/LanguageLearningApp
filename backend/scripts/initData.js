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
      {
        text: "спати",
        languageId: languageMap.uk,
        categoryId: categoryMap["daily activities"],
        meaning: "відпочинок уві сні",
      },
      {
        text: "їсти",
        languageId: languageMap.uk,
        categoryId: categoryMap["daily activities"],
        meaning: "споживання їжі",
      },
      {
        text: "кіт",
        languageId: languageMap.uk,
        categoryId: categoryMap.animals,
        meaning: "домашня тварина",
      },
      {
        text: "собака",
        languageId: languageMap.uk,
        categoryId: categoryMap.animals,
        meaning: "домашня тварина",
      },
      {
        text: "сонце",
        languageId: languageMap.uk,
        categoryId: categoryMap.weather,
        meaning: "небесне тіло",
      },
      {
        text: "дощ",
        languageId: languageMap.uk,
        categoryId: categoryMap.weather,
        meaning: "опади",
      },
      {
        text: "сорочка",
        languageId: languageMap.uk,
        categoryId: categoryMap.clothing,
        meaning: "одяг для верхньої частини тіла",
      },
      {
        text: "штани",
        languageId: languageMap.uk,
        categoryId: categoryMap.clothing,
        meaning: "одяг для ніг",
      },
      {
        text: "читання",
        languageId: languageMap.uk,
        categoryId: categoryMap.hobbies,
        meaning: "дозвілля з книгами",
      },
      {
        text: "лікар",
        languageId: languageMap.uk,
        categoryId: categoryMap.jobs,
        meaning: "медичний працівник",
      },
      // English (20 words)
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
      {
        text: "sleep",
        languageId: languageMap.en,
        categoryId: categoryMap["daily activities"],
        meaning: "rest through slumber",
      },
      {
        text: "eat",
        languageId: languageMap.en,
        categoryId: categoryMap["daily activities"],
        meaning: "consume food",
      },
      {
        text: "cat",
        languageId: languageMap.en,
        categoryId: categoryMap.animals,
        meaning: "domestic animal",
      },
      {
        text: "dog",
        languageId: languageMap.en,
        categoryId: categoryMap.animals,
        meaning: "domestic animal",
      },
      {
        text: "sun",
        languageId: languageMap.en,
        categoryId: categoryMap.weather,
        meaning: "celestial body",
      },
      {
        text: "rain",
        languageId: languageMap.en,
        categoryId: categoryMap.weather,
        meaning: "precipitation",
      },
      {
        text: "shirt",
        languageId: languageMap.en,
        categoryId: categoryMap.clothing,
        meaning: "upper body clothing",
      },
      {
        text: "pants",
        languageId: languageMap.en,
        categoryId: categoryMap.clothing,
        meaning: "lower body clothing",
      },
      {
        text: "reading",
        languageId: languageMap.en,
        categoryId: categoryMap.hobbies,
        meaning: "leisure with books",
      },
      {
        text: "doctor",
        languageId: languageMap.en,
        categoryId: categoryMap.jobs,
        meaning: "medical professional",
      },
      // French (20 words)
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
      {
        text: "dormir",
        languageId: languageMap.fr,
        categoryId: categoryMap["daily activities"],
        meaning: "repos par le sommeil",
      },
      {
        text: "manger",
        languageId: languageMap.fr,
        categoryId: categoryMap["daily activities"],
        meaning: "consommer de la nourriture",
      },
      {
        text: "chat",
        languageId: languageMap.fr,
        categoryId: categoryMap.animals,
        meaning: "animal domestique",
      },
      {
        text: "chien",
        languageId: languageMap.fr,
        categoryId: categoryMap.animals,
        meaning: "animal domestique",
      },
      {
        text: "soleil",
        languageId: languageMap.fr,
        categoryId: categoryMap.weather,
        meaning: "corps céleste",
      },
      {
        text: "pluie",
        languageId: languageMap.fr,
        categoryId: categoryMap.weather,
        meaning: "précipitation",
      },
      {
        text: "chemise",
        languageId: languageMap.fr,
        categoryId: categoryMap.clothing,
        meaning: "vêtement du haut du corps",
      },
      {
        text: "pantalon",
        languageId: languageMap.fr,
        categoryId: categoryMap.clothing,
        meaning: "vêtement du bas du corps",
      },
      {
        text: "lecture",
        languageId: languageMap.fr,
        categoryId: categoryMap.hobbies,
        meaning: "loisir avec des livres",
      },
      {
        text: "médecin",
        languageId: languageMap.fr,
        categoryId: categoryMap.jobs,
        meaning: "professionnel médical",
      },
      // German (20 words)
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
      {
        text: "schlafen",
        languageId: languageMap.de,
        categoryId: categoryMap["daily activities"],
        meaning: "Ruhe durch Schlaf",
      },
      {
        text: "essen",
        languageId: languageMap.de,
        categoryId: categoryMap["daily activities"],
        meaning: "Nahrung konsumieren",
      },
      {
        text: "Katze",
        languageId: languageMap.de,
        categoryId: categoryMap.animals,
        meaning: "Haustier",
      },
      {
        text: "Hund",
        languageId: languageMap.de,
        categoryId: categoryMap.animals,
        meaning: "Haustier",
      },
      {
        text: "Sonne",
        languageId: languageMap.de,
        categoryId: categoryMap.weather,
        meaning: "Himmelskörper",
      },
      {
        text: "Regen",
        languageId: languageMap.de,
        categoryId: categoryMap.weather,
        meaning: "Niederschlag",
      },
      {
        text: "Hemd",
        languageId: languageMap.de,
        categoryId: categoryMap.clothing,
        meaning: "Oberkörperkleidung",
      },
      {
        text: "Hose",
        languageId: languageMap.de,
        categoryId: categoryMap.clothing,
        meaning: "Unterkörperkleidung",
      },
      {
        text: "Lesen",
        languageId: languageMap.de,
        categoryId: categoryMap.hobbies,
        meaning: "Freizeit mit Büchern",
      },
      {
        text: "Arzt",
        languageId: languageMap.de,
        categoryId: categoryMap.jobs,
        meaning: "Medizinischer Fachmann",
      },
      // Spanish (20 words)
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
      {
        text: "dormir",
        languageId: languageMap.es,
        categoryId: categoryMap["daily activities"],
        meaning: "descanso por sueño",
      },
      {
        text: "comer",
        languageId: languageMap.es,
        categoryId: categoryMap["daily activities"],
        meaning: "consumir comida",
      },
      {
        text: "gato",
        languageId: languageMap.es,
        categoryId: categoryMap.animals,
        meaning: "animal doméstico",
      },
      {
        text: "perro",
        languageId: languageMap.es,
        categoryId: categoryMap.animals,
        meaning: "animal doméstico",
      },
      {
        text: "sol",
        languageId: languageMap.es,
        categoryId: categoryMap.weather,
        meaning: "cuerpo celeste",
      },
      {
        text: "lluvia",
        languageId: languageMap.es,
        categoryId: categoryMap.weather,
        meaning: "precipitación",
      },
      {
        text: "camisa",
        languageId: languageMap.es,
        categoryId: categoryMap.clothing,
        meaning: "ropa del torso",
      },
      {
        text: "pantalones",
        languageId: languageMap.es,
        categoryId: categoryMap.clothing,
        meaning: "ropa de las piernas",
      },
      {
        text: "lectura",
        languageId: languageMap.es,
        categoryId: categoryMap.hobbies,
        meaning: "ocio con libros",
      },
      {
        text: "médico",
        languageId: languageMap.es,
        categoryId: categoryMap.jobs,
        meaning: "profesional médico",
      },
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
      {
        wordId: wordMap["спати_" + languageMap.uk],
        translationId: wordMap["sleep_" + languageMap.en],
      },
      {
        wordId: wordMap["їсти_" + languageMap.uk],
        translationId: wordMap["eat_" + languageMap.en],
      },
      {
        wordId: wordMap["кіт_" + languageMap.uk],
        translationId: wordMap["cat_" + languageMap.en],
      },
      {
        wordId: wordMap["собака_" + languageMap.uk],
        translationId: wordMap["dog_" + languageMap.en],
      },
      {
        wordId: wordMap["сонце_" + languageMap.uk],
        translationId: wordMap["sun_" + languageMap.en],
      },
      // Ukrainian -> French (15 cards)
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
      {
        wordId: wordMap["спати_" + languageMap.uk],
        translationId: wordMap["dormir_" + languageMap.fr],
      },
      {
        wordId: wordMap["їсти_" + languageMap.uk],
        translationId: wordMap["manger_" + languageMap.fr],
      },
      {
        wordId: wordMap["кіт_" + languageMap.uk],
        translationId: wordMap["chat_" + languageMap.fr],
      },
      {
        wordId: wordMap["собака_" + languageMap.uk],
        translationId: wordMap["chien_" + languageMap.fr],
      },
      {
        wordId: wordMap["сонце_" + languageMap.uk],
        translationId: wordMap["soleil_" + languageMap.fr],
      },
      // Ukrainian -> German (15 cards)
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
      {
        wordId: wordMap["літак_" + languageMap.uk],
        translationId: wordMap["Flugzeug_" + languageMap.de],
      },
      {
        wordId: wordMap["мама_" + languageMap.uk],
        translationId: wordMap["Mutter_" + languageMap.de],
      },
      {
        wordId: wordMap["брат_" + languageMap.uk],
        translationId: wordMap["Bruder_" + languageMap.de],
      },
      {
        wordId: wordMap["один_" + languageMap.uk],
        translationId: wordMap["eins_" + languageMap.de],
      },
      {
        wordId: wordMap["червоний_" + languageMap.uk],
        translationId: wordMap["rot_" + languageMap.de],
      },
      {
        wordId: wordMap["спати_" + languageMap.uk],
        translationId: wordMap["schlafen_" + languageMap.de],
      },
      {
        wordId: wordMap["їсти_" + languageMap.uk],
        translationId: wordMap["essen_" + languageMap.de],
      },
      {
        wordId: wordMap["кіт_" + languageMap.uk],
        translationId: wordMap["Katze_" + languageMap.de],
      },
      {
        wordId: wordMap["собака_" + languageMap.uk],
        translationId: wordMap["Hund_" + languageMap.de],
      },
      {
        wordId: wordMap["сонце_" + languageMap.uk],
        translationId: wordMap["Sonne_" + languageMap.de],
      },
      // Ukrainian -> Spanish (15 cards)
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
      {
        wordId: wordMap["літак_" + languageMap.uk],
        translationId: wordMap["avión_" + languageMap.es],
      },
      {
        wordId: wordMap["мама_" + languageMap.uk],
        translationId: wordMap["madre_" + languageMap.es],
      },
      {
        wordId: wordMap["брат_" + languageMap.uk],
        translationId: wordMap["hermano_" + languageMap.es],
      },
      {
        wordId: wordMap["один_" + languageMap.uk],
        translationId: wordMap["uno_" + languageMap.es],
      },
      {
        wordId: wordMap["червоний_" + languageMap.uk],
        translationId: wordMap["rojo_" + languageMap.es],
      },
      {
        wordId: wordMap["спати_" + languageMap.uk],
        translationId: wordMap["dormir_" + languageMap.es],
      },
      {
        wordId: wordMap["їсти_" + languageMap.uk],
        translationId: wordMap["comer_" + languageMap.es],
      },
      {
        wordId: wordMap["кіт_" + languageMap.uk],
        translationId: wordMap["gato_" + languageMap.es],
      },
      {
        wordId: wordMap["собака_" + languageMap.uk],
        translationId: wordMap["perro_" + languageMap.es],
      },
      {
        wordId: wordMap["сонце_" + languageMap.uk],
        translationId: wordMap["sol_" + languageMap.es],
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
