import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import type { LeaderboardEntry } from "../types";
import { getLeaderboard } from "../services/api";
import { AxiosError } from "axios";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
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
        const leaderboardData = selectedLanguageId
          ? await getLeaderboard({ languageId: selectedLanguageId })
          : [];
        setLeaderboard(leaderboardData);
        if (user?.learningLanguagesIds?.length && !selectedLanguageId) {
          setSelectedLanguageId(user.learningLanguagesIds[0]);
        }
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          setError(
            error.response?.data?.error ||
              t("leaderboardPage.failedToLoadLeaderboard")
          );
        } else {
          setError(t("leaderboardPage.failedToLoadLeaderboard"));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedLanguageId, setSelectedLanguageId, t, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("leaderboardPage.leaderboard")}
        </h2>
        {loading && (
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">
              {t("leaderboardPage.loadingLeaderboard")}
            </span>
          </div>
        )}
        {error && (
          <div className="mb-4 p-2 bg-red-600 text-white text-sm rounded-lg">
            {error}
          </div>
        )}
        {!loading && !error && selectedLanguageId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-50 p-4 rounded-lg shadow-md"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t("leaderboardPage.topLearners")}
            </h3>
            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow-md">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                        {t("leaderboardPage.rank")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                        {t("leaderboardPage.user")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                        {t("leaderboardPage.totalScore")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                        {t("leaderboardPage.averageScore")}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                        {t("leaderboardPage.averageCorrectPercentage")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <motion.tr
                        key={index}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-t"
                      >
                        <td className="px-4 py-2 text-gray-600">{index + 1}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {entry.username}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {entry.totalScore.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {entry.avgAttemptScore.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {entry.avgCorrectPercentage.toFixed(2)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">
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
