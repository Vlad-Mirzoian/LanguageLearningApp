import { useEffect, useState } from "react";
import type { ProgressData } from "../types";
import { getProgress } from "../services/api";
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
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const data = await getProgress();
        setProgress(data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load progress data");
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  // console.log(progress?.languagesStats);
  console.log(progress);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
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
        {!loading && !error && progress && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105 hover:sc">
                <h3 className="text-lg font-semibold text-indigo-700">
                  Total Cards
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {progress.totalCards}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105">
                <h3 className="text-lg font-semibold text-indigo-700">
                  Reviewed Today
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {progress.reviewedToday}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105">
                <h3 className="text-lg font-semibold text-indigo-700">
                  Learned Cards
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {progress.learnedCards}
                </p>
              </div>
            </div>
            {progress?.languagesStats?.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105">
                <h3 className="text-lg font-semibold text-indigo-700">
                  Language Progress
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={progress.languagesStats.map((stat) => ({
                        name: stat.learningLanguagesIds.name,
                        value: stat.learned,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {progress?.languagesStats?.map((_, index) => (
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
            {progress?.categoriesStats?.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105">
                <h3 className="text-lg font-semibold text-indigo-700">
                  Category Progress
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progress.categoriesStats}>
                    <XAxis dataKey="wordCategory.name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="learned" fill="#4F46E5" name="Learned" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
