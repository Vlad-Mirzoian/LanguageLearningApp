import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface LanguageState {
  selectedLanguageId: string | null;
  setSelectedLanguageId: (languageId: string | null) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguageId: null,
      setSelectedLanguageId: (languageId) => {
        set({ selectedLanguageId: languageId });
      },
    }),
    {
      name: "language-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedLanguageId: state.selectedLanguageId }),
    }
  )
);
