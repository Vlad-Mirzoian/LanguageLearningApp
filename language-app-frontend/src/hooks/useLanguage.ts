import { useLanguageStore } from "../store/languageStore";

export const useLanguage = () => {
  const { selectedLanguageId, setSelectedLanguageId } = useLanguageStore();

  return {
    selectedLanguageId,
    setSelectedLanguageId,
  };
};
