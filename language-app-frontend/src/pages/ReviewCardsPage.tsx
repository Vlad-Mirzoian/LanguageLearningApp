import { useEffect, useState } from "react";
import type {
  ApiError,
  Card,
  Module,
  Language,
  TestCard,
  ModuleProgress,
  LevelProgress,
} from "../types/index";
import {
  ModuleAPI,
  LanguageAPI,
  CardAPI,
  LanguageProgressAPI,
  AttemptAPI,
} from "../services/index";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import {
  ArrowPathIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { CheckIcon } from "@heroicons/react/24/solid";
import { ClipboardIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

type ExerciseType = "flash" | "test" | "dictation" | null;
type AnswerResult = { isCorrect?: boolean; correctTranslation?: string } | null;

const ReviewCardsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedLanguageId, setSelectedLanguageId } = useLanguage();
  const [cards, setCards] = useState<Card[]>([]);
  const [testCards, setTestCards] = useState<TestCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [progress, setProgress] = useState<{
    modules: ModuleProgress[];
    levels: LevelProgress[];
  }>({ modules: [], levels: [] });
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState<ExerciseType>(null);
  const [cardAnswer, setCardAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState<AnswerResult>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchFiltersAndProgress = async () => {
      try {
        setLoading(true);
        const langData = await LanguageAPI.getLanguages();
        setLanguages(langData);
        if (selectedLanguageId === null) {
          setError(t("reviewCardsPage.selectLearningLanguage"));
          setModules([]);
          return;
        }
        const [modData, progressData] = await Promise.all([
          ModuleAPI.getModules(
            selectedLanguageId ? { languageId: selectedLanguageId } : {}
          ),
          LanguageProgressAPI.getLanguageProgress(
            selectedLanguageId ? { languageId: selectedLanguageId } : {}
          ),
        ]);
        setModules(modData.modules);
        setProgress(progressData);
      } catch (err) {
        const error = err as ApiError;
        setError(error.message || t("reviewCardsPage.failedToLoadFilters"));
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchFiltersAndProgress();
  }, [user, selectedLanguageId, setSelectedLanguageId, t]);

  const handleStartModule = (moduleId: string) => {
    setSelectedModule(moduleId);
  };

  const handleStartLevel = (levelId: string) => {
    const level = progress.levels.find((lvl) => lvl.level.id === levelId);
    if (!level) {
      setError(t("reviewCardsPage.levelNotFound"));
      return;
    }
    const taskType = level.level.tasks as ExerciseType;
    if (!taskType) {
      setError(t("reviewCardsPage.noTaskType"));
      return;
    }
    setSelectedLevel(levelId);
    setExerciseType(taskType);
    loadCards(taskType, selectedLanguageId!, selectedModule, levelId);
  };

  const loadCards = async (
    type: ExerciseType,
    languageId: string,
    moduleId?: string,
    levelId?: string
  ) => {
    try {
      if (!languageId) {
        setError(t("reviewCardsPage.selectLearningLanguage"));
        return;
      }
      if (!levelId) {
        setError(t("reviewCardsPage.selectLevel"));
        return;
      }
      setLoading(true);
      setError("");
      setTotalScore(0);
      setShareLink(null);

      const filters = { languageId, moduleId };
      let response;
      if (type === "test") {
        response = await CardAPI.getTestCards(filters);
        setTestCards(response.cards);
      } else {
        response = await CardAPI.getReviewCards(filters);
        setCards(response.cards);
      }

      setAttemptId(response.attemptId);
      setCurrentCardIndex(0);
      setShowTranslation(false);
      setCardAnswer("");
      setAnswerResult(null);
      setShowCardsModal(true);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || t("reviewCardsPage.failedToLoadCards"));
    } finally {
      setLoading(false);
    }
  };

  const handleFlashReview = async () => {
    if (!cards[currentCardIndex]) return;
    if (selectedLanguageId === null || !selectedLevel) {
      setError(t("reviewCardsPage.selectLearningLanguage"));
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const result = await CardAPI.submitCard(cards[currentCardIndex].id, {
        languageId: selectedLanguageId,
        answer: cardAnswer,
        attemptId,
        type: "flash",
        levelId: selectedLevel,
      });
      setAnswerResult({
        isCorrect: result.isCorrect,
        correctTranslation: result.correctTranslation,
      });
      setTotalScore(
        (prev) => prev + ((result.quality as number) / 5) * (100 / cards.length)
      );
      toast(
        result.isCorrect
          ? t("reviewCardsPage.correct")
          : `${t("reviewCardsPage.incorrect")}: ${result.correctTranslation}`
      );

      setTimeout(async () => {
        const nextIndex = currentCardIndex + 1;
        setCurrentCardIndex(nextIndex);
        setCardAnswer("");
        setAnswerResult(null);
        setShowTranslation(false);
        if (nextIndex >= cards.length) {
          const updatedProgress = await LanguageProgressAPI.getLanguageProgress(
            {
              languageId: selectedLanguageId,
            }
          );
          setProgress(updatedProgress);
          const currentModule = modules.find(
            (mod) => mod.id === selectedModule
          );
          const currentLevel = progress.levels.find(
            (lvl) => lvl.level.id === selectedLevel
          );
          const nextModule = currentModule
            ? modules.find((mod) => mod.order === currentModule.order + 1)
            : null;
          const nextLevel = currentModule
            ? progress.levels.find(
                (lvl) =>
                  lvl.moduleId === selectedModule &&
                  lvl.level.order === (currentLevel?.level.order || 0) + 1
              )
            : null;
          if (nextLevel && nextLevel.unlocked) {
            toast(
              `${t("reviewCardsPage.level")} ${nextLevel.level.order} ${t(
                "reviewCardsPage.unlocked"
              )}`
            );
          } else if (nextModule) {
            const nextModuleProgress = updatedProgress.modules.find(
              (p) => p.module.id === nextModule.id
            );
            const prevNextModuleProgress = prevProgressData.modules.find(
              (p) => p.module.id === nextModule.id
            );
            if (
              nextModuleProgress?.unlocked &&
              !prevNextModuleProgress?.unlocked
            ) {
              toast(
                `${t("reviewCardsPage.module")} ${nextModule.order} ${t(
                  "reviewCardsPage.unlocked"
                )}`
              );
            }
          }
          const currentLevelProgress = updatedProgress.levels.find(
            (p) => p.level.id === selectedLevel
          );
          toast(
            `${t("reviewCardsPage.levelCompleted")} ${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%, ${t(
              "reviewCardsPage.bestScore"
            )}: ${currentLevelProgress?.bestScore.toFixed(2) || "0"}%`
          );
        } else {
          toast(
            `${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%`
          );
        }
      }, 1500);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || t("reviewCardsPage.failedToSubmitAnswer"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestAnswer = async (selectedAnswer: string) => {
    if (!testCards[currentCardIndex]) return;
    if (selectedLanguageId === null || !selectedLevel) {
      setError(t("reviewCardsPage.selectLearningLanguage"));
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const result = await CardAPI.submitCard(testCards[currentCardIndex].id, {
        languageId: selectedLanguageId,
        answer: selectedAnswer,
        attemptId,
        type: "test",
        levelId: selectedLevel,
      });
      setAnswerResult({
        isCorrect: result.isCorrect,
        correctTranslation: result.correctTranslation,
      });
      setTotalScore(
        (prev) =>
          prev + ((result.quality as number) / 5) * (100 / testCards.length)
      );
      toast(
        result.isCorrect
          ? t("reviewCardsPage.correct")
          : `${t("reviewCardsPage.incorrect")}: ${result.correctTranslation}`
      );

      setTimeout(async () => {
        const nextIndex = currentCardIndex + 1;
        setCurrentCardIndex(nextIndex);
        setAnswerResult(null);
        if (nextIndex >= testCards.length) {
          const updatedProgress = await LanguageProgressAPI.getLanguageProgress(
            {
              languageId: selectedLanguageId,
            }
          );
          setProgress(updatedProgress);
          const currentModule = modules.find(
            (mod) => mod.id === selectedModule
          );
          const currentLevel = progress.levels.find(
            (lvl) => lvl.level.id === selectedLevel
          );
          const nextModule = currentModule
            ? modules.find((mod) => mod.order === currentModule.order + 1)
            : null;
          const nextLevel = currentModule
            ? progress.levels.find(
                (lvl) =>
                  lvl.moduleId === selectedModule &&
                  lvl.level.order === (currentLevel?.level.order || 0) + 1
              )
            : null;
          if (nextLevel && nextLevel.unlocked) {
            toast(
              `${t("reviewCardsPage.level")} ${nextLevel.level.order} ${t(
                "reviewCardsPage.unlocked"
              )}`
            );
          } else if (nextModule) {
            const nextModuleProgress = updatedProgress.modules.find(
              (p) => p.module.id === nextModule.id
            );
            const prevNextModuleProgress = prevProgressData.modules.find(
              (p) => p.module.id === nextModule.id
            );
            if (
              nextModuleProgress?.unlocked &&
              !prevNextModuleProgress?.unlocked
            ) {
              toast(
                `${t("reviewCardsPage.module")} ${nextModule.order} ${t(
                  "reviewCardsPage.unlocked"
                )}`
              );
            }
          }
          const currentLevelProgress = updatedProgress.levels.find(
            (p) => p.level.id === selectedLevel
          );
          toast(
            `${t("reviewCardsPage.levelCompleted")} ${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%, ${t(
              "reviewCardsPage.bestScore"
            )}: ${currentLevelProgress?.bestScore.toFixed(2) || "0"}%`
          );
        } else {
          toast(
            `${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%`
          );
        }
      }, 1500);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || t("reviewCardsPage.failedToSubmitAnswer"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDictationSubmit = async () => {
    if (!cards[currentCardIndex] || !cardAnswer.trim()) return;
    if (selectedLanguageId === null || !selectedLevel) {
      setError(t("reviewCardsPage.selectLearningLanguage"));
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const result = await CardAPI.submitCard(cards[currentCardIndex].id, {
        languageId: selectedLanguageId,
        answer: cardAnswer,
        attemptId,
        type: "dictation",
        levelId: selectedLevel,
      });
      setAnswerResult({
        isCorrect: result.isCorrect,
        correctTranslation: result.correctTranslation,
      });
      setTotalScore(
        (prev) => prev + ((result.quality as number) / 5) * (100 / cards.length)
      );
      toast(
        result.isCorrect
          ? t("reviewCardsPage.correct")
          : `${t("reviewCardsPage.incorrect")}: ${result.correctTranslation}`
      );

      setTimeout(async () => {
        const nextIndex = currentCardIndex + 1;
        setCurrentCardIndex(nextIndex);
        setCardAnswer("");
        setAnswerResult(null);
        if (nextIndex >= cards.length) {
          const updatedProgress = await LanguageProgressAPI.getLanguageProgress(
            {
              languageId: selectedLanguageId,
            }
          );
          setProgress(updatedProgress);
          const currentModule = modules.find(
            (mod) => mod.id === selectedModule
          );
          const currentLevel = progress.levels.find(
            (lvl) => lvl.level.id === selectedLevel
          );
          const nextModule = currentModule
            ? modules.find((mod) => mod.order === currentModule.order + 1)
            : null;
          const nextLevel = currentModule
            ? progress.levels.find(
                (lvl) =>
                  lvl.moduleId === selectedModule &&
                  lvl.level.order === (currentLevel?.level.order || 0) + 1
              )
            : null;
          if (nextLevel && nextLevel.unlocked) {
            toast(
              `${t("reviewCardsPage.level")} ${nextLevel.level.order} ${t(
                "reviewCardsPage.unlocked"
              )}`
            );
          } else if (nextModule) {
            const nextModuleProgress = updatedProgress.modules.find(
              (p) => p.module.id === nextModule.id
            );
            const prevNextModuleProgress = prevProgressData.modules.find(
              (p) => p.module.id === nextModule.id
            );
            if (
              nextModuleProgress?.unlocked &&
              !prevNextModuleProgress?.unlocked
            ) {
              toast(
                `${t("reviewCardsPage.module")} ${nextModule.order} ${t(
                  "reviewCardsPage.unlocked"
                )}`
              );
            }
          }
          const currentLevelProgress = updatedProgress.levels.find(
            (p) => p.level.id === selectedLevel
          );
          toast(
            `${t("reviewCardsPage.levelCompleted")} ${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%, ${t(
              "reviewCardsPage.bestScore"
            )}: ${currentLevelProgress?.bestScore.toFixed(2) || "0"}%`
          );
        } else {
          toast(
            `${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%`
          );
        }
      }, 1500);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || t("reviewCardsPage.failedToSubmitAnswer"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareAttempt = async () => {
    if (!attemptId) {
      toast(t("reviewCardsPage.noAttemptSelected"));
      return;
    }
    try {
      const shareUrl = await AttemptAPI.shareAttempt(attemptId);
      setShareLink(shareUrl);
      toast(t("reviewCardsPage.shareLinkGenerated"));
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || t("reviewCardsPage.failedToGenerateShareLink"));
    }
  };

  const closeModal = () => {
    setShowCardsModal(false);
    setSelectedModule("");
    setSelectedLevel("");
    setCards([]);
    setTestCards([]);
    setCurrentCardIndex(0);
    setShowTranslation(false);
    setShowExample(false);
    setCardAnswer("");
    setTotalScore(0);
    setAttemptId(null);
    setExerciseType(null);
    setAnswerResult(null);
    setShareLink(null);
  };

  const currentCard = cards[currentCardIndex];
  const currentTestCard = testCards[currentCardIndex];

  const languageProgress = progress.modules.filter(
    (p) => p.languageId === selectedLanguageId
  );
  const languageTotalPoints = languageProgress.reduce(
    (sum, p) => sum + p.totalScore,
    0
  );
  const languageModules = modules.filter(
    (m) => m.language?.id === selectedLanguageId
  );

  const getScoreColor = (score: number, requiredScore: number) => {
    const percentage = (score / requiredScore) * 100;
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const toggleExample = () => setShowExample((prev) => !prev);

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case "flash":
        return <ArrowUpIcon className="w-5 h-5 text-indigo-600" />;
      case "test":
        return <CheckCircleIcon className="w-5 h-5 text-indigo-600" />;
      case "dictation":
        return <PencilIcon className="w-5 h-5 text-indigo-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("reviewCardsPage.course")}:{" "}
          {languages.find((lang) => lang.id === selectedLanguageId)?.name ||
            t("reviewCardsPage.selectLanguage")}
        </h2>
        {selectedLanguageId && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t("reviewCardsPage.courseProgress")}
            </h3>
            <p className="text-gray-600">
              {t("reviewCardsPage.totalScore")}:{" "}
              {languageTotalPoints.toFixed(2)}
            </p>
            <p className="text-gray-600">
              {t("reviewCardsPage.completedModules")}:{" "}
              {Math.max(
                languageProgress.filter((p) => p.unlocked).length - 1,
                0
              )}{" "}
              / {languageModules.length}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{
                  width: `${
                    languageProgress.length
                      ? (languageProgress.filter((p) => p.unlocked).length - 1,
                        0 / languageProgress.length) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        )}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {t("reviewCardsPage.modules")}
          </h3>
          {loading && (
            <div className="flex items-center mb-4">
              <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
              <span className="ml-2 text-gray-600">
                {t("reviewCardsPage.loading")}
              </span>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
              {error}
            </div>
          )}
          {!loading && !error && modules.length === 0 && (
            <div className="text-center text-gray-600">
              {t("reviewCardsPage.noModulesAvailable")}
            </div>
          )}
          {!loading && !error && modules.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {modules.map((mod) => {
                const modProgress = progress.modules.find(
                  (p) => p.module.id === mod.id
                );
                const moduleLevels = progress.levels.filter(
                  (lvl) => lvl.moduleId === mod.id
                );
                const isUnlocked = modProgress?.unlocked || mod.order === 1;
                const isSelected = selectedModule === mod.id;

                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`relative p-6 rounded-xl shadow-lg transition-all duration-200 ${
                      isUnlocked
                        ? "bg-white hover:shadow-xl"
                        : "bg-gray-100 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {t("reviewCardsPage.module")} {mod.order}: {mod.name}
                      </h4>
                      {isUnlocked ? (
                        <LockOpenIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <LockClosedIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {t("reviewCardsPage.completedLevels")}:{" "}
                      <span className="font-medium">
                        {modProgress?.completedLevels || 0} /{" "}
                        {modProgress?.totalLevels || 0}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      {t("reviewCardsPage.totalScore")}:{" "}
                      <span
                        className={`font-medium ${getScoreColor(
                          modProgress?.totalScore || 0,
                          mod.requiredScore
                        )}`}
                      >
                        {modProgress?.totalScore.toFixed(2) || 0}
                      </span>
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            modProgress?.totalScore
                              ? Math.min(modProgress.totalScore, 100)
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <button
                      onClick={() => handleStartModule(mod.id)}
                      disabled={!isUnlocked}
                      className={`w-full py-2 rounded-lg font-semibold transition-colors duration-200 ${
                        isUnlocked
                          ? isSelected
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                          : "bg-gray-300 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      {isUnlocked
                        ? t("reviewCardsPage.selectModule")
                        : t("reviewCardsPage.locked")}
                    </button>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4"
                        >
                          <h5 className="text-sm font-semibold text-gray-800 mb-2">
                            {t("reviewCardsPage.levels")}
                          </h5>
                          <div className="space-y-3">
                            {moduleLevels.map((lvl) => (
                              <motion.div
                                key={lvl.level.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className={`p-4 rounded-lg shadow-sm transition-all duration-200 ${
                                  lvl.unlocked
                                    ? "bg-gray-50 hover:bg-gray-100"
                                    : "bg-gray-200 opacity-70"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    {getTaskIcon(lvl.level.tasks as string)}
                                    <p className="text-sm font-medium text-gray-700">
                                      {t("reviewCardsPage.level")}{" "}
                                      {lvl.level.order}
                                    </p>
                                  </div>
                                  {lvl.unlocked ? (
                                    <LockOpenIcon className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <LockClosedIcon className="w-4 h-4 text-gray-500" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                  {t("reviewCardsPage.taskType")}:{" "}
                                  <span className="capitalize">
                                    {lvl.level.tasks}
                                  </span>
                                </p>
                                <button
                                  onClick={() => handleStartLevel(lvl.level.id)}
                                  disabled={!lvl.unlocked}
                                  className={`mt-2 w-full py-1.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                                    lvl.unlocked
                                      ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                  }`}
                                >
                                  {lvl.unlocked
                                    ? t("reviewCardsPage.studyLevel")
                                    : t("reviewCardsPage.locked")}
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {showCardsModal && (
          <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"></div>
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-gray-50 pt-10 pb-5 px-10 rounded-lg shadow-lg w-full max-w-md relative">
                <button
                  onClick={closeModal}
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {t("reviewCardsPage.attemptProgress")}:{" "}
                    {totalScore.toFixed(1)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${Math.min(totalScore, 100)}%` }}
                    ></div>
                  </div>
                </div>
                {loading && (
                  <div className="flex items-center mb-4">
                    <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
                    <span className="ml-2 text-gray-600">
                      {t("reviewCardsPage.loading")}
                    </span>
                  </div>
                )}
                {error && (
                  <div className="mb-4 p-2 bg-red-600 text-white text-sm rounded-lg">
                    {error}
                  </div>
                )}
                {!loading &&
                  !error &&
                  cards.length === 0 &&
                  testCards.length === 0 && (
                    <div className="text-center text-gray-600">
                      <p>{t("reviewCardsPage.noCardsAvailable")}</p>
                    </div>
                  )}
                {!loading &&
                  !error &&
                  currentCardIndex <
                    (exerciseType === "test"
                      ? testCards.length
                      : cards.length) && (
                    <div className="flex flex-col items-center space-y-4">
                      {exerciseType === "flash" && currentCard && (
                        <motion.div
                          animate={{ rotateY: showTranslation ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className={`bg-white p-6 rounded-lg text-center shadow-md w-full h-70 relative ${
                            answerResult
                              ? answerResult.isCorrect
                                ? "border-2 border-green-500"
                                : "border-2 border-red-500"
                              : ""
                          }`}
                          style={{
                            transformStyle: "preserve-3d",
                            perspective: 1000,
                          }}
                        >
                          <div
                            className="absolute inset-0 backface-hidden flex flex-col items-center justify-center"
                            style={{ backfaceVisibility: "hidden" }}
                          >
                            <h3 className="text-lg font-semibold text-gray-800">
                              {currentCard.translation.text}
                            </h3>
                            {currentCard.example && (
                              <div className="mt-2 w-full">
                                <button
                                  onClick={toggleExample}
                                  className="py-2 px-15 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 hover:text-indigo-800 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-colors duration-200"
                                >
                                  {showExample
                                    ? t("reviewCardsPage.hideExample")
                                    : t("reviewCardsPage.showExample")}
                                </button>
                                <AnimatePresence>
                                  {showExample && (
                                    <motion.p
                                      className="mt-2 text-gray-600"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.25 }}
                                    >
                                      {currentCard.example}
                                    </motion.p>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                            <input
                              type="text"
                              value={cardAnswer}
                              onChange={(e) => setCardAnswer(e.target.value)}
                              placeholder={t("reviewCardsPage.typeTranslation")}
                              disabled={isSubmitting || !!answerResult}
                              className={`mt-4 w-3/4 py-2 px-4 border rounded-lg focus:ring-2 focus:ring-indigo-300 ${
                                answerResult
                                  ? answerResult.isCorrect
                                    ? "border-green-600 bg-green-50"
                                    : "border-red-600 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            />
                            <button
                              onClick={async () => {
                                await handleFlashReview();
                                setShowTranslation(true);
                              }}
                              disabled={
                                isSubmitting ||
                                !cardAnswer.trim() ||
                                !!answerResult
                              }
                              className={`mt-3 w-3/4 py-2 rounded-lg font-semibold ${
                                isSubmitting ||
                                !cardAnswer.trim() ||
                                !!answerResult
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                              } transition-colors duration-200`}
                            >
                              {t("reviewCardsPage.check")}
                            </button>
                          </div>
                          <div
                            className="absolute inset-0 backface-hidden flex flex-col items-center justify-center"
                            style={{
                              backfaceVisibility: "hidden",
                              transform: "rotateY(180deg)",
                            }}
                          >
                            <h3 className="text-lg font-semibold text-gray-800">
                              {currentCard.word.text}
                            </h3>
                            {answerResult && (
                              <p
                                className={`mt-2 text-sm ${
                                  answerResult.isCorrect
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {answerResult.isCorrect
                                  ? t("reviewCardsPage.correct")
                                  : `${t("reviewCardsPage.incorrect")}: ${
                                      answerResult.correctTranslation
                                    }`}
                              </p>
                            )}
                            {!answerResult?.isCorrect && cardAnswer && (
                              <p className="mt-1 text-sm text-red-500">
                                {t("reviewCardsPage.yourAnswer")}: {cardAnswer}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                      {exerciseType === "test" && currentTestCard && (
                        <div className="bg-white p-6 rounded-lg text-center shadow-md w-full">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {currentTestCard.word.text}
                          </h3>
                          {answerResult && (
                            <p
                              className={`mt-2 text-sm ${
                                answerResult.isCorrect
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {answerResult.isCorrect
                                ? t("reviewCardsPage.correct")
                                : `${t("reviewCardsPage.incorrect")}: ${
                                    answerResult.correctTranslation
                                  }`}
                            </p>
                          )}
                          <div className="mt-4 flex flex-col space-y-2">
                            {currentTestCard.options.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => handleTestAnswer(option.text)}
                                disabled={isSubmitting || !!answerResult}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                                  answerResult
                                    ? option.isCorrect
                                      ? "bg-green-600 text-white"
                                      : option.text ===
                                        answerResult.correctTranslation
                                      ? "bg-green-600 text-white"
                                      : answerResult.correctTranslation !==
                                          option.text && !answerResult.isCorrect
                                      ? "bg-red-600 text-white"
                                      : "bg-gray-200 text-gray-800"
                                    : isSubmitting
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                                }`}
                              >
                                {option.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {exerciseType === "dictation" && currentCard && (
                        <div className="bg-white p-6 rounded-lg text-center shadow-md w-full">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {currentCard.word.text}
                          </h3>
                          {answerResult && (
                            <p
                              className={`mt-2 text-sm ${
                                answerResult.isCorrect
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {answerResult.isCorrect
                                ? t("reviewCardsPage.correct")
                                : `${t("reviewCardsPage.incorrect")}: ${
                                    answerResult.correctTranslation
                                  }`}
                            </p>
                          )}
                          <input
                            type="text"
                            value={cardAnswer}
                            onChange={(e) => setCardAnswer(e.target.value)}
                            placeholder={t("reviewCardsPage.typeTranslation")}
                            disabled={isSubmitting || !!answerResult}
                            className={`mt-4 w-full py-2 px-4 border rounded-lg focus:ring-2 focus:ring-indigo-300 ${
                              answerResult
                                ? answerResult.isCorrect
                                  ? "border-green-600 bg-green-50"
                                  : "border-red-600 bg-red-50"
                                : "border-gray-300"
                            }`}
                          />
                          <button
                            onClick={handleDictationSubmit}
                            disabled={
                              isSubmitting ||
                              !cardAnswer.trim() ||
                              !!answerResult
                            }
                            className={`mt-4 w-full py-2 rounded-lg font-semibold ${
                              isSubmitting ||
                              !cardAnswer.trim() ||
                              !!answerResult
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                            } transition-colors duration-200`}
                          >
                            {t("reviewCardsPage.submit")}
                          </button>
                        </div>
                      )}
                      <p className="text-center text-sm text-gray-600">
                        {t("reviewCardsPage.card")} {currentCardIndex + 1}{" "}
                        {t("reviewCardsPage.of")}{" "}
                        {exerciseType === "test"
                          ? testCards.length
                          : cards.length}
                      </p>
                    </div>
                  )}
                {!loading &&
                  !error &&
                  currentCardIndex >=
                    (exerciseType === "test"
                      ? testCards.length
                      : cards.length) &&
                  (cards.length > 0 || testCards.length > 0) && (
                    <div className="flex flex-col items-center space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {t("reviewCardsPage.levelCompleted")}
                      </h3>
                      <p
                        className={`text-xl font-bold ${getScoreColor(
                          totalScore,
                          100
                        )}`}
                      >
                        {t("reviewCardsPage.totalScore")}:{" "}
                        {totalScore.toFixed(1)}%
                      </p>
                      <div className="flex flex-col space-y-2 w-48">
                        <button
                          onClick={handleShareAttempt}
                          disabled={
                            !attemptId || !selectedLanguageId || isSubmitting
                          }
                          className={`py-2 px-4 rounded-lg font-semibold ${
                            !attemptId || isSubmitting
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700"
                          } transition-colors duration-200`}
                        >
                          {t("reviewCardsPage.shareAttemptLink")}
                        </button>
                        {shareLink && (
                          <div className="flex flex-col w-full">
                            <div className="flex items-center border rounded-lg overflow-hidden">
                              <input
                                type="text"
                                value={shareLink}
                                readOnly
                                className="flex-1 py-2 px-4 focus:outline-none"
                                onClick={(e) => e.currentTarget.select()}
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(shareLink);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 1500);
                                }}
                                className="flex items-center justify-center px-3 bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                {copied ? (
                                  <CheckIcon className="text-green-500 w-5 h-5" />
                                ) : (
                                  <ClipboardIcon className="text-gray-600 w-5 h-5" />
                                )}
                              </button>
                            </div>
                            {copied && (
                              <p className="text-sm text-green-500 mt-1 animate-fadeIn">
                                {t("reviewCardsPage.copiedToClipboard")}
                              </p>
                            )}
                          </div>
                        )}
                        <button
                          onClick={closeModal}
                          className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                        >
                          {t("reviewCardsPage.returnToLevels")}
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewCardsPage;
