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

const AdminCardsPage: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
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
    meaning: "",
  });
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filterCategoryId, setFilterCategoryId] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cardData, wordData, catData] = await Promise.all([
          getCards(filterCategoryId ? { categoryId: filterCategoryId } : {}),
          getWords(),
          getCategories(),
        ]);
        setCards(cardData);
        setWords(wordData);
        setCategories(catData);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filterCategoryId]);

  const validateField = useCallback(
    (field: keyof typeof formData, value: string): string | null => {
      if (!value.trim()) {
        switch (field) {
          case "wordId":
            return "Original word is required";
          case "translationId":
            return "Translation word is required";
          case "categoryId":
            return "Category is required";
          default:
            return null;
        }
      }
      return null;
    },
    []
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

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) {
      return;
    }

    try {
      const newCard = await createCard({
        ...formData,
        meaning: formData.meaning || undefined,
      });
      setCards([...cards, newCard]);
      setIsAddModalOpen(false);
      setFormData({
        wordId: "",
        translationId: "",
        categoryId: "",
        meaning: "",
      });
      setErrors({});
      setServerError("");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to create Card";
      const details = error.response?.data?.details
        ? error.response.data.details.map((err: any) => err.message).join(", ")
        : "";
      setServerError(details ? `${errorMessage}: ${details}` : errorMessage);
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
      if ((formData.meaning || "") !== (currentCard.meaning || ""))
        updateData.meaning = formData.meaning || undefined;

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
        meaning: "",
      });
      setErrors({});
      setServerError("");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to update Card";
      const details = error.response?.data?.details
        ? error.response.data.details.map((err: any) => err.message).join(", ")
        : "";
      setServerError(details ? `${errorMessage}: ${details}` : errorMessage);
    }
  };

  const handleDeleteCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentCard) return;

    try {
      await deleteCard(currentCard._id);
      setCards(cards.filter((Card) => Card._id !== currentCard._id));
      setIsDeleteModalOpen(false);
      setCurrentCard(null);
    } catch (error: any) {
      setServerError(error.response?.data?.error || "Failed to delete Card");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          Admin Panel
        </h2>
        <div className="flex flex-col sm:flex-row justify-center items-end gap-8 mt-4 mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Category
            </label>
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="w-full py-2.5 px-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setFormData({
                wordId: "",
                translationId: "",
                categoryId: "",
                meaning: "",
              });
              setErrors({});
              setServerError("");
              setIsAddModalOpen(true);
            }}
            className="bg-indigo-600 text-white py-2.5 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
          >
            Add Card
          </button>
        </div>
        {loading && (
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading cards...</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading && !error && cards.length === 0 && (
          <div className="text-center text-gray-600">No cards available.</div>
        )}
        {!loading && !error && cards.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="p-4 font-semibold text-indigo-700">Word</th>
                  <th className="p-4 font-semibold text-indigo-700">
                    Translation
                  </th>
                  <th className="p-4 font-semibold text-indigo-700">
                    Category
                  </th>
                  <th className="p-4 font-semibold text-indigo-700">Meaning</th>
                  <th className="p-4 font-semibold text-indigo-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((Card) => (
                  <tr key={Card._id} className="border-t hover:bg-gray-50">
                    <td className="p-4 text-gray-800">{Card.wordId.text}</td>
                    <td className="p-4 text-gray-800">
                      {Card.translationId.text}
                    </td>
                    <td className="p-4 text-gray-800">
                      {Card.categoryId.name}
                    </td>
                    <td className="p-4 text-gray-800">{Card.meaning}</td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setCurrentCard(Card);
                          setFormData({
                            wordId: Card.wordId._id,
                            translationId: Card.translationId._id,
                            categoryId: Card.categoryId._id,
                            meaning: Card.meaning ?? "",
                          });
                          setErrors({});
                          setServerError("");
                          setIsEditModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 mr-4 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setCurrentCard(Card);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            meaning: "",
          });
          setErrors({});
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              Add Card
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
                    Word
                  </label>
                  <select
                    value={formData.wordId}
                    onChange={(e) => handleChange("wordId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">Select Word</option>
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
                    Translation
                  </label>
                  <select
                    value={formData.translationId}
                    onChange={(e) =>
                      handleChange("translationId", e.target.value)
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">Select Translation</option>
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
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleChange("categoryId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">Select Category</option>
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
                  label="Meaning"
                  value={formData.meaning}
                  onChange={(e) => handleChange("meaning", e.target.value)}
                  error={errors.meaning}
                  placeholder="e.g., A greeting"
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
                      meaning: "",
                    });
                    setErrors({});
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add
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
            meaning: "",
          });
          setErrors({});
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              Edit Card
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
                    Word
                  </label>
                  <select
                    value={formData.wordId}
                    onChange={(e) => handleChange("wordId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">Select Word</option>
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
                    Translation
                  </label>
                  <select
                    value={formData.translationId}
                    onChange={(e) =>
                      handleChange("translationId", e.target.value)
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">Select Translation</option>
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
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleChange("categoryId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">Select Category</option>
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
                  label="Meaning"
                  value={formData.meaning}
                  onChange={(e) => handleChange("meaning", e.target.value)}
                  error={errors.meaning}
                  placeholder="e.g., A greeting"
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
                      meaning: "",
                    });
                    setErrors({});
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Save
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
              Confirm Deletion
            </DialogTitle>
            <p className="mt-2 text-gray-600">
              Are you sure you want to delete the Card "
              {currentCard?.wordId.text} | {currentCard?.translationId.text}"?
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 cursor-pointer"
                >
                  Delete
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
