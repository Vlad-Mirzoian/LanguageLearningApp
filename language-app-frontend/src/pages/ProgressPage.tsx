import { useEffect, useState } from "react";
import type { UserProgress } from "../types";
import { getUserProgress } from "../services/api";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#4F46E5", "#7C3AED", "#DB2777", "#FBBF24", "#10B981"];

const ProgressPage: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const data = await getUserProgress();
        setProgress(data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load progress data");
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const totalCards = progress.reduce((sum, p) => sum + p.totalCards, 0);
  const learnedCards = progress.reduce((sum, p) => sum + p.learnedCards, 0);
  const totalScore = progress.reduce((sum, p) => sum + p.score, 0);

  const languageProgress = progress.reduce((acc, p) => {
    const langId = p.languageId._id;
    if (!acc[langId]) {
      acc[langId] = {
        languageId: { id: langId, name: p.languageId.name },
        totalCards: 0,
        learnedCards: 0,
        score: 0,
      };
    }
    acc[langId].totalCards += p.totalCards;
    acc[langId].learnedCards += p.learnedCards;
    acc[langId].score += p.score;
    return acc;
  }, {} as Record<string, { languageId: { id: string; name: string }; totalCards: number; learnedCards: number; score: number }>);

  const languageChartData = Object.values(languageProgress).map((lang) => ({
    name: lang.languageId.name,
    value: lang.learnedCards,
  }));

  const categoryChartData = progress.map((p) => ({
    name: `${p.categoryId.name} (${p.languageId.name})`,
    total: p.totalCards,
    learned: p.learnedCards,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Track Your Progress
        </h2>
        {loading && (
          <div className="flex justify-center items-center">
            <svg
              className="animate-spin h-5 w-5 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-2 text-gray-600">Loading progress...</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading && !error && progress.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105">
                <h3 className="text-lg font-semibold text-indigo-700">
                  Total Cards
                </h3>
                <p className="text-2xl font-bold text-gray-800">{totalCards}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105">
                <h3 className="text-lg font-semibold text-indigo-700">
                  Learned Cards
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {learnedCards} (
                  {totalCards
                    ? ((learnedCards / totalCards) * 100).toFixed(1)
                    : 0}
                  %)
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105">
                <h3 className="text-lg font-semibold text-indigo-700">
                  Total Score
                </h3>
                <p className="text-2xl font-bold text-gray-800">{totalScore}</p>
              </div>
            </div>
            {languageChartData.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-xl transform transition-all duration-750 hover:scale-105">
                <h3 className="text-lg font-semibold text-indigo-700 mb-4">
                  Language Progress
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={languageChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {languageChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {categoryChartData.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-xl transform transition-all duration-750 hover:scale-105">
                <h3 className="text-lg font-semibold text-indigo-700 mb-4">
                  Category Progress
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={categoryChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="learned" name="Learned Cards">
                      {categoryChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="total" name="Total Cards" fillOpacity={0.3}>
                      {categoryChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
        {!loading && !error && progress.length === 0 && (
          <div className="text-center text-gray-600">
            <p>No progress data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
