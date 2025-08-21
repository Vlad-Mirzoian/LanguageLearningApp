import { useEffect, useState } from "react";
import type {
  Card,
  Category,
  Language,
  TestCard,
  UserProgress,
} from "../types";
import {
  getCategories,
  getLanguages,
  getReviewCards,
  getTestCards,
  getUserProgress,
  shareAttempt,
  submitCard,
} from "../services/api";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState<ExerciseType>(null);
  const [showFormatSelection, setShowFormatSelection] = useState(false);
  const [cardAnswer, setCardAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState<AnswerResult>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchFiltersAndProgress = async () => {
      try {
        setLoading(true);
        const [langData, catData, progressData] = await Promise.all([
          getLanguages(),
          getCategories(),
          getUserProgress(
            selectedLanguageId ? { languageId: selectedLanguageId } : {}
          ),
        ]);
        setLanguages(langData);
        setCategories(catData);
        setProgress(progressData);
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          setError(
            error.response?.data?.error ||
              t("reviewCardsPage.failedToLoadFilters")
          );
        } else {
          setError(t("reviewCardsPage.failedToLoadFilters"));
        }
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchFiltersAndProgress();
  }, [user, selectedLanguageId, setSelectedLanguageId, t]);

  const handleStartLevel = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowFormatSelection(true);
  };

  const handleSelectFormat = (type: ExerciseType) => {
    setExerciseType(type);
    setShowFormatSelection(false);
    loadCards(type);
  };

  const loadCards = async (type: ExerciseType) => {
    try {
      if (!selectedLanguageId) {
        setError(t("reviewCardsPage.selectLearningLanguage"));
        return;
      }
      setLoading(true);
      setError("");
      setTotalScore(0);
      setShareLink(null);
      const filters: { languageId: string; categoryId?: string } = {
        languageId: selectedLanguageId,
        ...(selectedCategory && { categoryId: selectedCategory }),
      };
      let response;
      if (type === "test") {
        response = await getTestCards(filters);
        setTestCards(response.cards);
      } else {
        response = await getReviewCards(filters);
        setCards(response.cards);
      }
      setAttemptId(response.attemptId);
      setCurrentCardIndex(0);
      setShowTranslation(false);
      setCardAnswer("");
      setAnswerResult(null);
      setShowCardsModal(true);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.error || t("reviewCardsPage.failedToLoadCards")
        );
      } else {
        setError(t("reviewCardsPage.failedToLoadCards"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFlashReview = async () => {
    if (!cards[currentCardIndex]) return;
    if (selectedLanguageId === null) {
      setError(t("reviewCardsPage.selectLearningLanguage"));
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const result = await submitCard(cards[currentCardIndex]._id, {
        languageId: selectedLanguageId,
        answer: cardAnswer,
        attemptId,
        type: "flash",
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
          const updatedProgress = await getUserProgress({
            languageId: selectedLanguageId,
          });
          setProgress(updatedProgress);
          const currentCategory = categories.find(
            (cat) => cat._id === cards[currentCardIndex].categoryId._id
          );
          const nextCategory = currentCategory
            ? categories.find((cat) => cat.order === currentCategory.order + 1)
            : null;
          if (nextCategory) {
            const nextProgress = updatedProgress.find(
              (p) => p.categoryId._id === nextCategory._id
            );
            const prevNextProgress = prevProgressData.find(
              (p) => p.categoryId._id === nextCategory._id
            );
            if (nextProgress?.unlocked && !prevNextProgress?.unlocked) {
              toast(
                `${t("reviewCardsPage.level")} ${nextCategory.order} ${t(
                  "reviewCardsPage.unlocked"
                )}`
              );
            }
          }
          const currentProgress = updatedProgress.find(
            (p) => p.categoryId._id === currentCategory?._id
          );
          toast(
            `${t("reviewCardsPage.levelCompleted")} ${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%, ${t(
              "reviewCardsPage.maxScore"
            )}: ${currentProgress?.maxScore.toFixed(2) || "0"}%`
          );
        } else {
          toast(
            `${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%`
          );
        }
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.error ||
            t("reviewCardsPage.failedToSubmitAnswer")
        );
      } else {
        setError(t("reviewCardsPage.failedToSubmitAnswer"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestAnswer = async (selectedAnswer: string) => {
    if (!testCards[currentCardIndex]) return;
    if (selectedLanguageId === null) {
      setError(t("reviewCardsPage.selectLearningLanguage"));
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const result = await submitCard(testCards[currentCardIndex]._id, {
        languageId: selectedLanguageId,
        answer: selectedAnswer,
        attemptId,
        type: "test",
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
          const updatedProgress = await getUserProgress({
            languageId: selectedLanguageId,
          });
          setProgress(updatedProgress);
          const currentCategory = categories.find(
            (cat) => cat._id === testCards[currentCardIndex].category._id
          );
          const nextCategory = currentCategory
            ? categories.find((cat) => cat.order === currentCategory.order + 1)
            : null;
          if (nextCategory) {
            const nextProgress = updatedProgress.find(
              (p) => p.categoryId._id === nextCategory._id
            );
            const prevNextProgress = prevProgressData.find(
              (p) => p.categoryId._id === nextCategory._id
            );
            if (nextProgress?.unlocked && !prevNextProgress?.unlocked) {
              toast(
                `${t("reviewCardsPage.level")} ${nextCategory.order} ${t(
                  "reviewCardsPage.unlocked"
                )}`
              );
            }
          }
          const currentProgress = updatedProgress.find(
            (p) => p.categoryId._id === currentCategory?._id
          );
          toast(
            `${t("reviewCardsPage.levelCompleted")} ${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%, ${t(
              "reviewCardsPage.maxScore"
            )}: ${currentProgress?.maxScore.toFixed(2) || "0"}%`
          );
        } else {
          toast(
            `${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%`
          );
        }
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.error ||
            t("reviewCardsPage.failedToSubmitAnswer")
        );
      } else {
        setError(t("reviewCardsPage.failedToSubmitAnswer"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDictationSubmit = async () => {
    if (!cards[currentCardIndex] || !cardAnswer.trim()) return;
    if (selectedLanguageId === null) {
      setError(t("reviewCardsPage.selectLearningLanguage"));
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const result = await submitCard(cards[currentCardIndex]._id, {
        languageId: selectedLanguageId,
        answer: cardAnswer,
        attemptId,
        type: "dictation",
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
          const updatedProgress = await getUserProgress({
            languageId: selectedLanguageId,
          });
          setProgress(updatedProgress);
          const currentCategory = categories.find(
            (cat) => cat._id === cards[currentCardIndex].categoryId._id
          );
          const nextCategory = currentCategory
            ? categories.find((cat) => cat.order === currentCategory.order + 1)
            : null;
          if (nextCategory) {
            const nextProgress = updatedProgress.find(
              (p) => p.categoryId._id === nextCategory._id
            );
            const prevNextProgress = prevProgressData.find(
              (p) => p.categoryId._id === nextCategory._id
            );
            if (nextProgress?.unlocked && !prevNextProgress?.unlocked) {
              toast(
                `${t("reviewCardsPage.level")} ${nextCategory.order} ${t(
                  "reviewCardsPage.unlocked"
                )}`
              );
            }
          }
          const currentProgress = updatedProgress.find(
            (p) => p.categoryId._id === currentCategory?._id
          );
          toast(
            `${t("reviewCardsPage.levelCompleted")} ${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%, ${t(
              "reviewCardsPage.maxScore"
            )}: ${currentProgress?.maxScore.toFixed(2) || "0"}%`
          );
        } else {
          toast(
            `${t(
              "reviewCardsPage.currentAttemptScore"
            )}: ${result.attempt.score.toFixed(2)}%`
          );
        }
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.error ||
            t("reviewCardsPage.failedToSubmitAnswer")
        );
      } else {
        setError(t("reviewCardsPage.failedToSubmitAnswer"));
      }
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
      const shareUrl = await shareAttempt(attemptId);
      setShareLink(shareUrl);
      toast(t("reviewCardsPage.shareLinkGenerated"));
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.error ||
            t("reviewCardsPage.failedToGenerateShareLink")
        );
      } else {
        setError(t("reviewCardsPage.failedToGenerateShareLink"));
      }
    }
  };

  const closeModal = () => {
    setShowCardsModal(false);
    setShowFormatSelection(false);
    setSelectedCategory("");
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

  const languageProgress = progress.filter(
    (p) => p.languageId === selectedLanguageId
  );
  const languageTotalCards = languageProgress.reduce(
    (sum, p) => sum + p.totalCards,
    0
  );
  const languageScore = languageProgress.reduce(
    (sum, p) => sum + p.maxScore,
    0
  );

  const getScoreColor = (score: number, requiredScore: number) => {
    const percentage = (score / requiredScore) * 100;
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const toggleExample = () => setShowExample((prev) => !prev);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("reviewCardsPage.course")}:{" "}
          {languages.find((lang) => lang._id === selectedLanguageId)?.name ||
            t("reviewCardsPage.selectLanguage")}
        </h2>
        {selectedLanguageId && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t("reviewCardsPage.courseProgress")}
            </h3>
            <p className="text-gray-600">
              {t("reviewCardsPage.totalCards")}: {languageTotalCards}
            </p>
            <p className="text-gray-600">
              {t("reviewCardsPage.totalScore")}: {languageScore.toFixed(1)}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{
                  width: `${
                    languageTotalCards
                      ? (languageScore / (languageTotalCards * 100)) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        )}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {t("reviewCardsPage.levels")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const catProgress = languageProgress.find((p) => {
                return p.categoryId._id === cat._id;
              });
              return (
                <div
                  key={cat._id}
                  className={`p-4 rounded-lg shadow-md ${
                    catProgress?.unlocked || cat.order === 1
                      ? "bg-gray-50"
                      : "bg-gray-200 opacity-50"
                  }`}
                >
                  <h4 className="font-semibold text-gray-800">
                    {t("reviewCardsPage.level")} {cat.order}: {cat.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t("reviewCardsPage.totalCards")}:{" "}
                    {catProgress?.totalCards || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("reviewCardsPage.bestScore")}:{" "}
                    {(catProgress?.maxScore || 0).toFixed(1)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${catProgress?.maxScore || 0}%` }}
                    ></div>
                  </div>
                  <button
                    onClick={() => handleStartLevel(cat._id)}
                    disabled={
                      !(catProgress?.unlocked || cat.order === 1) ||
                      isSubmitting
                    }
                    className={`mt-2 w-full p-2 rounded-lg font-semibold ${
                      !(catProgress?.unlocked || cat.order === 1)
                        ? "bg-gray-400 cursor-not-allowed"
                        : selectedCategory === cat._id
                        ? "bg-indigo-600 text-white"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    } transition-colors duration-200`}
                  >
                    {catProgress?.unlocked || cat.order === 1
                      ? t("reviewCardsPage.studyLevel")
                      : t("reviewCardsPage.locked")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {setShowFormatSelection && (
          <Dialog
            open={showFormatSelection}
            onClose={() => setShowFormatSelection(false)}
          >
            <div className="fixed inset-0 bg-black/30" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                <DialogTitle className="text-lg font-bold text-indigo-700">
                  {t("reviewCardsPage.chooseExerciseType")}
                </DialogTitle>
                <div className="mt-4 flex flex-col space-y-4">
                  <button
                    onClick={() => handleSelectFormat("flash")}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                  >
                    {t("reviewCardsPage.flashcards")}
                  </button>
                  <button
                    onClick={() => handleSelectFormat("test")}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                  >
                    {t("reviewCardsPage.multipleChoiceTest")}
                  </button>
                  <button
                    onClick={() => handleSelectFormat("dictation")}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                  >
                    {t("reviewCardsPage.dictation")}
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        )}

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
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${totalScore}%` }}
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
                              {currentCard.translationId.text}
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
                              {currentCard.wordId.text}
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
                            {currentCard.wordId.text}
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
