import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import type { Attempt, StatsByType, UserProgress } from "../types";
import { AxiosError } from "axios";
import { getStats } from "../services/api";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const StatiscticsPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedLanguageId, setSelectedLanguageId } = useLanguage();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [statsByType, setStatsByType] = useState<StatsByType>({});
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState<"7 days" | "30 days" | "all">(
    "all"
  );

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const statsData = await getStats(
          selectedLanguageId ? { languageId: selectedLanguageId } : {}
        );
        setProgress(statsData.progress);
        setStatsByType(statsData.statsByType);
        setAttempts(statsData.attempts);
        if (user?.learningLanguagesIds?.length && !selectedLanguageId) {
          setSelectedLanguageId(user.learningLanguagesIds[0]);
        }
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          setError(error.response?.data?.error || "Failed to load statistics");
        } else {
          setError("Failed to load filters");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStatistics();
  }, [user, selectedLanguageId, setSelectedLanguageId]);

  const languageProgress = progress.filter(
    (p) => p.languageId === selectedLanguageId
  );

  const filterByDate = (attempts: Attempt[]) => {
    const now = new Date();
    if (dateFilter === "7 days") {
      const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
      return attempts.filter((a) => new Date(a.date) >= sevenDaysAgo);
    } else if (dateFilter === "30 days") {
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      return attempts.filter((a) => new Date(a.date) >= thirtyDaysAgo);
    }
    return attempts;
  };

  const attemptData = filterByDate(attempts)
    .filter((a) => a.languageId === selectedLanguageId)
    .map((a) => ({
      date: new Date(a.date).toLocaleDateString(),
      score: a.score,
      category: a.categoryId.name,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartData = Array.from(new Set(attemptData.map((a) => a.date))).map(
    (date) => {
      const dataPoint: { date: string; [key: string]: string | number } = {
        date,
      };
      languageProgress.forEach((p) => {
        const categoryAttempts = attemptData.filter(
          (a) => a.date === date && a.category === p.categoryId.name
        );
        dataPoint[`${p.categoryId.name}`] = categoryAttempts.length
          ? categoryAttempts[categoryAttempts.length - 1].score
          : 0;
      });
      return dataPoint;
    }
  );

  const colors = ["#4B0082", "#FF4500", "#228B22", "#FFD700", "#1E90FF"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Statistics
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
          <>
            <div className="mb-4">
              <label htmlFor="dateFilter" className="mr-2 text-gray-700">
                Filter by date:
              </label>
              <select
                id="dateFilter"
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value as "7 days" | "30 days" | "all")
                }
                className="p-2 border rounded-md"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>
            <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Progress Over Time
              </h3>
              {attemptData.length === 0 || languageProgress.length === 0 ? (
                <p className="text-gray-600">No progress data available</p>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      {languageProgress.map((p, index) => (
                        <Line
                          key={p.categoryId._id}
                          type="monotone"
                          dataKey={p.categoryId.name}
                          name={`Level ${p.categoryId.order}: ${p.categoryId.name}`}
                          stroke={colors[index % colors.length]}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Accuracy by Exercise Type
              </h3>
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                      Exercise Type
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                      Correct Answers
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                      Total Answers
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">
                      Accuracy (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {["flash", "test", "dictation"].map((type) => {
                    const stats = statsByType[type] || {
                      correctAnswers: 0,
                      totalAnswers: 0,
                    };
                    const accuracy =
                      stats.totalAnswers > 0
                        ? (
                            (stats.correctAnswers / stats.totalAnswers) *
                            100
                          ).toFixed(1)
                        : 0;
                    return (
                      <tr key={type} className="border-t">
                        <td className="px-4 py-2 text-gray-600">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {stats.correctAnswers}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {stats.totalAnswers}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{accuracy}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatiscticsPage;
