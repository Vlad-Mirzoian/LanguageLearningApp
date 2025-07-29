import { useEffect, useState } from "react";
import type { Card, Category, Language } from "../types";
import {
  getCategories,
  getLanguages,
  getReviewCards,
  reviewCard,
} from "../services/api";
import { motion } from "framer-motion";

const ReviewCardsPage: React.FC = () => {
  const [user, setUser] = useState<{
    email: string;
    learningLanguagesIds?: string[];
  } | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [langData, catData] = await Promise.all([
          getLanguages(),
          getCategories(),
        ]);
        setLanguages(langData);
        setCategories(catData);
        if (user?.learningLanguagesIds?.length) {
          setSelectedLanguage(user.learningLanguagesIds[0]);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load filters");
      }
    };
    if (user) fetchFilters();
  }, [user]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        setError("");
        const filters = {
          ...(selectedCategory && { categoryId: selectedCategory }),
          ...(selectedLanguage && { languageId: selectedLanguage }),
        };
        const data = await getReviewCards(filters);
        setCards(data);
        setCurrentCardIndex(0);
        setShowTranslation(false);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load review cards");
      } finally {
        setLoading(false);
      }
    };
    if (selectedLanguage) fetchCards();
  }, [selectedCategory, selectedLanguage]);

  const handleReview = async (quality: number) => {
    if (!cards[currentCardIndex]) return;
    setIsSubmitting(true);
    try {
      await reviewCard(cards[currentCardIndex]._id, {
        languageId: selectedLanguage,
        quality,
      });
      setShowTranslation(false);
      setCurrentCardIndex((prev) => prev + 1);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCard = cards[currentCardIndex];

  console.log(user?.learningLanguagesIds);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Review Your Lessons
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={loading || isSubmitting}
            className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
          >
            {languages
              .filter((lang) => user?.learningLanguagesIds?.includes(lang._id))
              .map((lang) => (
                <option key={lang._id} value={lang._id}>
                  {lang.name}
                </option>
              ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={loading || isSubmitting}
            className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        {loading && (
          <div className="flex items-center justify-center">
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
            <span className="ml-2 text-gray-600">Loading cards...</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading && !error && cards.length === 0 && (
          <div className="text-center text-gray-600">
            <p>No cards available for review</p>
          </div>
        )}
        {!loading && !error && currentCard && (
          <div className="flex flex-col items-center space-y-4">
            <motion.div
              animate={{ rotateY: showTranslation ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 p-6 rounded-lg text-center shadow-md w-full max-w-md h-48"
              style={{ transformStyle: "preserve-3d", perspective: 1000 }}
            >
              <div
                className="absolute inset-0 backface-hidden flex flex-col items-center justify-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <h3 className="text-lg font-semibold text-gray-800">
                  {currentCard.wordId.text}
                </h3>
                {currentCard.wordId.meaning && (
                  <p className="mt-2 text-gray-500">
                    Meaning: {currentCard.wordId.meaning}
                  </p>
                )}
                {currentCard.wordId.categoryId && (
                  <p className="mt-1 text-gray-400 text-sm">
                    Category: {currentCard.wordId.categoryId.name}
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
                  {currentCard.translationId.text}
                </h3>
                {currentCard.translationId.meaning && (
                  <p className="mt-2 text-gray-500">
                    Meaning: {currentCard.translationId.meaning}
                  </p>
                )}
                {currentCard.translationId.categoryId && (
                  <p className="mt-1 text-gray-400 text-sm">
                    Category: {currentCard.translationId.categoryId.name}
                  </p>
                )}
              </div>
            </motion.div>
            {showTranslation && (
              <div className="flex flex-wrap justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => handleReview(quality)}
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
            <p className="text-center text-sm text-gray-600">
              Card {currentCardIndex + 1} of {cards.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCardsPage;
