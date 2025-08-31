import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { ApiError, Attempt } from "../types/index";
import { AttemptAPI } from "../services/index";
import { motion } from "framer-motion";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("viewAttemptPage.attemptDetails")}
        </h2>
        {loading && (
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">
              {t("viewAttemptPage.loadingAttemptData")}
            </span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {attempt && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <p className="text-gray-600">
              <span className="font-semibold">
                {t("viewAttemptPage.user")}:
              </span>{" "}
              {attempt.userId.username}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">
                {t("viewAttemptPage.language")}:
              </span>{" "}
              {attempt.languageId.name}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">
                {t("viewAttemptPage.module")}:
              </span>{" "}
              {attempt.moduleId?.name}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">
                {t("viewAttemptPage.exerciseType")}:
              </span>{" "}
              {t(`statisticsPage.${attempt.type}`)}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">
                {t("viewAttemptPage.score")}:
              </span>{" "}
              {attempt.score}%
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">
                {t("viewAttemptPage.date")}:
              </span>{" "}
              {new Date(attempt.date).toLocaleDateString()}
            </p>
            <a
              href="/register"
              className="block text-center mt-4 text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
            >
              {t("viewAttemptPage.joinLangster")}
            </a>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ViewAttemptPage;
