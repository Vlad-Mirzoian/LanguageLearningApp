import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { ApiError, Attempt } from "../types/index";
import { AttemptAPI } from "../services/index";
import { motion } from "framer-motion";
import { ArrowPathIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

const ViewAttemptPage: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttempt = async () => {
      if (!token) {
        setError(t("viewAttemptPage.invalidAttemptToken"));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await AttemptAPI.viewAttempt(token);
        setAttempt(data);
      } catch (err) {
        const error = err as ApiError;
        setError(error.message || t("viewAttemptPage.failedToLoadAttempt"));
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [token, setAttempt, t]);

  return (
    <div className="min-h-screen bg-background backdrop-blur-sm flex items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md sm:max-w-2xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8"
      >
        <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-center text-primary mb-6 tracking-tight">
          {t("viewAttemptPage.attemptDetails")}
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
              {t("viewAttemptPage.loadingAttemptData")}
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
        {attempt && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <p className="text-dark font-poppins text-base sm:text-lg">
              <span className="font-semibold">
                {t("viewAttemptPage.user")}:
              </span>{" "}
              {attempt.user.username}
            </p>
            <p className="text-dark font-poppins text-base sm:text-lg">
              <span className="font-semibold">
                {t("viewAttemptPage.language")}:
              </span>{" "}
              {attempt.language.name}
            </p>
            <p className="text-dark font-poppins text-base sm:text-lg">
              <span className="font-semibold">
                {t("viewAttemptPage.module")}:
              </span>{" "}
              {attempt.module?.name || t("viewAttemptPage.noModule")}
            </p>
            <p className="text-dark font-poppins text-base sm:text-lg">
              <span className="font-semibold">
                {t("viewAttemptPage.exerciseType")}:
              </span>{" "}
              {t(`statisticsPage.${attempt.type}`)}
            </p>
            <p className="text-dark font-poppins text-base sm:text-lg">
              <span className="font-semibold">
                {t("viewAttemptPage.score")}:
              </span>{" "}
              <span className="text-secondary">{attempt.score}%</span>
            </p>
            <p className="text-dark font-poppins text-base sm:text-lg">
              <span className="font-semibold">
                {t("viewAttemptPage.date")}:
              </span>{" "}
              {new Date(attempt.date).toLocaleDateString()}
            </p>
            <div className="mt-6 text-center">
              <p className="text-dark font-poppins text-base sm:text-lg mb-4">
                {t("viewAttemptPage.ctaDescription")}
              </p>
              <motion.a
                href="/register"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center bg-primary text-white py-2 px-4 rounded-lg font-poppins font-semibold hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200"
              >
                {t("viewAttemptPage.joinLangster")}
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </motion.a>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ViewAttemptPage;
