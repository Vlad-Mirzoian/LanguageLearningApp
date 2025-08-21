import { useEffect } from "react";
import { useLanguageStore } from "../store/languageStore";
import { useAuthStore } from "../store/authStore";

export const useLanguage = () => {
  const { selectedLanguageId, setSelectedLanguageId } = useLanguageStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!selectedLanguageId) {
      if (user?.learningLanguagesIds?.length) {
        setSelectedLanguageId(user.learningLanguagesIds[0]);
      } else {
        setSelectedLanguageId(null);
      }
    }
  }, [selectedLanguageId, setSelectedLanguageId, user]);

  return {
    selectedLanguageId,
    setSelectedLanguageId,
  };
};
