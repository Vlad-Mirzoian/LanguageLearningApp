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

const AdminWordsPage: React.FC = () => {
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
          setError(error.response?.data?.error || "Failed to load data");
        } else {
          setError("Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const validateField = useCallback(
    (field: keyof typeof formData, value: string): string | null => {
      if (!value.trim()) {
        switch (field) {
          case "text":
            return "Text is required";
          case "languageId":
            return "Language is required";
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
        setServerError("Word already exists for this language");
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
        setServerError(error.response?.data?.error || "Failed to create Word");
      } else {
        setServerError("Something went wrong");
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
        setServerError("Word already exists for this language");
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
        setServerError(error.response?.data?.error || "Failed to update Word");
      } else {
        setServerError("Something went wrong");
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
        setServerError(error.response?.data?.error || "Failed to create Card");
      } else {
        setServerError("Something went wrong");
      }
    }
  };

  console.log(totalWords);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          Admin Panel
        </h2>
        <div className="flex flex-col sm:flex-row justify-center items-end gap-8 mt-4 mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Language
            </label>
            <select
              value={filters.languageId}
              onChange={(e) => handleFilterChange("languageId", e.target.value)}
              className="w-full py-2.5 px-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang._id} value={lang._id}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Text
            </label>
            <input
              type="text"
              value={filters.text}
              onChange={(e) => handleFilterChange("text", e.target.value)}
              placeholder="Search by text..."
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
            Add Word
          </button>
        </div>
        {loading && (
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading words...</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading && !error && words.length === 0 && (
          <div className="text-center text-gray-600">No words available.</div>
        )}
        {!loading && !error && words.length > 0 && (
          <>
            <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="p-4 font-semibold text-indigo-700">Text</th>
                    <th className="p-4 font-semibold text-indigo-700">
                      Language
                    </th>
                    <th className="p-4 font-semibold text-indigo-700">
                      Actions
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
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setCurrentWord(word);
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
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span>
                Page {filters.page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === totalPages}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next
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
              Add Word
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleAddWord} className="space-y-2">
              <div className="mt-2 space-y-4">
                <FormInput
                  label="Text"
                  value={formData.text}
                  onChange={(e) => handleChange("text", e.target.value)}
                  error={errors.text}
                  placeholder="e.g., Hello"
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Language
                  </label>
                  <select
                    value={formData.languageId}
                    onChange={(e) => handleChange("languageId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">Select Language</option>
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
              Edit Word
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleEditWord} className="space-y-2">
              <div className="mt-2 space-y-4">
                <FormInput
                  label="Text"
                  value={formData.text}
                  onChange={(e) => handleChange("text", e.target.value)}
                  error={errors.text}
                  placeholder="e.g., Hello"
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Language
                  </label>
                  <select
                    value={formData.languageId}
                    onChange={(e) => handleChange("languageId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">Select Language</option>
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
          setCurrentWord(null);
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
              Are you sure you want to delete the Word "{currentWord?.text}"?
              This will also remove related cards.
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

export default AdminWordsPage;
