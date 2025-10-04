import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import type {
  ApiError,
  Attempt,
  Language,
  StatsResponse,
} from "../types/index";
import { LanguageAPI, StatsAPI } from "../services/index";
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
import { motion } from "framer-motion";

const StatisticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedLanguageId, setSelectedLanguageId } = useLanguage();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState<"7days" | "30days" | "all">(
    "all"
  );

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError("");
        const [statsData, langData] = await Promise.all([
          StatsAPI.getStats(
            selectedLanguageId ? { languageId: selectedLanguageId } : {}
          ),
          LanguageAPI.getLanguages(),
        ]);
        setStats(statsData);
        setLanguages(langData || []);
        if (user?.learningLanguagesIds?.length && !selectedLanguageId) {
          setSelectedLanguageId(user.learningLanguagesIds[0]);
        }
      } catch (err) {
        const error = err as ApiError;
        setError(error.message || t("statisticsPage.failedToLoadStatistics"));
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
      dateFilter === "7days"
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return attempts.filter((a) => new Date(a.date) >= cutoffDate);
  };

  const filteredAttempts = filterByDate(stats?.attempts || []).filter((a) => {
    const languageMatch = a.language?.id === selectedLanguageId;
    return languageMatch;
  });

  const attemptData = filteredAttempts
    .map((a) => ({
      date: new Date(a.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      score: a.score,
      moduleId: a.module?.id,
      moduleName: a.module?.name || "Unknown Module",
      levelId: a.level?.id,
      levelOrder: a.level?.order || 0,
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
    const modules = Array.from(new Set(attemptData.map((a) => a.moduleId)));
    modules.forEach((moduleId) => {
      const moduleAttempts = attemptData
        .filter((a) => a.date === date && a.moduleId === moduleId)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      const moduleStats = stats?.statsByModule[moduleId || ""] || null;
      const moduleName =
        moduleStats?.moduleName || `Module ${moduleId || "Unknown"}`;
      if (moduleAttempts.length > 0) {
        dataPoint[moduleName] = moduleAttempts[moduleAttempts.length - 1].score;
        dataPoint[`${moduleName}_attempts`] = moduleAttempts.length;
        dataPoint[`${moduleName}_type`] =
          moduleAttempts[moduleAttempts.length - 1].type;
        dataPoint[`${moduleName}_moduleId`] = moduleId;
      } else {
        dataPoint[moduleName] = undefined;
        dataPoint[`${moduleName}_attempts`] = undefined;
        dataPoint[`${moduleName}_type`] = undefined;
        dataPoint[`${moduleName}_moduleId`] = undefined;
      }
    });
    return dataPoint;
  });

  const accuracyData = ["flash", "test", "dictation"].map((type) => {
    const statsType = stats?.statsByType[type] || {
      correctAnswers: 0,
      totalAnswers: 0,
    };
    const accuracy =
      statsType.totalAnswers > 0
        ? (statsType.correctAnswers / statsType.totalAnswers) * 100
        : 0;
    return {
      type: t(`statisticsPage.${type}`),
      accuracy: Number(accuracy.toFixed(1)),
      correctAnswers: statsType.correctAnswers,
      totalAnswers: statsType.totalAnswers,
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
        languages.find((lang) => lang.id === selectedLanguageId)?.name ||
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
      yOffset += 20;

      doc.setFontSize(14);
      doc.text(t("statisticsPage.moduleProgress"), 10, yOffset);
      yOffset += 10;
      autoTable(doc, {
        startY: yOffset,
        head: [
          [
            t("statisticsPage.module"),
            t("statisticsPage.totalScore"),
            t("statisticsPage.completedLevels"),
            t("statisticsPage.totalLevels"),
          ],
        ],
        body: Object.values(stats?.statsByModule || {}).map((m) => [
          `${m.moduleName} (${t("statisticsPage.module")} ${m.order})`,
          m.totalScore.toFixed(2),
          m.completedLevels,
          m.totalLevels,
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [79, 70, 229] },
        margin: { top: 10 },
      });
      yOffset = (doc as any).lastAutoTable.finalY + 20;

      doc.setFontSize(14);
      doc.text(t("statisticsPage.levelProgress"), 10, yOffset);
      yOffset += 10;
      autoTable(doc, {
        startY: yOffset,
        head: [
          [
            t("statisticsPage.level"),
            t("statisticsPage.module"),
            t("statisticsPage.taskType"),
            t("statisticsPage.bestScore"),
          ],
        ],
        body: Object.values(stats?.statsByLevel || {}).map((l) => [
          l.levelOrder,
          l.moduleName,
          l.task || "Unknown",
          l.bestScore.toFixed(2),
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
        body: accuracyData.map((d) => [
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
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || t("statisticsPage.failedToExportPDF"));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-poppins font-bold text-center text-primary mb-6">
          {t("statisticsPage.statistics")}:{" "}
          {languages.find((lang) => lang.id === selectedLanguageId)?.name ||
            t("statisticsPage.selectLanguage")}
        </h2>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center mb-6"
          >
            <ArrowPathIcon className="h-5 w-5 text-primary animate-spin" />
            <span className="ml-2 text-dark font-poppins">
              {t("statisticsPage.loading")}
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
        {!loading && !error && selectedLanguageId && stats && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="mb-6 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <div>
                <label
                  htmlFor="dateFilter"
                  className="mr-2 text-dark font-poppins font-medium"
                >
                  {t("statisticsPage.filterByDate")}:
                </label>
                <select
                  id="dateFilter"
                  value={dateFilter}
                  onChange={(e) =>
                    setDateFilter(e.target.value as "7days" | "30days" | "all")
                  }
                  className="p-2 border border-gray-100 rounded-lg bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent hover:bg-white/80 font-poppins transition-all duration-200"
                >
                  <option value="7days">{t("statisticsPage.7days")}</option>
                  <option value="30days">{t("statisticsPage.30days")}</option>
                  <option value="all">{t("statisticsPage.all")}</option>
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDateFilter("all")}
                className="p-2 bg-gradient-primary text-white rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
              >
                {t("statisticsPage.resetFilters")}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExportToPDF}
                className="p-2 bg-secondary text-white rounded-lg font-poppins font-semibold hover:bg-secondary/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
              >
                {t("statisticsPage.exportToPDF")}
              </motion.button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="mb-6 bg-white/98 backdrop-blur-sm p-6 rounded-lg shadow-lg"
            >
              <h3 className="text-xl font-poppins font-semibold text-dark mb-4">
                {t("statisticsPage.summary")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50/80 rounded-lg">
                  <p className="text-dark font-poppins">
                    {t("statisticsPage.totalModules")}:{" "}
                    {stats.summary.totalModules}
                  </p>
                  <p className="text-dark font-poppins">
                    {t("statisticsPage.completedModules")}:{" "}
                    {stats.summary.completedModules}
                  </p>
                </div>
                <div className="p-4 bg-gray-50/80 rounded-lg">
                  <p className="text-dark font-poppins">
                    {t("statisticsPage.totalLevels")}:{" "}
                    {stats.summary.totalLevels}
                  </p>
                  <p className="text-dark font-poppins">
                    {t("statisticsPage.completedLevels")}:{" "}
                    {stats.summary.completedLevels}
                  </p>
                </div>
                <div className="p-4 bg-gray-50/80 rounded-lg">
                  <p className="text-dark font-poppins">
                    {t("statisticsPage.totalAchievements")}:{" "}
                    {stats.summary.totalAchievements}
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.3 }}
              className="mb-6 bg-white/98 backdrop-blur-sm p-6 rounded-lg shadow-lg"
            >
              <h3 className="text-xl font-poppins font-semibold text-dark mb-4">
                {t("statisticsPage.moduleProgress")}
              </h3>
              {Object.values(stats.statsByModule).length === 0 ? (
                <div className="text-center text-dark font-poppins py-8">
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
                        tick={{ fontSize: 12, fill: "#2D3748" }}
                        tickLine={false}
                        axisLine={{ stroke: "#D1D5DB" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: "#2D3748" }}
                        tickLine={false}
                        axisLine={{ stroke: "#D1D5DB" }}
                        label={{
                          value: t("statisticsPage.score"),
                          angle: -90,
                          position: "insideLeft",
                          offset: -5,
                          fill: "#2D3748",
                          fontSize: 14,
                          fontFamily: "Poppins",
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFF",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          fontFamily: "Poppins",
                        }}
                        formatter={(value, name, props) => {
                          const moduleName = String(name).replace(
                            /Module /,
                            ""
                          );
                          const attemptCount =
                            props.payload[`${name}_attempts`] || 0;
                          const type =
                            props.payload[`${name}_type`] || "Unknown";
                          const moduleId = props.payload[`${name}_moduleId`];
                          const totalScore =
                            stats.statsByModule[moduleId]?.totalScore.toFixed(
                              2
                            ) || 0;
                          return [
                            `${value} (${t(
                              "statisticsPage.attempts"
                            )}: ${attemptCount}, ${t(
                              "statisticsPage.type"
                            )}: ${t(`statisticsPage.${type}`)}, ${t(
                              "statisticsPage.totalScore"
                            )}: ${totalScore})`,
                            `${t("statisticsPage.module")} ${
                              stats.statsByModule[moduleId]?.order || 0
                            }: ${moduleName}`,
                          ];
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          paddingTop: "10px",
                          fontSize: 14,
                          color: "#2D3748",
                          fontFamily: "Poppins",
                        }}
                        formatter={(value) => {
                          const moduleStats = Object.values(
                            stats.statsByModule
                          ).find((m) => m.moduleName === value);
                          return `${t("statisticsPage.module")} ${
                            moduleStats?.order || 0
                          }: ${value.replace(/Module /, "")}`;
                        }}
                      />
                      {Object.values(stats.statsByModule).map((m, index) => (
                        <Line
                          key={m.moduleName}
                          type="monotone"
                          dataKey={m.moduleName}
                          name={m.moduleName}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={{ r: 4, fill: colors[index % colors.length] }}
                          activeDot={{ r: 6, stroke: "#FFF", strokeWidth: 2 }}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="mb-6 bg-white/98 backdrop-blur-sm p-6 rounded-lg shadow-lg"
            >
              <h3 className="text-xl font-poppins font-semibold text-dark mb-4">
                {t("statisticsPage.accuracyByExerciseType")}
              </h3>
              {accuracyData.every((d) => d.accuracy === 0) ? (
                <p className="text-dark font-poppins">
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
                        tick={{ fontSize: 12, fill: "#2D3748" }}
                        tickLine={false}
                        axisLine={{ stroke: "#D1D5DB" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: "#2D3748" }}
                        tickLine={false}
                        axisLine={{ stroke: "#D1D5DB" }}
                        label={{
                          value: t("statisticsPage.accuracy"),
                          angle: -90,
                          position: "insideLeft",
                          offset: -5,
                          fill: "#2D3748",
                          fontSize: 14,
                          fontFamily: "Poppins",
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFF",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          fontFamily: "Poppins",
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
                          color: "#2D3748",
                          fontFamily: "Poppins",
                        }}
                      />
                      <Bar
                        dataKey="accuracy"
                        fill="#4C78D6"
                        name={t("statisticsPage.accuracy")}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default StatisticsPage;
