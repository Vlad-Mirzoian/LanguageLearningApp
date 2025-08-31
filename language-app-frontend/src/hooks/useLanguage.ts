import { useEffect, useState } from "react";
import { useLanguageStore } from "../store/languageStore";
import { useAuthStore } from "../store/authStore";
import { LanguageAPI } from "../services/index";

export const useLanguage = () => {
  const { selectedLanguageId, setSelectedLanguageId } = useLanguageStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeLanguage = async () => {
      if (!user) return;

      try {
        const languages = await LanguageAPI.getLanguages();
        const validLanguage = languages.find(
          (lang) => lang._id === selectedLanguageId
        );

        if (validLanguage) {
          setSelectedLanguageId(validLanguage._id);
        } else if (user.learningLanguagesIds?.length) {
          const firstLang = user.learningLanguagesIds.find((id) =>
            languages.some((lang) => lang._id === id)
          );
          setSelectedLanguageId(firstLang || null);
        } else {
          setSelectedLanguageId(null);
        }
      } catch (err) {
        console.error("Failed to load languages:", err);
        setSelectedLanguageId(null);
      } finally {
        setLoading(false);
      }
    };

    initializeLanguage();
  }, [user, selectedLanguageId, setSelectedLanguageId]);

  return {
    selectedLanguageId,
    setSelectedLanguageId,
    loading,
  };
};
