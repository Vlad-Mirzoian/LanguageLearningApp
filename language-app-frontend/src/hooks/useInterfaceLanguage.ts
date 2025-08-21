import { useInterfaceLanguageStore } from "../store/interfaceLanguageStore";
import i18next from "i18next";
import { getLanguages, updateInterfaceLanguage } from "../services/api";
import { useCallback, useEffect } from "react";
import { useAuthStore } from "../store/authStore";

export const useInterfaceLanguage = () => {
  const {
    locale,
    interfaceLanguageId,
    availableLanguages,
    setLocale,
    setAvailableLanguages,
  } = useInterfaceLanguageStore();

  useEffect(() => {
    i18next.changeLanguage(locale);
  }, [locale]);

  const changeLanguage = async (locale: string, languageId: string | null) => {
    try {
      await i18next.changeLanguage(locale);
      setLocale(locale, languageId);
      if (languageId) {
        const lang = await updateInterfaceLanguage(languageId);
        const authStore = useAuthStore.getState();
        if (authStore.user) {
          authStore.setUser({
            ...authStore.user,
            interfaceLanguage: lang,
          });
        }
      }
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  };

  const loadAvailableLanguages = useCallback(async () => {
    try {
      const langs = await getLanguages();
      setAvailableLanguages(langs);
    } catch (error) {
      console.error("Failed to fetch available languages:", error);
    }
  }, [setAvailableLanguages]);

  return {
    locale,
    interfaceLanguageId,
    availableLanguages,
    changeLanguage,
    loadAvailableLanguages,
  };
};
