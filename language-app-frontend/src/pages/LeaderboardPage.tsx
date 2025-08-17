import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import type { LeaderboardEntry } from "../types";
import { getLeaderboard } from "../services/api";
import { AxiosError } from "axios";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

const LeaderboardPage: React.FC = () => {
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
          setError(error.response?.data?.error || "Failed to load leaderboard");
        } else {
          setError("Failed to load leaderboard");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedLanguageId, setSelectedLanguageId, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Leaderboard
        </h2>
        {loading && (
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading statistics...</span>
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
              Top Learners
            </h3>
            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow-md">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                        Rank
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                        User
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                        Average Max Score (%)
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                        Total Score
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
                          {entry.userName}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {entry.maxScore.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {entry.totalScore.toFixed(2)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No leaderboard data available.</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
