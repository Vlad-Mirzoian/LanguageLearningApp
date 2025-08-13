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
  reviewCard,
  submitAnswer,
} from "../services/api";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

type ExerciseType = "flash" | "test" | "dictation" | null;

const ReviewCardsPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedLanguageId, setSelectedLanguageId } = useLanguage();
  const [cards, setCards] = useState<Card[]>([]);
  const [testCards, setTestCards] = useState<TestCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
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
  const [dictationAnswer, setDictationAnswer] = useState("");

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
        if (user?.learningLanguagesIds?.length && !selectedLanguageId) {
          setSelectedLanguageId(user.learningLanguagesIds[0]);
        }
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          setError(error.response?.data?.error || "Failed to load filters");
        } else {
          setError("Failed to load filters");
        }
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchFiltersAndProgress();
  }, [user, selectedLanguageId, setSelectedLanguageId]);

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
        setError("Please select a learning language before reviewing.");
        return;
      }
      setLoading(true);
      setError("");
      setTotalScore(0);
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
      setDictationAnswer("");
      setShowCardsModal(true);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.error || "Failed to load cards");
      } else {
        setError("Failed to load cards");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFlashReview = async (quality: number) => {
    if (!cards[currentCardIndex]) return;
    if (selectedLanguageId === null) {
      setError("Please select a learning language before reviewing.");
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const currentProgress = await reviewCard(cards[currentCardIndex]._id, {
        languageId: selectedLanguageId,
        quality,
        attemptId,
      });
      setTotalScore((prev) => prev + (quality / 5) * (100 / cards.length));
      setShowTranslation(false);
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      setProgress((prev) =>
        prev.some((p) => p.categoryId === currentProgress.categoryId)
          ? prev.map((p) =>
              p.categoryId === currentProgress.categoryId ? currentProgress : p
            )
          : [...prev, currentProgress]
      );
      const currentCategory = categories.find(
        (cat) => cat._id === cards[currentCardIndex].categoryId._id
      );
      const nextCategory = currentCategory
        ? categories.find((cat) => cat.order === currentCategory.order + 1)
        : null;
      if (nextIndex >= cards.length && currentCategory) {
        const updatedProgress = await getUserProgress({
          languageId: selectedLanguageId,
        });
        setProgress(updatedProgress);
        if (nextCategory) {
          const nextProgress = updatedProgress.find(
            (p) => p.categoryId === nextCategory._id
          );
          const prevNextProgress = prevProgressData.find(
            (p) => p.categoryId === nextCategory._id
          );
          if (nextProgress?.unlocked && !prevNextProgress?.unlocked) {
            toast(`Level ${nextCategory.order} unlocked!`);
          }
        }
        toast(
          `Level completed! Current attempt score: ${currentProgress.score.toFixed(
            2
          )}%, Max score: ${currentProgress.maxScore.toFixed(2)}%`
        );
      } else {
        toast(
          `Current attempt score: ${currentProgress.score.toFixed(
            2
          )}%, Max score: ${currentProgress.maxScore.toFixed(2)}%`
        );
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.error || "Failed to submit review");
      } else {
        setError("Failed to submit review");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestAnswer = async (selectedAnswer: string) => {
    if (!testCards[currentCardIndex]) return;
    if (selectedLanguageId === null) {
      setError("Please select a learning language before reviewing.");
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const result = await submitAnswer(testCards[currentCardIndex]._id, {
        languageId: selectedLanguageId,
        answer: selectedAnswer,
        attemptId,
      });
      setTotalScore(
        (prev) => prev + (result.quality / 5) * (100 / testCards.length)
      );
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      setProgress((prev) =>
        prev.some((p) => p.categoryId === result.progress.categoryId)
          ? prev.map((p) =>
              p.categoryId === result.progress.categoryId ? result.progress : p
            )
          : [...prev, result.progress]
      );
      toast(result.isCorrect ? "Correct!" : "Incorrect!");
      const currentCategory = categories.find(
        (cat) => cat._id === testCards[currentCardIndex].category._id
      );
      const nextCategory = currentCategory
        ? categories.find((cat) => cat.order === currentCategory.order + 1)
        : null;
      if (nextIndex >= testCards.length && currentCategory) {
        const updatedProgress = await getUserProgress({
          languageId: selectedLanguageId,
        });
        setProgress(updatedProgress);
        if (nextCategory) {
          const nextProgress = updatedProgress.find(
            (p) => p.categoryId === nextCategory._id
          );
          const prevNextProgress = prevProgressData.find(
            (p) => p.categoryId === nextCategory._id
          );
          if (nextProgress?.unlocked && !prevNextProgress?.unlocked) {
            toast(`Level ${nextCategory.order} unlocked!`);
          }
        }
        toast(
          `Level completed! Current attempt score: ${result.progress.score.toFixed(
            2
          )}%, Max score: ${result.progress.maxScore.toFixed(2)}%`
        );
      } else {
        toast(
          `Current attempt score: ${result.progress.score.toFixed(
            2
          )}%, Max score: ${result.progress.maxScore.toFixed(2)}%`
        );
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.error || "Failed to submit answer");
      } else {
        setError("Failed to submit answer");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDictationSubmit = async () => {
    if (!cards[currentCardIndex] || !dictationAnswer.trim()) return;
    if (selectedLanguageId === null) {
      setError("Please select a learning language before reviewing.");
      return;
    }
    setIsSubmitting(true);
    try {
      const prevProgressData = progress;
      const result = await submitAnswer(cards[currentCardIndex]._id, {
        languageId: selectedLanguageId,
        answer: dictationAnswer,
        attemptId,
      });
      setTotalScore(
        (prev) => prev + (result.quality / 5) * (100 / cards.length)
      );
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      setDictationAnswer("");
      setProgress((prev) =>
        prev.some((p) => p.categoryId === result.progress.categoryId)
          ? prev.map((p) =>
              p.categoryId === result.progress.categoryId ? result.progress : p
            )
          : [...prev, result.progress]
      );
      toast(result.isCorrect ? "Correct!" : "Incorrect!");
      const currentCategory = categories.find(
        (cat) => cat._id === cards[currentCardIndex].categoryId._id
      );
      const nextCategory = currentCategory
        ? categories.find((cat) => cat.order === currentCategory.order + 1)
        : null;
      if (nextIndex >= cards.length && currentCategory) {
        const updatedProgress = await getUserProgress({
          languageId: selectedLanguageId,
        });
        setProgress(updatedProgress);
        if (nextCategory) {
          const nextProgress = updatedProgress.find(
            (p) => p.categoryId === nextCategory._id
          );
          const prevNextProgress = prevProgressData.find(
            (p) => p.categoryId === nextCategory._id
          );
          if (nextProgress?.unlocked && !prevNextProgress?.unlocked) {
            toast(`Level ${nextCategory.order} unlocked!`);
          }
        }
        toast(
          `Level completed! Current attempt score: ${result.progress.score.toFixed(
            2
          )}%, Max score: ${result.progress.maxScore.toFixed(2)}%`
        );
      } else {
        toast(
          `Current attempt score: ${result.progress.score.toFixed(
            2
          )}%, Max score: ${result.progress.maxScore.toFixed(2)}%`
        );
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.error || "Failed to submit answer");
      } else {
        setError("Failed to submit answer");
      }
    } finally {
      setIsSubmitting(false);
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
    setDictationAnswer("");
    setTotalScore(0);
    setAttemptId(null);
    setExerciseType(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Course:{" "}
          {languages.find((lang) => lang._id === selectedLanguageId)?.name ||
            "Select a Language"}
        </h2>
        {selectedLanguageId && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Course Progress
            </h3>
            <p className="text-gray-600">Total cards: {languageTotalCards}</p>
            <p className="text-gray-600">
              Total Score: {languageScore.toFixed(1)}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Levels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const catProgress = languageProgress.find(
                (p) => p.categoryId === cat._id
              );
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
                    Level {cat.order}: {cat.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Total Cards: {catProgress?.totalCards || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    Best Score: {(catProgress?.maxScore || 0).toFixed(1)}
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
                      ? "Study Level"
                      : "Locked"}
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
                  Choose Exercise Type
                </DialogTitle>
                <div className="mt-4 flex flex-col space-y-4">
                  <button
                    onClick={() => handleSelectFormat("flash")}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                  >
                    Flashcards (Self-assesment)
                  </button>
                  <button
                    onClick={() => handleSelectFormat("test")}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                  >
                    Multiple Choice Test
                  </button>
                  <button
                    onClick={() => handleSelectFormat("dictation")}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                  >
                    Dictation (Type The Translation)
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
                {loading && (
                  <div className="flex items-center mb-4">
                    <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
                    <span className="ml-2 text-gray-600">Loading...</span>
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
                      <p>No cards available for review</p>
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
                          className="bg-white p-6 rounded-lg text-center shadow-md w-full h-48"
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
                            {currentCard.meaning && (
                              <p className="mt-2 text-gray-600">
                                Meaning: {currentCard.meaning}
                              </p>
                            )}
                            {currentCard.categoryId && (
                              <p className="mt-1 text-gray-400 text-sm">
                                Level: {currentCard.categoryId.name}
                              </p>
                            )}
                            <button
                              onClick={() => setShowTranslation(true)}
                              className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                            >
                              Show Translation
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
                            {currentCard.meaning && (
                              <p className="mt-2 text-gray-600">
                                Meaning: {currentCard.meaning}
                              </p>
                            )}
                            {currentCard.categoryId && (
                              <p className="mt-1 text-gray-400 text-sm">
                                Level: {currentCard.categoryId.name}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                      {exerciseType === "flash" && showTranslation && (
                        <div className="flex flex-wrap justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((quality) => (
                            <button
                              key={quality}
                              onClick={() => handleFlashReview(quality)}
                              disabled={isSubmitting}
                              className={`px-4 py-2 rounded-lg font-semibold ${
                                isSubmitting
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                              } transition-colors duration-200`}
                            >
                              {quality}
                            </button>
                          ))}
                        </div>
                      )}
                      {exerciseType === "test" && currentTestCard && (
                        <div className="bg-white p-6 rounded-lg text-center shadow-md w-full">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {currentTestCard.word.text}
                          </h3>
                          {currentTestCard.category && (
                            <p className="mt-1 text-gray-400 text-sm">
                              Level: {currentTestCard.category.name}
                            </p>
                          )}
                          <div className="mt-4 flex flex-col space-y-2">
                            {currentTestCard.options.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => handleTestAnswer(option.text)}
                                disabled={isSubmitting}
                                className={`px-4 py-2 rounded-lg font-semibold ${
                                  isSubmitting
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                                } transition-colors duration-200`}
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
                          {currentCard.meaning && (
                            <p className="mt-2 text-gray-600">
                              Meaning: {currentCard.meaning}
                            </p>
                          )}
                          {currentCard.categoryId && (
                            <p className="mt-1 text-gray-400 text-sm">
                              Level: {currentCard.categoryId.name}
                            </p>
                          )}
                          <input
                            type="text"
                            value={dictationAnswer}
                            onChange={(e) => setDictationAnswer(e.target.value)}
                            placeholder="Type the translation"
                            className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
                          />
                          <button
                            onClick={handleDictationSubmit}
                            disabled={isSubmitting || !dictationAnswer.trim()}
                            className={`mt-4 w-full py-2 rounded-lg font-semibold ${
                              isSubmitting || !dictationAnswer.trim()
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                            } transition-colors duration-200`}
                          >
                            Submit
                          </button>
                        </div>
                      )}
                      <p className="text-center text-sm text-gray-600">
                        Card {currentCardIndex + 1} of{" "}
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
                        Level Completed!
                      </h3>
                      <p
                        className={`text-xl font-bold ${getScoreColor(
                          totalScore,
                          100
                        )}`}
                      >
                        Total Score: {totalScore.toFixed(1)}%
                      </p>
                      <button
                        onClick={closeModal}
                        className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                      >
                        Return to Levels
                      </button>
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
