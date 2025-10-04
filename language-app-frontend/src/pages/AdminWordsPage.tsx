import { Fragment, useCallback, useEffect, useState } from "react";
import type { ApiError, Language, Word } from "../types/index";
import { LanguageAPI, WordAPI } from "../services/index";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import FormInput from "../components/ui/FormInput";
import { ArrowPathIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

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
  const [isVisible, setIsVisible] = useState(false);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [formData, setFormData] = useState({
    text: "",
    languageId: "",
    example: "",
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
          LanguageAPI.getLanguages(),
          WordAPI.getWords({
            languageId: filters.languageId || undefined,
            text: filters.text || undefined,
            limit: filters.limit,
            skip: (filters.page - 1) * filters.limit,
          }),
        ]);
        setWords(wordData.words);
        setTotalWords(wordData.total);
        setLanguages(langData);
      } catch (err) {
        const error = err as ApiError;
        setError(error.message || t("adminWordsPage.failedToLoadWords"));
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
      const uniquenessCheck = await WordAPI.checkWordUnique(formData);
      if (!uniquenessCheck.isUnique) {
        setServerError(t("adminWordsPage.wordAlreadyExists"));
        return;
      }
      const newWord = await WordAPI.createWord(formData);
      setWords([...words, newWord]);
      setTotalWords(totalWords + 1);
      closeAddModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("adminWordsPage.failedToCreateWord"));
    }
  };

  const closeAddModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setFormData({ text: "", languageId: "", example: "" });
      setErrors({});
      setServerError("");
    }, 300);
  };

  const handleEditWord = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentWord || !validateForm()) {
      return;
    }

    try {
      const uniquenessCheck = await WordAPI.checkWordUnique(formData);
      if (!uniquenessCheck.isUnique) {
        setServerError(t("adminWordsPage.wordAlreadyExists"));
        return;
      }
      const updateData: Partial<typeof formData> = {};
      if (formData.text !== currentWord.text) updateData.text = formData.text;
      if (formData.languageId !== currentWord.language.id)
        updateData.languageId = formData.languageId;
      if ((formData.example || "") !== (currentWord.example || ""))
        updateData.example = formData.example || undefined;

      if (Object.keys(updateData).length > 0) {
        const updatedWord = await WordAPI.updateWord(
          currentWord.id,
          updateData
        );
        setWords(
          words.map((word) => (word.id === updatedWord.id ? updatedWord : word))
        );
      }
      closeEditModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("adminWordsPage.failedToUpdateWord"));
    }
  };

  const closeEditModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsEditModalOpen(false);
      setCurrentWord(null);
      setFormData({ text: "", languageId: "", example: "" });
      setErrors({});
      setServerError("");
    }, 300);
  };

  const handleDeleteWord = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentWord) return;

    try {
      await WordAPI.deleteWord(currentWord.id);
      setWords(words.filter((word) => word.id !== currentWord.id));
      setTotalWords(totalWords - 1);
      closeDeleteModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("adminWordsPage.failedToDeleteWord"));
    }
  };

  const closeDeleteModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsDeleteModalOpen(false);
      setCurrentWord(null);
      setServerError("");
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-poppins font-bold text-center text-primary mb-6">
          {t("adminWordsPage.adminPanel")}
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mt-4 mb-6 space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <div className="relative flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("adminWordsPage.filterByLanguage")}
            </label>
            <motion.div transition={{ duration: 0.3 }}>
              <Listbox
                value={filters.languageId}
                onChange={(value) => handleFilterChange("languageId", value)}
              >
                {({ open }) => (
                  <>
                    <ListboxButton className="relative w-48 sm:w-64 bg-gradient-primary text-white py-3 px-4 pr-8 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md">
                      <span className="block truncate">
                        {filters.languageId === ""
                          ? t("adminWordsPage.allLanguages")
                          : languages.find(
                              (lang) => lang.id === filters.languageId
                            )?.name}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDownIcon
                          className="h-4 w-4 text-white"
                          aria-hidden="true"
                        />
                      </span>
                    </ListboxButton>
                    <Transition
                      as={Fragment}
                      show={open}
                      enter="transition ease-out duration-100"
                      enterFrom="transform scale-95"
                      enterTo="transform scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform scale-100"
                      leaveTo="transform scale-95"
                    >
                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full sm:w-64 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                        <ListboxOption
                          value=""
                          className={({ selected }) =>
                            `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                              selected
                                ? "bg-primary text-white"
                                : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                            }`
                          }
                        >
                          {({ selected }) => (
                            <span
                              className={`block truncate ${
                                selected ? "font-semibold" : "font-medium"
                              }`}
                            >
                              {t("adminWordsPage.allLanguages")}
                            </span>
                          )}
                        </ListboxOption>
                        {languages.map((lang) => (
                          <ListboxOption
                            key={lang.id}
                            value={lang.id}
                            className={({ selected }) =>
                              `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                selected
                                  ? "bg-primary text-white"
                                  : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <span
                                className={`block truncate ${
                                  selected ? "font-semibold" : "font-medium"
                                }`}
                              >
                                {lang.name}
                              </span>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </>
                )}
              </Listbox>
            </motion.div>
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("adminWordsPage.filterByText")}
            </label>
            <motion.input
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="text"
              value={filters.text}
              onChange={(e) => handleFilterChange("text", e.target.value)}
              placeholder={t("adminWordsPage.searchByText")}
              className="w-48 sm:w-64 py-2.5 px-4 border border-gray-100 rounded-lg bg-white/90 font-poppins text-dark focus:outline-none focus:ring-2 focus:ring-accent shadow-sm transition-all duration-200"
            />
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("adminWordsPage.addWord")}
            </label>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setFormData({ text: "", languageId: "", example: "" });
                setErrors({});
                setServerError("");
                setIsAddModalOpen(true);
                setIsVisible(true);
              }}
              className="w-48 sm:w-64 bg-gradient-primary text-white py-2.75 px-4 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
            >
              {t("adminWordsPage.addWord")}
            </motion.button>
          </div>
        </motion.div>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center mb-6"
          >
            <ArrowPathIcon className="h-5 w-5 text-primary animate-spin" />
            <span className="ml-2 text-dark font-poppins">
              {t("adminWordsPage.loadingWords")}
            </span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-poppins rounded-lg text-center animate-fade-in"
          >
            {error}
          </motion.div>
        )}
        {!loading && !error && words.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center text-dark font-poppins text-lg"
          >
            {t("adminWordsPage.noWordsAvailable")}
          </motion.div>
        )}
        {!loading && !error && words.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="bg-white/98 backdrop-blur-sm rounded-2xl shadow-lg overflow-x-auto"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gradient-primary text-white">
                    <th className="p-4 font-poppins font-semibold rounded-tl-lg">
                      {t("adminWordsPage.text")}
                    </th>
                    <th className="p-4 font-poppins font-semibold">
                      {t("adminWordsPage.language")}
                    </th>
                    <th className="p-4 font-poppins font-semibold">
                      {t("adminWordsPage.example")}
                    </th>
                    <th className="p-4 font-poppins font-semibold rounded-tr-lg">
                      {t("adminWordsPage.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {words.map((word, index) => (
                    <motion.tr
                      key={word.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="border-t border-gray-100 hover:bg-accent-opacity-10 transition-all duration-200"
                    >
                      <td className="p-4 text-dark font-poppins">
                        {word.text}
                      </td>
                      <td className="p-4 text-dark font-poppins">
                        {word.language.name}
                      </td>
                      <td className="p-4 text-dark font-poppins">
                        {word.example}
                      </td>
                      <td className="p-4 space-x-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setCurrentWord(word);
                            setFormData({
                              text: word.text,
                              languageId: word.language.id,
                              example: word.example ?? "",
                            });
                            setErrors({});
                            setServerError("");
                            setIsEditModalOpen(true);
                            setIsVisible(true);
                          }}
                          className="text-accent hover:text-primary font-poppins font-medium hover:underline transition-all duration-200"
                        >
                          {t("adminWordsPage.edit")}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setCurrentWord(word);
                            setIsDeleteModalOpen(true);
                            setIsVisible(true);
                          }}
                          className="text-red-600 hover:text-red-800 font-poppins font-medium hover:underline transition-all duration-200"
                        >
                          {t("adminWordsPage.delete")}
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="flex justify-between items-center mt-4"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className={`px-4 py-2 rounded-lg font-poppins font-semibold transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-accent shadow-md
    ${
      filters.page === 1
        ? "bg-gray-400 cursor-not-allowed text-white"
        : "bg-gradient-primary text-white hover:bg-gradient-primary-hover"
    }`}
              >
                {t("adminWordsPage.previous")}
              </motion.button>
              <span className="text-dark font-poppins">
                {t("adminWordsPage.pageOf", {
                  current: filters.page,
                  total: totalPages,
                })}
              </span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === totalPages}
                className={`px-4 py-2 rounded-lg font-poppins font-semibold transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-accent shadow-md
    ${
      filters.page === totalPages
        ? "bg-gray-400 cursor-not-allowed text-white"
        : "bg-gradient-primary text-white hover:bg-gradient-primary-hover"
    }`}
              >
                {t("adminWordsPage.next")}
              </motion.button>
            </motion.div>
          </>
        )}
      </motion.div>
      <Dialog open={isAddModalOpen} onClose={closeAddModal}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/30"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            as={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: isVisible ? 1 : 0,
              scale: isVisible ? 1 : 0.95,
            }}
            className="bg-white/98 backdrop-blur-sm p-6 rounded-2xl shadow-lg w-full max-w-md"
          >
            <DialogTitle className="text-lg font-poppins font-bold text-primary">
              {t("adminWordsPage.addWordModalTitle")}
            </DialogTitle>
            {serverError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-3 mt-3 p-3 bg-red-50 text-red-600 text-sm font-poppins rounded-lg text-center animate-fade-in"
              >
                {serverError}
              </motion.div>
            )}
            <form onSubmit={handleAddWord} className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-2 space-y-4"
              >
                <FormInput
                  label={t("adminWordsPage.text")}
                  value={formData.text}
                  onChange={(e) => handleChange("text", e.target.value)}
                  error={errors.text}
                  placeholder={t("adminWordsPage.textPlaceholder")}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <label className="block text-sm font-poppins font-bold text-dark mb-1">
                    {t("adminWordsPage.language")}
                  </label>
                  <Listbox
                    value={formData.languageId}
                    onChange={(value) => handleChange("languageId", value)}
                  >
                    {({ open }) => (
                      <>
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ListboxButton className="relative w-full py-2.5 px-4 border border-gray-100 rounded-lg bg-white/90 font-poppins text-dark focus:outline-none focus:ring-2 focus:ring-accent shadow-sm transition-all duration-200">
                            <span className="block truncate">
                              {formData.languageId === ""
                                ? t("adminWordsPage.selectLanguage")
                                : languages.find(
                                    (lang) => lang.id === formData.languageId
                                  )?.name}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronDownIcon
                                className="h-4 w-4 text-dark"
                                aria-hidden="true"
                              />
                            </span>
                          </ListboxButton>
                        </motion.div>
                        <Transition
                          as={Fragment}
                          show={open}
                          enter="transition ease-out duration-100"
                          enterFrom="transform scale-95"
                          enterTo="transform scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform scale-100"
                          leaveTo="transform scale-95"
                        >
                          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-100 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                            <ListboxOption
                              value=""
                              className={({ selected }) =>
                                `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                  selected
                                    ? "bg-primary text-white"
                                    : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                }`
                              }
                            >
                              {({ selected }) => (
                                <span
                                  className={`block truncate ${
                                    selected ? "font-semibold" : "font-medium"
                                  }`}
                                >
                                  {t("adminWordsPage.selectLanguage")}
                                </span>
                              )}
                            </ListboxOption>
                            {languages.map((lang) => (
                              <ListboxOption
                                key={lang.id}
                                value={lang.id}
                                className={({ selected }) =>
                                  `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                    selected
                                      ? "bg-primary text-white"
                                      : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <span
                                    className={`block truncate ${
                                      selected ? "font-semibold" : "font-medium"
                                    }`}
                                  >
                                    {lang.name}
                                  </span>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </>
                    )}
                  </Listbox>
                  {errors.languageId && (
                    <p className="mt-1 text-sm text-red-600 font-poppins">
                      {errors.languageId}
                    </p>
                  )}
                </motion.div>
                <FormInput
                  label={t("adminWordsPage.example")}
                  value={formData.example}
                  onChange={(e) => handleChange("example", e.target.value)}
                  error={errors.example}
                  placeholder={t("adminWordsPage.examplePlaceholder")}
                />
              </motion.div>
              <div className="mt-6 flex justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 text-dark font-poppins font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {t("adminWordsPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminWordsPage.add")}
                </motion.button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog open={isEditModalOpen} onClose={closeEditModal}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/30"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            as={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: isVisible ? 1 : 0,
              scale: isVisible ? 1 : 0.95,
            }}
            className="bg-white/98 backdrop-blur-sm p-6 rounded-2xl shadow-lg w-full max-w-md"
          >
            <DialogTitle className="text-lg font-poppins font-bold text-primary">
              {t("adminWordsPage.editWordModalTitle")}
            </DialogTitle>
            {serverError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-3 mt-3 p-3 bg-red-50 text-red-600 text-sm font-poppins rounded-lg text-center animate-fade-in"
              >
                {serverError}
              </motion.div>
            )}
            <form onSubmit={handleEditWord} className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-2 space-y-4"
              >
                <FormInput
                  label={t("adminWordsPage.text")}
                  value={formData.text}
                  onChange={(e) => handleChange("text", e.target.value)}
                  error={errors.text}
                  placeholder={t("adminWordsPage.textPlaceholder")}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <label className="block text-sm font-poppins font-bold text-dark mb-1">
                    {t("adminWordsPage.language")}
                  </label>
                  <Listbox
                    value={formData.languageId}
                    onChange={(value) => handleChange("languageId", value)}
                  >
                    {({ open }) => (
                      <>
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ListboxButton className="relative w-full py-2.5 px-4 border border-gray-100 rounded-lg bg-white/90 font-poppins text-dark focus:outline-none focus:ring-2 focus:ring-accent shadow-sm transition-all duration-200">
                            <span className="block truncate">
                              {formData.languageId === ""
                                ? t("adminWordsPage.selectLanguage")
                                : languages.find(
                                    (lang) => lang.id === formData.languageId
                                  )?.name}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronDownIcon
                                className="h-4 w-4 text-dark"
                                aria-hidden="true"
                              />
                            </span>
                          </ListboxButton>
                        </motion.div>
                        <Transition
                          as={Fragment}
                          show={open}
                          enter="transition ease-out duration-100"
                          enterFrom="transform scale-95"
                          enterTo="transform scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform scale-100"
                          leaveTo="transform scale-95"
                        >
                          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                            <ListboxOption
                              value=""
                              className={({ selected }) =>
                                `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                  selected
                                    ? "bg-primary text-white"
                                    : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                }`
                              }
                            >
                              {({ selected }) => (
                                <span
                                  className={`block truncate ${
                                    selected ? "font-semibold" : "font-medium"
                                  }`}
                                >
                                  {t("adminWordsPage.selectLanguage")}
                                </span>
                              )}
                            </ListboxOption>
                            {languages.map((lang) => (
                              <ListboxOption
                                key={lang.id}
                                value={lang.id}
                                className={({ selected }) =>
                                  `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                    selected
                                      ? "bg-primary text-white"
                                      : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <span
                                    className={`block truncate ${
                                      selected ? "font-semibold" : "font-medium"
                                    }`}
                                  >
                                    {lang.name}
                                  </span>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </>
                    )}
                  </Listbox>
                  {errors.languageId && (
                    <p className="mt-1 text-sm text-red-600 font-poppins">
                      {errors.languageId}
                    </p>
                  )}
                </motion.div>
                <FormInput
                  label={t("adminWordsPage.example")}
                  value={formData.example}
                  onChange={(e) => handleChange("example", e.target.value)}
                  error={errors.example}
                  placeholder={t("adminWordsPage.examplePlaceholder")}
                />
              </motion.div>
              <div className="mt-6 flex justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-dark font-poppins font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {t("adminWordsPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminWordsPage.save")}
                </motion.button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog open={isDeleteModalOpen} onClose={closeDeleteModal}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/30"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            as={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: isVisible ? 1 : 0,
              scale: isVisible ? 1 : 0.95,
            }}
            className="bg-white/98 backdrop-blur-sm p-6 rounded-2xl shadow-lg w-full max-w-md"
          >
            <DialogTitle className="text-lg font-poppins font-bold text-primary">
              {t("adminWordsPage.confirmDeletionTitle")}
            </DialogTitle>
            <p className="mt-2 text-dark font-poppins">
              {t("adminWordsPage.confirmDeletionMessage", {
                text: currentWord?.text,
              })}
            </p>
            {serverError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-3 mt-3 p-3 bg-red-50 text-red-600 text-sm font-poppins rounded-lg text-center animate-fade-in"
              >
                {serverError}
              </motion.div>
            )}
            <form onSubmit={handleDeleteWord} className="space-y-4">
              <div className="mt-6 flex justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-dark font-poppins font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {t("adminWordsPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-poppins font-semibold hover:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
                >
                  {t("adminWordsPage.delete")}
                </motion.button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminWordsPage;
