import { useEffect, useState } from "react";
import type { ApiError, Language } from "../../types/index";
import { LanguageAPI } from "../../services/index";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import Flag from "react-world-flags";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedLanguageId, setSelectedLanguageId } = useLanguage();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const data = await LanguageAPI.getLanguages();
        setLanguages(data);
        if (!selectedLanguageId && user?.learningLanguagesIds?.length) {
          setSelectedLanguageId(user.learningLanguagesIds[0]);
        }
      } catch (err) {
        const error = err as ApiError;
        setError(error.message || t("sidebar.failedToLoadLanguages"));
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, [selectedLanguageId, setSelectedLanguageId, t, user]);

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguageId(languageId);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const languageToCountryCode: Record<string, string> = {
    en: "US",
    fr: "FR",
    de: "DE",
    es: "ES",
    uk: "UA",
  };

  return (
    <motion.div
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3 }}
      className="fixed top-16 left-0 h-[calc(100vh-64px)] bg-white/98 backdrop-blur-sm p-4 shadow-lg overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <span className="text-lg">🌍</span>
            <h2 className="text-xl font-poppins font-bold text-primary tracking-tight">
              {t("sidebar.languageCourses")}
            </h2>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          aria-label={
            isCollapsed
              ? t("sidebar.expandSidebar")
              : t("sidebar.collapseSidebar")
          }
          className="p-2 rounded-lg text-primary hover:bg-accent-opacity-10 hover:text-accent transition-all duration-200"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
          )}
        </motion.button>
      </div>
      {!isCollapsed && (
        <>
          {loading && (
            <div className="flex items-center mb-4 animate-fade-in">
              <ArrowPathIcon className="h-5 w-5 text-primary animate-spin" />
              <span className="ml-2 text-primary font-poppins text-sm">
                {t("sidebar.loading")}
              </span>
            </div>
          )}
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm font-poppins rounded-lg animate-fade-in">
              {error}
            </div>
          )}
          {!loading && !error && (
            <ul className="space-y-2">
              {languages
                .filter((lang) => user?.learningLanguagesIds?.includes(lang.id))
                .map((lang) => (
                  <li key={lang.id}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLanguageSelect(lang.id)}
                      className={`w-full text-left p-2 rounded-lg font-poppins font-medium ${
                        selectedLanguageId === lang.id
                          ? "bg-gradient-primary text-white"
                          : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                      } transition-all duration-200 flex items-center space-x-2`}
                    >
                      <Flag
                        code={languageToCountryCode[lang.code] || "US"}
                        style={{ width: 24, height: 24 }}
                      />
                      <span>{lang.name}</span>
                    </motion.button>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}
    </motion.div>
  );
};

export default Sidebar;
