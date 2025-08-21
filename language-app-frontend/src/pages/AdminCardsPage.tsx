import { useCallback, useEffect, useState } from "react";
import type { Category, Card, Word } from "../types";
import {
  createCard,
  deleteCard,
  getCards,
  updateCard,
  getCategories,
  getWords,
} from "../services/api";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import FormInput from "../components/ui/FormInput";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

const AdminCardsPage: React.FC = () => {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [formData, setFormData] = useState({
    wordId: "",
    translationId: "",
    categoryId: "",
    example: "",
  });
  const [filters, setFilters] = useState({
    categoryId: "",
    example: "",
    page: 1,
    limit: 20,
  });
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalPages = Math.ceil(totalCards / filters.limit);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cardResponse, wordData, catData] = await Promise.all([
          getCards({
            categoryId: filters.categoryId || undefined,
            example: filters.example || undefined,
            limit: filters.limit,
            skip: (filters.page - 1) * filters.limit,
          }),
          getWords(),
          getCategories(),
        ]);
        setCards(cardResponse.cards);
        setTotalCards(cardResponse.total);
        setWords(wordData.words);
        setCategories(catData);
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          setError(
            error.response?.data?.error || t("adminCardsPage.failedToLoadCards")
          );
        } else {
          setError(t("adminCardsPage.failedToLoadCards"));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, t]);

  const validateField = useCallback(
    (field: keyof typeof formData, value: string): string | null => {
      if (!value.trim()) {
        switch (field) {
          case "wordId":
            return t("adminCardsPage.wordRequired");
          case "translationId":
            return t("adminCardsPage.translationRequired");
          case "categoryId":
            return t("adminCardsPage.categoryRequired");
          default:
            return null;
        }
      }
      return null;
    },
    [t]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    (["wordId", "translationId", "categoryId"] as const).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (["wordId", "translationId", "categoryId"].includes(field)) {
      const error = validateField(field, value);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    }
  };

  const handleFilterChange = (
    field: "categoryId" | "example",
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) {
      return;
    }

    try {
      const newCard = await createCard({
        ...formData,
        example: formData.example || undefined,
      });
      setCards([...cards, newCard]);
      setTotalCards(totalCards + 1);
      setIsAddModalOpen(false);
      setFormData({
        wordId: "",
        translationId: "",
        categoryId: "",
        example: "",
      });
      setErrors({});
      setServerError("");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error || t("adminCardsPage.failedToCreateCard")
        );
      } else {
        setServerError(t("adminCardsPage.failedToCreateCard"));
      }
    }
  };

  const handleEditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentCard || !validateForm()) {
      return;
    }

    try {
      const updateData: Partial<typeof formData> = {};
      if (formData.wordId !== currentCard.wordId._id)
        updateData.wordId = formData.wordId;
      if (formData.translationId !== currentCard.translationId._id)
        updateData.translationId = formData.translationId;
      if (formData.categoryId !== currentCard.categoryId._id)
        updateData.categoryId = formData.categoryId;
      if ((formData.example || "") !== (currentCard.example || ""))
        updateData.example = formData.example || undefined;

      if (Object.keys(updateData).length > 0) {
        const updatedCard = await updateCard(currentCard._id, updateData);
        setCards(
          cards.map((card) =>
            card._id === updatedCard._id ? updatedCard : card
          )
        );
      }
      setIsEditModalOpen(false);
      setCurrentCard(null);
      setFormData({
        wordId: "",
        translationId: "",
        categoryId: "",
        example: "",
      });
      setErrors({});
      setServerError("");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error || t("adminCardsPage.failedToUpdateCard")
        );
      } else {
        setServerError(t("adminCardsPage.failedToUpdateCard"));
      }
    }
  };

  const handleDeleteCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentCard) return;

    try {
      await deleteCard(currentCard._id);
      setCards(cards.filter((card) => card._id !== currentCard._id));
      setTotalCards(totalCards - 1);
      setIsDeleteModalOpen(false);
      setCurrentCard(null);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error || t("adminCardsPage.failedToDeleteCard")
        );
      } else {
        setServerError(t("adminCardsPage.failedToDeleteCard"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          {t("adminCardsPage.adminPanel")}
        </h2>
        <div className="flex flex-col sm:flex-row justify-center items-end gap-8 mt-4 mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminCardsPage.filterByCategory")}
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange("categoryId", e.target.value)}
              className="w-full py-2.5 px-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">{t("adminCardsPage.allCategories")}</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminCardsPage.filterByExample")}
            </label>
            <input
              type="text"
              value={filters.example}
              onChange={(e) => handleFilterChange("example", e.target.value)}
              placeholder={t("adminCardsPage.searchByExamplePlaceholder")}
              className="w-full py-2.5 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <button
            onClick={() => {
              setFormData({
                wordId: "",
                translationId: "",
                categoryId: "",
                example: "",
              });
              setErrors({});
              setServerError("");
              setIsAddModalOpen(true);
            }}
            className="bg-indigo-600 text-white py-2.5 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
          >
            {t("adminCardsPage.addCard")}
          </button>
        </div>
        {loading && (
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">
              {t("adminCardsPage.loadingCards")}
            </span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading && !error && cards.length === 0 && (
          <div className="text-center text-gray-600">
            {t("adminCardsPage.noCardsAvailable")}
          </div>
        )}
        {!loading && !error && cards.length > 0 && (
          <>
            <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="p-4 font-semibold text-indigo-700">
                      {t("adminCardsPage.word")}
                    </th>
                    <th className="p-4 font-semibold text-indigo-700">
                      {t("adminCardsPage.translation")}
                    </th>
                    <th className="p-4 font-semibold text-indigo-700">
                      {t("adminCardsPage.category")}
                    </th>
                    <th className="p-4 font-semibold text-indigo-700">
                      {t("adminCardsPage.example")}
                    </th>
                    <th className="p-4 font-semibold text-indigo-700">
                      {t("adminCardsPage.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card._id} className="border-t hover:bg-gray-50">
                      <td className="p-4 text-gray-800">{card.wordId.text}</td>
                      <td className="p-4 text-gray-800">
                        {card.translationId.text}
                      </td>
                      <td className="p-4 text-gray-800">
                        {card.categoryId.name}
                      </td>
                      <td className="p-4 text-gray-800">{card.example}</td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setCurrentCard(card);
                            setFormData({
                              wordId: card.wordId._id,
                              translationId: card.translationId._id,
                              categoryId: card.categoryId._id,
                              example: card.example ?? "",
                            });
                            setErrors({});
                            setServerError("");
                            setIsEditModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 mr-4 cursor-pointer"
                        >
                          {t("adminCardsPage.edit")}
                        </button>
                        <button
                          onClick={() => {
                            setCurrentCard(card);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          {t("adminCardsPage.delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {t("adminCardsPage.previous")}
              </button>
              <span>
                {t("adminCardsPage.pageInfo", {
                  currentPage: filters.page,
                  totalPages,
                })}
              </span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === totalPages}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {t("adminCardsPage.next")}
              </button>
            </div>
          </>
        )}
      </div>
      <Dialog
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormData({
            wordId: "",
            translationId: "",
            categoryId: "",
            example: "",
          });
          setErrors({});
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminCardsPage.addCardModalTitle")}
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleAddCard} className="space-y-2">
              <div className="mt-2 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t("adminCardsPage.word")}
                  </label>
                  <select
                    value={formData.wordId}
                    onChange={(e) => handleChange("wordId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">{t("adminCardsPage.selectWord")}</option>
                    {words.map((word) => (
                      <option key={word._id} value={word._id}>
                        {word.text}
                      </option>
                    ))}
                  </select>
                  {errors.wordId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.wordId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t("adminCardsPage.translation")}
                  </label>
                  <select
                    value={formData.translationId}
                    onChange={(e) =>
                      handleChange("translationId", e.target.value)
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">
                      {t("adminCardsPage.selectTranslation")}
                    </option>
                    {words.map((word) => (
                      <option key={word._id} value={word._id}>
                        {word.text}
                      </option>
                    ))}
                  </select>
                  {errors.translationId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.translationId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t("adminCardsPage.category")}
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleChange("categoryId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">
                      {t("adminCardsPage.selectCategory")}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.categoryId}
                    </p>
                  )}
                </div>
                <FormInput
                  label={t("adminCardsPage.example")}
                  value={formData.example}
                  onChange={(e) => handleChange("example", e.target.value)}
                  error={errors.example}
                  placeholder={t("adminCardsPage.examplePlaceholder")}
                />
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormData({
                      wordId: "",
                      translationId: "",
                      categoryId: "",
                      example: "",
                    });
                    setErrors({});
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminCardsPage.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminCardsPage.add")}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCurrentCard(null);
          setFormData({
            wordId: "",
            translationId: "",
            categoryId: "",
            example: "",
          });
          setErrors({});
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminCardsPage.editCardModalTitle")}
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleEditCard} className="space-y-2">
              <div className="mt-2 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t("adminCardsPage.word")}
                  </label>
                  <select
                    value={formData.wordId}
                    onChange={(e) => handleChange("wordId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">{t("adminCardsPage.selectWord")}</option>
                    {words.map((word) => (
                      <option key={word._id} value={word._id}>
                        {word.text}
                      </option>
                    ))}
                  </select>
                  {errors.wordId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.wordId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t("adminCardsPage.translation")}
                  </label>
                  <select
                    value={formData.translationId}
                    onChange={(e) =>
                      handleChange("translationId", e.target.value)
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">
                      {t("adminCardsPage.selectTranslation")}
                    </option>
                    {words.map((word) => (
                      <option key={word._id} value={word._id}>
                        {word.text}
                      </option>
                    ))}
                  </select>
                  {errors.translationId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.translationId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t("adminCardsPage.category")}
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleChange("categoryId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">
                      {t("adminCardsPage.selectCategory")}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.categoryId}
                    </p>
                  )}
                </div>
                <FormInput
                  label={t("adminCardsPage.example")}
                  value={formData.example}
                  onChange={(e) => handleChange("example", e.target.value)}
                  error={errors.example}
                  placeholder={t("adminCardsPage.examplePlaceholder")}
                />
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setCurrentCard(null);
                    setFormData({
                      wordId: "",
                      translationId: "",
                      categoryId: "",
                      example: "",
                    });
                    setErrors({});
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminCardsPage.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminCardsPage.save")}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentCard(null);
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminCardsPage.confirmDeletionTitle")}
            </DialogTitle>
            <p className="mt-2 text-gray-600">
              {t("adminCardsPage.confirmDeletionMessage", {
                word: currentCard?.wordId.text,
                translation: currentCard?.translationId.text,
              })}
            </p>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleDeleteCard} className="space-y-2">
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCurrentCard(null);
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminCardsPage.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 cursor-pointer"
                >
                  {t("adminCardsPage.delete")}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminCardsPage;
