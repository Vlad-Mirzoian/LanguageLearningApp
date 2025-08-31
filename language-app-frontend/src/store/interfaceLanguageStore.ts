import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Language } from "../types/index";

interface InterfaceLanguageState {
  locale: string;
  interfaceLanguageId: string | null;
  availableLanguages: Language[];
  setLocale: (locale: string, interfaceLanguageId: string | null) => void;
  setAvailableLanguages: (languages: Language[]) => void;
}

export const useInterfaceLanguageStore = create<InterfaceLanguageState>()(
  persist(
    (set) => {
      const browserLang = navigator.language.split("-")[0];
      return {
        locale: browserLang || "en",
        interfaceLanguageId: null,
        availableLanguages: [],
        setLocale: (locale, interfaceLanguageId) =>
          set({ locale, interfaceLanguageId }),
        setAvailableLanguages: (languages) =>
          set({ availableLanguages: languages }),
      };
    },
    {
      name: "interface-language-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        locale: state.locale,
        interfaceLanguage: state.interfaceLanguageId,
      }),
    }
  )
);
