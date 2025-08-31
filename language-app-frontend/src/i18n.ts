import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";
import uk from "./locales/uk/translation.json";
import de from "./locales/de/translation.json";
import fr from "./locales/fr/translation.json";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    // resources: {},
    resources: {
      en: { translation: en },
      es: { translation: es },
      uk: { translation: uk },
      de: { translation: de },
      fr: { translation: fr },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
