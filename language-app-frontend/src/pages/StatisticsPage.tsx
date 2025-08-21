import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import type { Attempt, Language, StatsByType, UserProgress } from "../types";
import { AxiosError } from "axios";
import { getLanguages, getStats } from "../services/api";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const StatisticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedLanguageId, setSelectedLanguageId } = useLanguage();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [statsByType, setStatsByType] = useState<StatsByType>({});
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState<"7 days" | "30 days" | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<
    "flash" | "test" | "dictation" | "all"
  >("all");

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError("");
        const [statsData, langData] = await Promise.all([
          getStats(
            selectedLanguageId ? { languageId: selectedLanguageId } : {}
          ),
          getLanguages(),
        ]);
        setProgress(statsData.progress || []);
        setStatsByType(statsData.statsByType || {});
        setAttempts(
          statsData.attempts?.map((a: Attempt) => ({
            ...a,
            date: a.date,
          })) || []
        );
        setLanguages(langData || []);
        if (user?.learningLanguagesIds?.length && !selectedLanguageId) {
          setSelectedLanguageId(user.learningLanguagesIds[0]);
        }
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          setError(
            error.response?.data?.error ||
              t("statisticsPage.failedToLoadStatistics")
          );
        } else {
          setError(t("statisticsPage.failedToLoadStatistics"));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStatistics();
  }, [user, selectedLanguageId, setSelectedLanguageId, t]);

  const filterByDate = (attempts: Attempt[]): Attempt[] => {
    if (dateFilter === "all") return attempts;
    const now = new Date();
    const cutoffDate =
      dateFilter === "7 days"
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return attempts.filter((a) => new Date(a.date) >= cutoffDate);
  };

  const filteredAttempts = filterByDate(attempts).filter((a) => {
    const languageMatch =
      String(a.languageId?._id || a.languageId) === selectedLanguageId;
    const typeMatch = typeFilter === "all" || a.type === typeFilter;
    return languageMatch && typeMatch;
  });

  const attemptData = filteredAttempts
    .map((a) => ({
      date: new Date(a.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      score: a.score,
      categoryId: a.categoryId._id,
      categoryName: a.categoryId.name,
      type: a.type,
      attemptCount: 1,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const uniqueDates = Array.from(new Set(attemptData.map((a) => a.date)));

  const chartData = uniqueDates.map((date) => {
    const dataPoint: {
      date: string;
      [key: string]: number | string | undefined;
    } = { date };
    const categories = Array.from(
      new Set(attemptData.map((a) => a.categoryId))
    );
    categories.forEach((categoryId) => {
      const categoryAttempts = attemptData
        .filter((a) => a.date === date && a.categoryId === categoryId)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      const categoryProgress = progress.find(
        (p) => p.categoryId._id === categoryId
      );
      const categoryName =
        categoryProgress?.categoryId.name || `Category ${categoryId}`;
      if (categoryAttempts.length > 0) {
        dataPoint[categoryName] =
          categoryAttempts[categoryAttempts.length - 1].score;
        dataPoint[`${categoryName}_attempts`] = categoryAttempts.length;
        dataPoint[`${categoryName}_type`] =
          categoryAttempts[categoryAttempts.length - 1].type;
        dataPoint[`${categoryName}_categoryId`] = categoryId;
      } else {
        dataPoint[categoryName] = undefined;
        dataPoint[`${categoryName}_attempts`] = undefined;
        dataPoint[`${categoryName}_type`] = undefined;
        dataPoint[`${categoryName}_categoryId`] = undefined;
      }
    });
    return dataPoint;
  });

  const languageProgress = progress.filter(
    (p) => String(p.languageId) === selectedLanguageId
  );

  const accuracyData = ["flash", "test", "dictation"].map((type) => {
    const stats = statsByType[type] || { correctAnswers: 0, totalAnswers: 0 };
    const accuracy =
      stats.totalAnswers > 0
        ? (stats.correctAnswers / stats.totalAnswers) * 100
        : 0;
    return {
      type: t(`statisticsPage.${type}`),
      accuracy: Number(accuracy.toFixed(1)),
      correctAnswers: stats.correctAnswers,
      totalAnswers: stats.totalAnswers,
    };
  });

  const colors = ["#4B0082", "#FF4500", "#228B22", "#FFD700"];

  const handleExportToPDF = () => {
    if (!selectedLanguageId) {
      setError(t("statisticsPage.selectLanguagePrompt"));
      return;
    }
    try {
      const doc = new jsPDF();
      const languageName =
        languages.find((lang) => lang._id === selectedLanguageId)?.name ||
        t("statisticsPage.selectLanguage");

      let yOffset = 15;
      doc.setFontSize(16);
      doc.text(
        `${t("statisticsPage.languageLearningStatistics")} - ${languageName}`,
        10,
        yOffset
      );

      doc.setFontSize(12);
      yOffset += 10;
      doc.text(
        `${t("statisticsPage.filterByDate")}: ${t(
          `statisticsPage.${dateFilter.replace(" ", "")}`
        )}`,
        10,
        yOffset
      );
      yOffset += 10;
      doc.text(
        `${t("statisticsPage.filterByType")}: ${
          typeFilter === "all"
            ? t("statisticsPage.allTypes")
            : t(`statisticsPage.${typeFilter}`)
        }`,
        10,
        yOffset
      );
      yOffset += 20;

      doc.setFontSize(14);
      doc.text(t("statisticsPage.dailyProgressByCategory"), 10, yOffset);
      yOffset += 10;
      autoTable(doc, {
        startY: yOffset,
        head: [
          [
            t("statisticsPage.level"),
            t("statisticsPage.category"),
            t("statisticsPage.maxScore"),
            t("statisticsPage.totalCards"),
          ],
        ],
        body: languageProgress.map((p) => [
          p.categoryId.order,
          p.categoryId.name,
          p.maxScore.toFixed(2),
          p.totalCards,
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [79, 70, 229] },
        margin: { top: 10 },
      });
      yOffset = (doc as any).lastAutoTable.finalY + 20;

      doc.setFontSize(14);
      doc.text(t("statisticsPage.accuracyByExerciseType"), 10, yOffset);
      yOffset += 10;
      autoTable(doc, {
        startY: yOffset,
        head: [
          [
            t("statisticsPage.exerciseType"),
            t("statisticsPage.correctAnswers"),
            t("statisticsPage.totalAnswers"),
            t("statisticsPage.accuracy"),
          ],
        ],
        body: accuracyData
          .filter(
            (d) =>
              typeFilter === "all" ||
              d.type.toLowerCase() === t(`statisticsPage.${typeFilter}`)
          )
          .map((d) => [
            d.type,
            d.correctAnswers,
            d.totalAnswers,
            d.accuracy.toFixed(1),
          ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [79, 70, 229] },
        margin: { top: 10 },
      });

      doc.save(
        `language_stats_${selectedLanguageId}_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
      toast(t("statisticsPage.exportedToPDF"));
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.error || t("statisticsPage.failedToExportPDF")
        );
      } else {
        setError(t("statisticsPage.failedToExportPDF"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("statisticsPage.statistics")}:{" "}
          {languages.find((lang) => lang._id === selectedLanguageId)?.name ||
            t("statisticsPage.selectLanguage")}
        </h2>
        {loading && (
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">
              {t("statisticsPage.loading")}
            </span>
          </div>
        )}
        {error && (
          <div className="mb-4 p-2 bg-red-600 text-white text-sm rounded-lg">
            {error}
          </div>
        )}
        {!loading && !error && selectedLanguageId && (
          <>
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
              <div>
                <label
                  htmlFor="dateFilter"
                  className="mr-2 text-gray-700 font-medium"
                >
                  {t("statisticsPage.filterByDate")}:
                </label>
                <select
                  id="dateFilter"
                  value={dateFilter}
                  onChange={(e) =>
                    setDateFilter(
                      e.target.value as "7 days" | "30 days" | "all"
                    )
                  }
                  className="p-2 border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="7 days">
                    {t("statisticsPage.last7Days")}
                  </option>
                  <option value="30 days">
                    {t("statisticsPage.last30Days")}
                  </option>
                  <option value="all">{t("statisticsPage.allTime")}</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="typeFilter"
                  className="mr-2 text-gray-700 font-medium"
                >
                  {t("statisticsPage.filterByType")}:
                </label>
                <select
                  id="typeFilter"
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(
                      e.target.value as "flash" | "test" | "dictation" | "all"
                    )
                  }
                  className="p-2 border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">{t("statisticsPage.allTypes")}</option>
                  <option value="flash">{t("statisticsPage.flash")}</option>
                  <option value="test">{t("statisticsPage.test")}</option>
                  <option value="dictation">
                    {t("statisticsPage.dictation")}
                  </option>
                </select>
              </div>
              <button
                onClick={() => {
                  setDateFilter("all");
                  setTypeFilter("all");
                }}
                className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {t("statisticsPage.resetFilters")}
              </button>
              <button
                onClick={handleExportToPDF}
                className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
              >
                {t("statisticsPage.exportToPDF")}
              </button>
            </div>
            <div className="mb-6 bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {t("statisticsPage.dailyProgressByCategory")}
              </h3>
              {attemptData.length === 0 || languageProgress.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <p className="mb-2">{t("statisticsPage.noAttemptData")}</p>
                  <p className="text-sm">
                    {t("statisticsPage.completeExercisesPrompt")}
                  </p>
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: "#4B5563" }}
                        tickLine={false}
                        axisLine={{ stroke: "#D1D5DB" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: "#4B5563" }}
                        tickLine={false}
                        axisLine={{ stroke: "#D1D5DB" }}
                        label={{
                          value: t("statisticsPage.score"),
                          angle: -90,
                          position: "insideLeft",
                          offset: -5,
                          fill: "#4B5563",
                          fontSize: 14,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFF",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value, name, props) => {
                          const categoryName = String(name).replace(
                            /Category /,
                            ""
                          );
                          const attemptCount =
                            props.payload[`${name}_attempts`] || 0;
                          const type =
                            props.payload[`${name}_type`] || "Unknown";
                          const categoryId =
                            props.payload[`${name}_categoryId`];
                          const maxScore =
                            languageProgress.find(
                              (p) => p.categoryId._id === categoryId
                            )?.maxScore || 0;
                          return [
                            `${value}% (${t(
                              "statisticsPage.attempts"
                            )}: ${attemptCount}, ${t(
                              "statisticsPage.type"
                            )}: ${t(`statisticsPage.${type}`)}, ${t(
                              "statisticsPage.max"
                            )}: ${maxScore}%)`,
                            `${t("statisticsPage.level")} ${
                              languageProgress.find(
                                (p) => p.categoryId._id === categoryId
                              )?.categoryId.order || 0
                            }: ${categoryName}`,
                          ];
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          paddingTop: "10px",
                          fontSize: 14,
                          color: "#1F2937",
                        }}
                        formatter={(value) => {
                          const categoryProgress = languageProgress.find(
                            (p) => p.categoryId.name === value
                          );
                          return `${t("statisticsPage.level")} ${
                            categoryProgress?.categoryId.order || 0
                          }: ${value.replace(/Category /, "")}`;
                        }}
                      />
                      {languageProgress.map((p, index) => {
                        const categoryName =
                          p.categoryId.name || `Category ${p.categoryId._id}`;
                        return (
                          <Line
                            key={p.categoryId._id}
                            type="monotone"
                            dataKey={categoryName}
                            name={categoryName}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={{ r: 4, fill: colors[index % colors.length] }}
                            activeDot={{ r: 6, stroke: "#FFF", strokeWidth: 2 }}
                            connectNulls={false}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="mb-6 bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {t("statisticsPage.accuracyByExerciseType")}
              </h3>
              {accuracyData.every((d) => d.accuracy === 0) ? (
                <p className="text-gray-600">
                  {t("statisticsPage.noAccuracyData")}
                </p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={accuracyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="type"
                        tick={{ fontSize: 12, fill: "#4B5563" }}
                        tickLine={false}
                        axisLine={{ stroke: "#D1D5DB" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: "#4B5563" }}
                        tickLine={false}
                        axisLine={{ stroke: "#D1D5DB" }}
                        label={{
                          value: t("statisticsPage.accuracy"),
                          angle: -90,
                          position: "insideLeft",
                          offset: -5,
                          fill: "#4B5563",
                          fontSize: 14,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFF",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value) => [
                          `${value}%`,
                          t("statisticsPage.accuracy"),
                        ]}
                      />
                      <Legend
                        wrapperStyle={{
                          paddingTop: "10px",
                          fontSize: 14,
                          color: "#1F2937",
                        }}
                      />
                      <Bar
                        dataKey="accuracy"
                        fill="#4B0082"
                        name={t("statisticsPage.accuracy")}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;
