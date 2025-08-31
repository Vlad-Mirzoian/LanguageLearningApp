import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import type { ApiError, LeaderboardEntry } from "../types/index";
import { LeaderboardAPI } from "../services/index";
import { ArrowPathIcon, TrophyIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const LeaderboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedLanguageId, setSelectedLanguageId } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const leaderboardData = selectedLanguageId
          ? await LeaderboardAPI.getLeaderboard({
              languageId: selectedLanguageId,
            })
          : [];
        setLeaderboard(leaderboardData);
        if (user?.learningLanguagesIds?.length && !selectedLanguageId) {
          setSelectedLanguageId(user.learningLanguagesIds[0]);
        }
      } catch (err) {
        const error = err as ApiError;
        setError(error.message || t("leaderboardPage.failedToLoadLeaderboard"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedLanguageId, setSelectedLanguageId, t, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-5xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("leaderboardPage.leaderboard")}
        </h2>
        {loading && (
          <div className="flex items-center justify-center mb-6">
            <ArrowPathIcon className="h-6 w-6 text-indigo-600 animate-spin" />
            <span className="ml-3 text-gray-600 text-lg">
              {t("leaderboardPage.loadingLeaderboard")}
            </span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 text-sm rounded-xl shadow-md text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading && !error && selectedLanguageId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t("leaderboardPage.topLearners")}
            </h3>
            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold rounded-tl-lg">
                        {t("leaderboardPage.rank")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">
                        {t("leaderboardPage.user")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">
                        {t("leaderboardPage.totalScore")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">
                        {t("leaderboardPage.averageScore")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold rounded-tr-lg">
                        {t("leaderboardPage.averageCorrectPercentage")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 ${
                          index < 3 ? "bg-yellow-50" : ""
                        }`}
                      >
                        <td className="px-4 sm:px-6 py-3 text-gray-600 flex items-center space-x-2">
                          {index < 3 ? (
                            <TrophyIcon
                              className={`w-5 h-5 ${
                                index === 0
                                  ? "text-yellow-500"
                                  : index === 1
                                  ? "text-gray-400"
                                  : "text-amber-600"
                              }`}
                            />
                          ) : null}
                          <span>{index + 1}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-700 font-medium">
                          {entry.username}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-600">
                          {entry.totalScore.toFixed(2)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-600">
                          {entry.avgAttemptScore.toFixed(2)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-600">
                          {entry.avgCorrectPercentage.toFixed(2)}%
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-center text-lg">
                {t("leaderboardPage.noLeaderboardData")}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
