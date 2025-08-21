import { useCallback, useEffect, useState } from "react";
import type { Language, Word } from "../types";
import {
  checkWordUnique,
  createWord,
  deleteWord,
  getLanguages,
  getWords,
  updateWord,
} from "../services/api";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import FormInput from "../components/ui/FormInput";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

const AdminWordsPage: React.FC = () => {
  const { t } = useTranslation();
  const [words, setWords] = useState<Word[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [formData, setFormData] = useState({
    text: "",
    languageId: "",
  });
  const [filters, setFilters] = useState({
    languageId: "",
    text: "",
    page: 1,
    limit: 20,
  });
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalPages = Math.ceil(totalWords / filters.limit);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [langData, wordData] = await Promise.all([
          getLanguages(),
          getWords({
            languageId: filters.languageId || undefined,
            text: filters.text || undefined,
            limit: filters.limit,
            skip: (filters.page - 1) * filters.limit,
          }),
        ]);
        setWords(wordData.words);
        setTotalWords(wordData.total);
        setLanguages(langData);
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          setError(
            error.response?.data?.error || t("adminWordsPage.failedToLoadWords")
          );
        } else {
          setError(t("adminWordsPage.failedToLoadWords"));
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
          case "text":
            return t("adminWordsPage.textRequired");
          case "languageId":
            return t("adminWordsPage.languageRequired");
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
    (["text", "languageId"] as const).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (["text", "languageId"].includes(field)) {
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

  const handleFilterChange = (field: "languageId" | "text", value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) {
      return;
    }

    try {
      const uniquenessCheck = await checkWordUnique(formData);
      if (!uniquenessCheck.isUnique) {
        setServerError(t("adminWordsPage.wordAlreadyExists"));
        return;
      }
      const newWord = await createWord(formData);
      setWords([...words, newWord]);
      setTotalWords(totalWords + 1);
      setIsAddModalOpen(false);
      setFormData({ text: "", languageId: "" });
      setErrors({});
      setServerError("");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error || t("adminWordsPage.failedToCreateWord")
        );
      } else {
        setServerError(t("adminWordsPage.failedToCreateWord"));
      }
    }
  };

  const handleEditWord = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentWord || !validateForm()) {
      return;
    }

    try {
      const uniquenessCheck = await checkWordUnique(formData);
      if (!uniquenessCheck.isUnique) {
        setServerError(t("adminWordsPage.wordAlreadyExists"));
        return;
      }
      const updateData: Partial<typeof formData> = {};
      if (formData.text !== currentWord.text) updateData.text = formData.text;
      if (formData.languageId !== currentWord.languageId._id)
        updateData.languageId = formData.languageId;

      if (Object.keys(updateData).length > 0) {
        const updatedWord = await updateWord(currentWord._id, updateData);
        setWords(
          words.map((word) =>
            word._id === updatedWord._id ? updatedWord : word
          )
        );
      }
      setIsEditModalOpen(false);
      setCurrentWord(null);
      setFormData({ text: "", languageId: "" });
      setErrors({});
      setServerError("");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error || t("adminWordsPage.failedToUpdateWord")
        );
      } else {
        setServerError(t("adminWordsPage.failedToUpdateWord"));
      }
    }
  };

  const handleDeleteWord = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentWord) return;

    try {
      await deleteWord(currentWord._id);
      setWords(words.filter((word) => word._id !== currentWord._id));
      setTotalWords(totalWords - 1);
      setIsDeleteModalOpen(false);
      setCurrentWord(null);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error || t("adminWordsPage.failedToDeleteWord")
        );
      } else {
        setServerError(t("adminWordsPage.failedToDeleteWord"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          {t("adminWordsPage.adminPanel")}
        </h2>
        <div className="flex flex-col sm:flex-row justify-center items-end gap-8 mt-4 mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminWordsPage.filterByLanguage")}
            </label>
            <select
              value={filters.languageId}
              onChange={(e) => handleFilterChange("languageId", e.target.value)}
              className="w-full py-2.5 px-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">{t("adminWordsPage.allLanguages")}</option>
              {languages.map((lang) => (
                <option key={lang._id} value={lang._id}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminWordsPage.filterByText")}
            </label>
            <input
              type="text"
              value={filters.text}
              onChange={(e) => handleFilterChange("text", e.target.value)}
              placeholder={t("adminWordsPage.searchByText")}
              className="w-full py-2.5 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
            ></input>
          </div>
          <button
            onClick={() => {
              setFormData({ text: "", languageId: "" });
              setErrors({});
              setServerError("");
              setIsAddModalOpen(true);
            }}
            className="bg-indigo-600 text-white py-2.5 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
          >
            {t("adminWordsPage.addWord")}
          </button>
        </div>
        {loading && (
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">
              {t("adminWordsPage.loadingWords")}
            </span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading && !error && words.length === 0 && (
          <div className="text-center text-gray-600">
            {t("adminWordsPage.noWordsAvailable")}
          </div>
        )}
        {!loading && !error && words.length > 0 && (
          <>
            <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="p-4 font-semibold text-indigo-700">
                      {t("adminWordsPage.text")}
                    </th>
                    <th className="p-4 font-semibold text-indigo-700">
                      {t("adminWordsPage.language")}
                    </th>
                    <th className="p-4 font-semibold text-indigo-700">
                      {t("adminWordsPage.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {words.map((word) => (
                    <tr key={word._id} className="border-t hover:bg-gray-50">
                      <td className="p-4 text-gray-800">{word.text}</td>
                      <td className="p-4 text-gray-800">
                        {word.languageId.name}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setCurrentWord(word);
                            setFormData({
                              text: word.text,
                              languageId: word.languageId._id,
                            });
                            setErrors({});
                            setServerError("");
                            setIsEditModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 mr-4 cursor-pointer"
                        >
                          {t("adminWordsPage.edit")}
                        </button>
                        <button
                          onClick={() => {
                            setCurrentWord(word);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          {t("adminWordsPage.delete")}
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
                {t("adminWordsPage.previous")}
              </button>
              <span>
                {t("adminWordsPage.pageOf", {
                  current: filters.page,
                  total: totalPages,
                })}
              </span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === totalPages}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {t("adminWordsPage.next")}
              </button>
            </div>
          </>
        )}
      </div>
      <Dialog
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormData({ text: "", languageId: "" });
          setErrors({});
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminWordsPage.addWordModalTitle")}
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleAddWord} className="space-y-2">
              <div className="mt-2 space-y-4">
                <FormInput
                  label={t("adminWordsPage.text")}
                  value={formData.text}
                  onChange={(e) => handleChange("text", e.target.value)}
                  error={errors.text}
                  placeholder={t("adminWordsPage.textPlaceholder")}
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t("adminWordsPage.language")}
                  </label>
                  <select
                    value={formData.languageId}
                    onChange={(e) => handleChange("languageId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">
                      {t("adminWordsPage.selectLanguage")}
                    </option>
                    {languages.map((lang) => (
                      <option key={lang._id} value={lang._id}>
                        {lang.name} ({lang.code})
                      </option>
                    ))}
                  </select>
                  {errors.languageId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.languageId}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormData({ text: "", languageId: "" });
                    setErrors({});
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminWordsPage.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminWordsPage.add")}
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
          setCurrentWord(null);
          setFormData({ text: "", languageId: "" });
          setErrors({});
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminWordsPage.editWordModalTitle")}
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleEditWord} className="space-y-2">
              <div className="mt-2 space-y-4">
                <FormInput
                  label={t("adminWordsPage.text")}
                  value={formData.text}
                  onChange={(e) => handleChange("text", e.target.value)}
                  error={errors.text}
                  placeholder={t("adminWordsPage.textPlaceholder")}
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t("adminWordsPage.language")}
                  </label>
                  <select
                    value={formData.languageId}
                    onChange={(e) => handleChange("languageId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">
                      {t("adminWordsPage.selectLanguage")}
                    </option>
                    {languages.map((lang) => (
                      <option key={lang._id} value={lang._id}>
                        {lang.name} ({lang.code})
                      </option>
                    ))}
                  </select>
                  {errors.languageId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.languageId}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setCurrentWord(null);
                    setFormData({ text: "", languageId: "" });
                    setErrors({});
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminWordsPage.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminWordsPage.save")}
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
          setCurrentWord(null);
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminWordsPage.confirmDeletionTitle")}
            </DialogTitle>
            <p className="mt-2 text-gray-600">
              {t("adminWordsPage.confirmDeletionMessage", {
                text: currentWord?.text,
              })}
            </p>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleDeleteWord} className="space-y-2">
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCurrentWord(null);
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminWordsPage.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 cursor-pointer"
                >
                  {t("adminWordsPage.delete")}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminWordsPage;
