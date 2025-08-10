import { useEffect, useState } from "react";
import type { Language } from "../../types";
import { getLanguages } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { user } = useAuth();
  const { selectedLanguageId, setSelectedLanguageId } = useLanguage();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const data = await getLanguages();
        setLanguages(data);
        if (!selectedLanguageId && user?.learningLanguagesIds?.length) {
          setSelectedLanguageId(user.learningLanguagesIds[0]);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load languages");
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, [selectedLanguageId, setSelectedLanguageId, user]);

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguageId(languageId);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <motion.div
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3 }}
      className="fixed top-16 left-0 h-[calc(100vh-64px)] bg-indigo-800 text-white p-4 shadow-lg overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6">
        {!isCollapsed && (
          <h2 className="text-xl font-bold">Language Courses</h2>
        )}
        <button
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-2 rounded-full hover:bg-indigo-700 transition-colors duration-200"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>
      {!isCollapsed && (
        <>
          {loading && (
            <div className="flex items-center mb-4">
              <ArrowPathIcon className="h-5 w-5 text-white animate-spin" />
              <span className="ml-2 text-white">Loading...</span>
            </div>
          )}
          {error && (
            <div className="mb-4 p-2 bg-red-600 text-white text-sm rounded-lg">
              {error}
            </div>
          )}
          {!loading && !error && (
            <ul className="space-y-2">
              {languages
                .filter((lang) =>
                  user?.learningLanguagesIds?.includes(lang._id)
                )
                .map((lang) => (
                  <li key={lang._id}>
                    <button
                      onClick={() => handleLanguageSelect(lang._id)}
                      className={`w-full text-left p-2 rounded-lg ${
                        selectedLanguageId === lang._id
                          ? "bg-indigo-600"
                          : "hover:bg-indigo-700"
                      } transition-colors duration-200`}
                    >
                      {lang.name}
                    </button>
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
