import { useEffect, useState } from "react";
import type {
  ApiError,
  Module,
  Language,
  ModuleProgress,
  LevelProgress,
  ReviewCard,
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
import { v4 as uuidv4 } from "uuid";
import { CheckIcon } from "@heroicons/react/24/solid";
import { ClipboardIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import Confetti from "react-confetti";

type ExerciseType = "flash" | "test" | "dictation" | null;
type AnswerResult = { isCorrect?: boolean; correctTranslation?: string } | null;

const ReviewCardsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedLanguageId, setSelectedLanguageId } = useLanguage();
  const [cards, setCards] = useState<ReviewCard[]>([]);
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
        const [modData, progressData, cardsData] = await Promise.all([
          ModuleAPI.getModules({ languageId: selectedLanguageId }),
          LanguageProgressAPI.getLanguageProgress({
            languageId: selectedLanguageId,
          }),
          CardAPI.getReviewCards({ languageId: selectedLanguageId }),
        ]);
        setModules(modData.modules);
        setProgress(progressData);
        setCards(cardsData);
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
    setCurrentCardIndex(0);
    setShowTranslation(false);
    setShowExample(false);
    setCardAnswer("");
    setAnswerResult(null);
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
    const clientAttempt = uuidv4();
    setAttemptId(clientAttempt);
    setSelectedLevel(levelId);
    setExerciseType(taskType);
    setCurrentCardIndex(0);
    setShowTranslation(false);
    setCardAnswer("");
    setAnswerResult(null);
    setShowCardsModal(true);
    setError("");
    setTotalScore(0);
    setShareLink(null);
  };

  const cardsForSelectedModule = selectedModule
    ? cards.filter((card) => card.module.id === selectedModule)
    : cards;
  const currentCard = cardsForSelectedModule[currentCardIndex];

  const handleFlashReview = async () => {
    if (!cardsForSelectedModule[currentCardIndex]) return;
    if (selectedLanguageId === null || !selectedLevel) {
      setError(t("reviewCardsPage.selectLearningLanguage"));
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const result = await CardAPI.submitCard(
        cardsForSelectedModule[currentCardIndex].id,
        {
          languageId: selectedLanguageId,
          answer: cardAnswer,
          attemptId,
          type: "flash",
          levelId: selectedLevel,
        }
      );
      setAnswerResult({
        isCorrect: result.isCorrect,
        correctTranslation: result.correctTranslation,
      });
      setTotalScore(
        (prev) =>
          prev +
          ((result.quality as number) / 5) *
            (100 / cardsForSelectedModule.length)
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
        if (nextIndex >= cardsForSelectedModule.length) {
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
    if (!cardsForSelectedModule[currentCardIndex]) return;
    if (selectedLanguageId === null || !selectedLevel) {
      setError(t("reviewCardsPage.selectLearningLanguage"));
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const result = await CardAPI.submitCard(
        cardsForSelectedModule[currentCardIndex].id,
        {
          languageId: selectedLanguageId,
          answer: selectedAnswer,
          attemptId,
          type: "test",
          levelId: selectedLevel,
        }
      );
      setAnswerResult({
        isCorrect: result.isCorrect,
        correctTranslation: result.correctTranslation,
      });
      setTotalScore(
        (prev) =>
          prev +
          ((result.quality as number) / 5) *
            (100 / cardsForSelectedModule.length)
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
        if (nextIndex >= cardsForSelectedModule.length) {
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
    if (!cardsForSelectedModule[currentCardIndex] || !cardAnswer.trim()) return;
    if (selectedLanguageId === null || !selectedLevel) {
      setError(t("reviewCardsPage.selectLearningLanguage"));
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const result = await CardAPI.submitCard(
        cardsForSelectedModule[currentCardIndex].id,
        {
          languageId: selectedLanguageId,
          answer: cardAnswer,
          attemptId,
          type: "dictation",
          levelId: selectedLevel,
        }
      );
      setAnswerResult({
        isCorrect: result.isCorrect,
        correctTranslation: result.correctTranslation,
      });
      setTotalScore(
        (prev) =>
          prev +
          ((result.quality as number) / 5) *
            (100 / cardsForSelectedModule.length)
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
        if (nextIndex >= cardsForSelectedModule.length) {
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
    setSelectedLevel("");
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

  const getTaskIcon = (taskType: string, unlocked: boolean) => {
    const baseClass = unlocked
      ? "text-accent w-5 h-5"
      : "text-gray-400 w-5 h-5";

    switch (taskType) {
      case "flash":
        return <ArrowUpIcon className={baseClass} />;
      case "test":
        return <CheckCircleIcon className={baseClass} />;
      case "dictation":
        return <PencilIcon className={baseClass} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6">
      <div className="w-full max-w-4xl">
        <h2 className="text-4xl font-poppins font-bold text-center text-primary mb-8 tracking-tight">
          {t("reviewCardsPage.course")}:{" "}
          {languages.find((lang) => lang.id === selectedLanguageId)?.name ||
            t("reviewCardsPage.selectLanguage")}
        </h2>
        {selectedLanguageId && (
          <div className="mb-8 bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-xl font-poppins font-semibold text-primary mb-3 tracking-tight">
              {t("reviewCardsPage.courseProgress")}
            </h3>
            <div className="space-y-2">
              <p className="text-base font-poppins text-primary">
                {t("reviewCardsPage.totalScore")}:{" "}
                <span className="font-semibold text-secondary">
                  {languageTotalPoints.toFixed(2)}
                </span>
              </p>
              <p className="text-base font-poppins text-primary">
                {t("reviewCardsPage.completedModules")}:{" "}
                <span className="font-semibold">
                  {Math.max(
                    languageProgress.filter((p) => p.unlocked).length - 1,
                    0
                  )}{" "}
                  / {languageModules.length}
                </span>
              </p>
              <div className="w-full bg-gray-100 rounded-full h-4 mt-2 overflow-hidden shadow-sm">
                <motion.div
                  className="bg-gradient-primary h-4 rounded-full shadow-sm"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      languageProgress.length > 1
                        ? ((languageProgress.filter((p) => p.unlocked).length -
                            1) /
                            languageModules.length) *
                          100
                        : 0
                    }%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                ></motion.div>
              </div>
            </div>
          </div>
        )}
        <div className="mb-8">
          <h3 className="text-xl font-poppins font-semibold text-primary mb-4 tracking-tight">
            📚 {t("reviewCardsPage.modules")}
          </h3>
          {loading && (
            <div className="flex items-center mb-4 animate-fade-in">
              <ArrowPathIcon className="h-5 w-5 text-primary animate-spin" />
              <span className="ml-2 text-primary font-poppins text-sm">
                {t("reviewCardsPage.loading")}
              </span>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-poppins rounded-lg text-center animate-fade-in">
              {error}
            </div>
          )}
          {!loading && !error && modules.length === 0 && (
            <div className="text-center text-primary font-poppins text-sm">
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
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
                    }}
                    transition={{ duration: 0.3 }}
                    className={`relative p-6 rounded-2xl shadow-md bg-white/95 backdrop-blur-sm border border-gray-100 ${
                      isUnlocked ? "hover:shadow-lg" : "opacity-70"
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-2xl">📖</span>
                      <h4 className="text-xl font-poppins font-semibold text-primary tracking-tight">
                        {mod.name}
                      </h4>
                      {isUnlocked ? (
                        <LockOpenIcon className="w-5 h-5 text-accent" />
                      ) : (
                        <LockClosedIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm font-poppins text-primary mb-2 tracking-tight">
                      {t("reviewCardsPage.completedLevels")}:{" "}
                      <span className="font-semibold">
                        {modProgress?.completedLevels || 0} /{" "}
                        {modProgress?.totalLevels || 0}
                      </span>
                    </p>
                    <p className="text-sm font-poppins text-primary mb-3 tracking-tight">
                      {t("reviewCardsPage.totalScore")}:{" "}
                      <span
                        className={`font-semibold ${getScoreColor(
                          modProgress?.totalScore || 0,
                          mod.requiredScore
                        )}`}
                      >
                        {modProgress?.totalScore.toFixed(2) || 0}
                      </span>
                    </p>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-4">
                      <motion.div
                        className="bg-gradient-primary h-3 rounded-full shadow-sm"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            modProgress?.totalScore
                              ? Math.min(modProgress.totalScore, 100)
                              : 0
                          }%`,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStartModule(mod.id)}
                      disabled={!isUnlocked}
                      className={`w-full py-2 rounded-lg font-poppins font-semibold bg-gradient-primary text-white hover:bg-gradient-primary-hover transition-all duration-200 ${
                        isUnlocked ? "" : "opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {isUnlocked
                        ? t("reviewCardsPage.selectModule")
                        : t("reviewCardsPage.locked")}
                    </motion.button>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={false}
                          animate={{
                            height: isSelected ? "auto" : 0,
                            opacity: isSelected ? 1 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden mt-4"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">📚</span>
                            <h5 className="text-sm font-poppins font-semibold text-primary mb-2 tracking-tight">
                              {t("reviewCardsPage.levels")}
                            </h5>
                          </div>
                          <div className="space-y-3 sm:p-6">
                            {moduleLevels.map((lvl) => (
                              <motion.div
                                key={lvl.level.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                                className={`p-4 rounded-lg shadow-sm transition-all duration-200 ${
                                  lvl.unlocked
                                    ? "bg-white/95 backdrop-blur-sm hover:bg-primary-opacity-10"
                                    : "bg-gray-100 opacity-70"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    {getTaskIcon(
                                      lvl.level.tasks as string,
                                      lvl.unlocked
                                    )}
                                    <p className="text-sm font-poppins font-medium text-primary">
                                      {t("reviewCardsPage.level")}{" "}
                                      {lvl.level.order}
                                    </p>
                                  </div>
                                  {lvl.unlocked ? (
                                    <LockOpenIcon className="w-4 h-4 text-accent" />
                                  ) : (
                                    <LockClosedIcon className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <p className="text-xs font-poppins text-primary mt-1">
                                  {t("reviewCardsPage.taskType")}:{" "}
                                  <span className="capitalize">
                                    {lvl.level.tasks}
                                  </span>
                                </p>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleStartLevel(lvl.level.id)}
                                  disabled={!lvl.unlocked}
                                  className={`mt-2 w-full py-1.5 rounded-lg text-sm font-poppins font-semibold transition-all duration-200 ${
                                    lvl.unlocked
                                      ? "bg-primary-opacity-10 text-primary hover:bg-primary-opacity-20"
                                      : "bg-gray-100 text-dark cursor-not-allowed"
                                  }`}
                                >
                                  {lvl.unlocked
                                    ? t("reviewCardsPage.studyLevel")
                                    : t("reviewCardsPage.locked")}
                                </motion.button>
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
            <div
              className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-40"
              onClick={closeModal}
            >
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
                className="bg-white/90 backdrop-blur-md pt-10 pb-5 px-10 rounded-2xl shadow-xl w-full max-w-lg relative border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeModal}
                  className="absolute top-2 right-2 text-primary hover:text-accent"
                >
                  <XMarkIcon className="h-6 w-6" />
                </motion.button>
                <div className="mb-4">
                  <p className="text-sm font-poppins text-primary">
                    {t("reviewCardsPage.attemptProgress")}:{" "}
                    <span className="font-semibold text-secondary">
                      {totalScore.toFixed(1)}%
                    </span>
                  </p>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-sm">
                    <motion.div
                      className="bg-gradient-primary h-4 rounded-full shadow-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(totalScore, 100)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    ></motion.div>
                  </div>
                </div>
                {loading && (
                  <div className="flex items-center mb-4 animate-fade-in">
                    <ArrowPathIcon className="h-5 w-5 text-primary animate-spin" />
                    <span className="ml-2 text-primary font-poppins text-sm">
                      {t("reviewCardsPage.loading")}
                    </span>
                  </div>
                )}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-poppins rounded-lg text-center animate-fade-in">
                    {error}
                  </div>
                )}
                {!loading && !error && cardsForSelectedModule.length === 0 && (
                  <div className="text-center text-primary font-poppins text-sm">
                    {t("reviewCardsPage.noCardsAvailable")}
                  </div>
                )}
                {!loading &&
                  !error &&
                  currentCardIndex <
                    (exerciseType === "test"
                      ? cardsForSelectedModule.length
                      : cardsForSelectedModule.length) && (
                    <div className="flex flex-col items-center space-y-4">
                      {exerciseType === "flash" && currentCard && (
                        <motion.div
                          animate={{ rotateY: showTranslation ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className={`bg-white/95 p-6 rounded-2xl text-center shadow-md w-full h-70 relative border ${
                            answerResult
                              ? answerResult.isCorrect
                                ? "border-2 border-secondary"
                                : "border-2 border-red-400"
                              : "border-gray-100"
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
                            <h3 className="text-lg font-poppins font-semibold text-primary">
                              {currentCard.original.text}
                            </h3>
                            {currentCard.example && (
                              <div className="mt-2 w-full">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={toggleExample}
                                  className="py-2 px-4 text-sm font-poppins font-medium text-primary bg-primary-opacity-10 rounded-lg hover:bg-primary-opacity-20 focus:ring-2 focus-ring-primary transition-all duration-200"
                                >
                                  {showExample
                                    ? t("reviewCardsPage.hideExample")
                                    : t("reviewCardsPage.showExample")}
                                </motion.button>
                                <AnimatePresence>
                                  {showExample && (
                                    <motion.p
                                      className="mt-2 text-primary font-poppins text-sm"
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
                              className={`mt-4 w-3/4 py-2 px-4 border rounded-lg focus:ring-2 focus-ring-primary ${
                                answerResult
                                  ? answerResult.isCorrect
                                    ? "border-secondary bg-secondary/10"
                                    : "border-red-400 bg-red-50"
                                  : "border-gray-100"
                              }`}
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                await handleFlashReview();
                                setShowTranslation(true);
                              }}
                              disabled={
                                isSubmitting ||
                                !cardAnswer.trim() ||
                                !!answerResult
                              }
                              className={`mt-3 w-3/4 py-2 rounded-lg font-poppins font-semibold bg-gradient-primary text-white hover:bg-gradient-primary-hover transition-all duration-200 ${
                                isSubmitting ||
                                !cardAnswer.trim() ||
                                !!answerResult
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {t("reviewCardsPage.check")}
                            </motion.button>
                          </div>
                          <div
                            className="absolute inset-0 backface-hidden flex flex-col items-center justify-center"
                            style={{
                              backfaceVisibility: "hidden",
                              transform: "rotateY(180deg)",
                            }}
                          >
                            <h3 className="text-lg font-poppins font-semibold text-primary">
                              {currentCard.translation.text}
                            </h3>
                            {answerResult && (
                              <p
                                className={`mt-2 text-sm font-poppins ${
                                  answerResult.isCorrect
                                    ? "text-secondary"
                                    : "text-red-400"
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
                              <p className="mt-1 text-sm text-red-400 font-poppins">
                                {t("reviewCardsPage.yourAnswer")}: {cardAnswer}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                      {exerciseType === "test" && currentCard && (
                        <div className="bg-white/95 p-6 rounded-2xl text-center shadow-md w-full border border-gray-100">
                          <h3 className="text-lg font-poppins font-semibold text-primary">
                            {currentCard.translation.text}
                          </h3>
                          {answerResult && (
                            <p
                              className={`mt-2 text-sm font-poppins ${
                                answerResult.isCorrect
                                  ? "text-secondary"
                                  : "text-red-400"
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
                            {currentCard.options.map((option, index) => (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                key={index}
                                onClick={() => handleTestAnswer(option.text)}
                                disabled={isSubmitting || !!answerResult}
                                className={`px-4 py-2 rounded-lg font-poppins font-semibold transition-all duration-200 ${
                                  answerResult
                                    ? option.isCorrect
                                      ? "bg-secondary text-white"
                                      : option.text ===
                                        answerResult.correctTranslation
                                      ? "bg-secondary text-white"
                                      : answerResult.correctTranslation !==
                                          option.text && !answerResult.isCorrect
                                      ? "bg-red-400 text-white"
                                      : "bg-gray-100 text-dark"
                                    : isSubmitting
                                    ? "bg-gray-100 cursor-not-allowed"
                                    : "bg-gradient-primary text-white hover:bg-gradient-primary-hover"
                                }`}
                              >
                                {option.text}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                      {exerciseType === "dictation" && currentCard && (
                        <div className="bg-white/95 p-6 rounded-2xl text-center shadow-md w-full border border-gray-100">
                          <h3 className="text-lg font-poppins font-semibold text-primary">
                            {currentCard.translation.text}
                          </h3>
                          {answerResult && (
                            <p
                              className={`mt-2 text-sm font-poppins ${
                                answerResult.isCorrect
                                  ? "text-secondary"
                                  : "text-red-400"
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
                            className={`mt-4 w-full py-2 px-4 border rounded-lg focus:ring-2 focus-ring-primary ${
                              answerResult
                                ? answerResult.isCorrect
                                  ? "border-secondary bg-secondary/10"
                                  : "border-red-400 bg-red-50"
                                : "border-gray-100"
                            }`}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDictationSubmit}
                            disabled={
                              isSubmitting ||
                              !cardAnswer.trim() ||
                              !!answerResult
                            }
                            className={`mt-4 w-full py-2 rounded-lg font-poppins font-semibold bg-gradient-primary text-white hover:bg-gradient-primary-hover transition-all duration-200 ${
                              isSubmitting ||
                              !cardAnswer.trim() ||
                              !!answerResult
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {t("reviewCardsPage.submit")}
                          </motion.button>
                        </div>
                      )}
                      <p className="text-center text-sm font-poppins text-primary">
                        {t("reviewCardsPage.card")} {currentCardIndex + 1}{" "}
                        {t("reviewCardsPage.of")}{" "}
                        {cardsForSelectedModule.length}
                      </p>
                    </div>
                  )}
                {!loading &&
                  !error &&
                  currentCardIndex >=
                    (exerciseType === "test"
                      ? cardsForSelectedModule.length
                      : cardsForSelectedModule.length) &&
                  (cardsForSelectedModule.length > 0 ||
                    cardsForSelectedModule.length > 0) && (
                    <div className="flex flex-col items-center space-y-4">
                      <Confetti
                        width={window.innerWidth}
                        height={window.innerHeight}
                        recycle={false}
                        numberOfPieces={100}
                      />
                      <h3 className="text-xl font-poppins font-semibold text-primary">
                        🎉 {t("reviewCardsPage.levelCompleted")}
                      </h3>
                      <p className="text-2xl font-poppins font-bold text-secondary">
                        {t("reviewCardsPage.totalScore")}:{" "}
                        {totalScore.toFixed(1)}%
                      </p>
                      <div className="flex flex-col space-y-2 w-48">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleShareAttempt}
                          disabled={
                            !attemptId || !selectedLanguageId || isSubmitting
                          }
                          className={`py-2 px-4 rounded-lg font-poppins font-semibold bg-gradient-primary text-white hover:bg-gradient-primary-hover transition-all duration-200 ${
                            !attemptId || isSubmitting
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {t("reviewCardsPage.shareAttemptLink")}
                        </motion.button>
                        {shareLink && (
                          <div className="flex flex-col w-full">
                            <div className="flex items-center justify-center border rounded-lg border-gray-100">
                              <input
                                type="text"
                                value={shareLink}
                                readOnly
                                className="flex-1 py-2 px-1 ml-15 focus:outline-none bg-white/95"
                                onClick={(e) => e.currentTarget.select()}
                              />
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  navigator.clipboard.writeText(shareLink);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 1500);
                                }}
                                className="flex items-center justify-center px-5 ml-2.5 transition-all duration-200 bg-primary-opacity-10 hover:bg-primary-opacity-20"
                              >
                                {copied ? (
                                  <CheckIcon className="text-secondary w-5 h-10" />
                                ) : (
                                  <ClipboardIcon className="text-primary w-5 h-10" />
                                )}
                              </motion.button>
                            </div>
                            {copied && (
                              <p className="text-sm text-secondary mt-1 animate-fade-in">
                                {t("reviewCardsPage.copiedToClipboard")}
                              </p>
                            )}
                          </div>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStartLevel(selectedLevel)}
                          className="bg-gradient-primary text-white py-2 px-4 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200"
                        >
                          {t("reviewCardsPage.retryLevel")}
                        </motion.button>
                      </div>
                    </div>
                  )}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewCardsPage;
