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
    <div className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-poppins font-bold text-center text-primary mb-6">
          {t("leaderboardPage.leaderboard")}
        </h2>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center mb-6"
          >
            <ArrowPathIcon className="h-6 w-6 text-primary animate-spin" />
            <span className="ml-3 text-dark font-poppins text-lg">
              {t("leaderboardPage.loadingLeaderboard")}
            </span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-poppins rounded-lg text-center animate-fade-in"
          >
            {error}
          </motion.div>
        )}
        {!loading && !error && selectedLanguageId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-poppins font-semibold text-dark mb-4">
              {t("leaderboardPage.topLearners")}
            </h3>
            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white/98 backdrop-blur-sm rounded-lg">
                  <thead>
                    <tr className="bg-gradient-primary text-white">
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-poppins font-semibold rounded-tl-lg">
                        {t("leaderboardPage.rank")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-poppins font-semibold">
                        {t("leaderboardPage.user")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-poppins font-semibold">
                        {t("leaderboardPage.totalScore")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-poppins font-semibold">
                        {t("leaderboardPage.averageScore")}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-poppins font-semibold rounded-tr-lg">
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
                        className={`border-b border-gray-100 hover:bg-accent-opacity-10 transition-all duration-200 ${
                          index < 3 ? "bg-yellow-50/50" : ""
                        }`}
                      >
                        <td className="px-4 sm:px-6 py-3 text-dark font-poppins flex items-center space-x-2">
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
                        <td className="px-4 sm:px-6 py-3 text-dark font-poppins font-medium">
                          {entry.username}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-dark font-poppins">
                          {entry.totalScore.toFixed(2)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-dark font-poppins">
                          {entry.avgAttemptScore.toFixed(2)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-dark font-poppins">
                          {entry.avgCorrectPercentage.toFixed(2)}%
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-dark font-poppins text-center text-lg">
                {t("leaderboardPage.noLeaderboardData")}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default LeaderboardPage;
