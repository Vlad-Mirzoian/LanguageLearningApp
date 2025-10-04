import { Fragment, useCallback, useEffect, useState } from "react";
import type { Module, Card, Word, ApiError } from "../types/index";
import { CardAPI, ModuleAPI, WordAPI } from "../services/index";
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
import {
  ArrowPathIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const AdminCardsPage: React.FC = () => {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [searchData, setSearchData] = useState({
    firstWord: "",
    secondWord: "",
    module: "",
  });
  const [formData, setFormData] = useState({
    firstWordId: "",
    secondWordId: "",
    moduleIds: [] as string[],
  });
  const [filters, setFilters] = useState({
    wordText: "",
    moduleName: "",
    page: 1,
    limit: 20,
  });
  const [searchedModules, setSearchedModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<Module[]>([]);
  const [searchedFirstWords, setSearchedFirstWords] = useState<Word[]>([]);
  const [searchedSecondWords, setSearchedSecondWords] = useState<Word[]>([]);
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalPages = Math.ceil(totalCards / filters.limit);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cardResponse] = await Promise.all([
          CardAPI.getCards({
            wordText: filters.wordText,
            moduleName: filters.moduleName,
            limit: filters.limit,
            skip: (filters.page - 1) * filters.limit,
          }),
        ]);
        setCards(cardResponse.cards);
        setTotalCards(cardResponse.total);
      } catch (err) {
        const error = err as ApiError;
        setError(error.message || t("adminCardsPage.failedToLoadCards"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, t]);

  const validateField = useCallback(
    (field: keyof typeof formData, value: string | string[]): string | null => {
      if (field === "moduleIds") {
        if (!Array.isArray(value) || value.length === 0) {
          return t("adminCardsPage.modulesRequired");
        }
      } else if (!value.toString().trim()) {
        switch (field) {
          case "firstWordId":
            return t("adminCardsPage.firstWordRequired");
          case "secondWordId":
            return t("adminCardsPage.secondWordRequired");
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
    (["firstWordId", "secondWordId", "moduleIds"] as const).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleChange = (
    field: keyof typeof formData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (
    field: "moduleName" | "wordText",
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handleWordSearch = async (field: "firstWord" | "secondWord") => {
    try {
      setLoading(true);
      const response = await WordAPI.getWords({ text: searchData[field] });
      if (field === "firstWord") {
        setSearchedFirstWords(response.words);
      } else {
        setSearchedSecondWords(response.words);
      }
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || t("adminCardsPage.failedToSearchModule"));
    } finally {
      setLoading(false);
    }
  };

  const handleModuleSearch = async () => {
    try {
      setLoading(true);
      const response = await ModuleAPI.getModules({ name: searchData.module });
      setSearchedModules(response.modules);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || t("adminCardsPage.failedToSearchModule"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) {
      return;
    }

    try {
      const newCard = await CardAPI.createCard(formData);
      setCards([...cards, newCard]);
      setTotalCards(totalCards + 1);
      closeAddModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("adminCardsPage.failedToCreateCard"));
    }
  };

  const closeAddModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setSearchData({
        firstWord: "",
        secondWord: "",
        module: "",
      });
      setFormData({
        firstWordId: "",
        secondWordId: "",
        moduleIds: [],
      });
      setErrors({});
      setServerError("");
      setSearchedModules([]);
      setSearchedFirstWords([]);
      setSearchedSecondWords([]);
    }, 300);
  };

  const handleEditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentCard || !validateForm()) {
      return;
    }

    try {
      const updateData: Partial<typeof formData> = {};
      if (formData.firstWordId !== currentCard.firstWord.id)
        updateData.firstWordId = formData.firstWordId;
      if (formData.secondWordId !== currentCard.secondWord.id)
        updateData.secondWordId = formData.secondWordId;
      if (
        JSON.stringify(formData.moduleIds.sort()) !==
        JSON.stringify(currentCard.modules.map((mod) => mod.id).sort())
      )
        updateData.moduleIds = formData.moduleIds;

      if (Object.keys(updateData).length > 0) {
        const updatedCard = await CardAPI.updateCard(
          currentCard.id,
          updateData
        );
        setCards(
          cards.map((card) => (card.id === updatedCard.id ? updatedCard : card))
        );
      }
      closeEditModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("adminCardsPage.failedToUpdateCard"));
    }
  };

  const closeEditModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsEditModalOpen(false);
      setCurrentCard(null);
      setSearchData({
        firstWord: "",
        secondWord: "",
        module: "",
      });
      setFormData({
        firstWordId: "",
        secondWordId: "",
        moduleIds: [],
      });
      setErrors({});
      setServerError("");
      setSearchedModules([]);
      setSearchedFirstWords([]);
      setSearchedSecondWords([]);
    }, 300);
  };

  const handleDeleteCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentCard) return;

    try {
      await CardAPI.deleteCard(currentCard.id);
      setCards(cards.filter((card) => card.id !== currentCard.id));
      setTotalCards(totalCards - 1);
      closeDeleteModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("adminCardsPage.failedToDeleteCard"));
    }
  };

  const closeDeleteModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsDeleteModalOpen(false);
      setCurrentCard(null);
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
          {t("adminCardsPage.adminPanel")}
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mt-4 mb-6 space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("adminCardsPage.filterByWord")}
            </label>
            <motion.input
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="text"
              value={filters.wordText}
              onChange={(e) => handleFilterChange("wordText", e.target.value)}
              placeholder={t("adminCardsPage.searchByWordPlaceholder")}
              className="w-48 sm:w-64 py-2.5 px-4 border border-gray-100 rounded-lg bg-white/90 font-poppins text-dark focus:outline-none focus:ring-2 focus:ring-accent shadow-sm transition-all duration-200"
            />
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("adminCardsPage.filterByModule")}
            </label>
            <motion.input
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="text"
              value={filters.moduleName}
              onChange={(e) => handleFilterChange("moduleName", e.target.value)}
              placeholder={t("adminCardsPage.searchByModulePlaceholder")}
              className="w-48 sm:w-64 py-2.5 px-4 border border-gray-100 rounded-lg bg-white/90 font-poppins text-dark focus:outline-none focus:ring-2 focus:ring-accent shadow-sm transition-all duration-200"
            />
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("adminCardsPage.addCard")}
            </label>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSearchData({
                  firstWord: "",
                  secondWord: "",
                  module: "",
                });
                setFormData({
                  firstWordId: "",
                  secondWordId: "",
                  moduleIds: [],
                });
                setErrors({});
                setServerError("");
                setSearchedModules([]);
                setSearchedFirstWords([]);
                setSearchedSecondWords([]);
                setIsAddModalOpen(true);
                setIsVisible(true);
              }}
              className="w-48 sm:w-64 bg-gradient-primary text-white py-2.75 px-4 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
            >
              {t("adminCardsPage.addCard")}
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
              {t("adminCardsPage.loadingCards")}
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
        {!loading && !error && cards.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center text-dark font-poppins text-lg"
          >
            {t("adminCardsPage.noCardsAvailable")}
          </motion.div>
        )}
        {!loading && !error && cards.length > 0 && (
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
                      {t("adminCardsPage.firstWord")}
                    </th>
                    <th className="p-4 font-poppins font-semibold">
                      {t("adminCardsPage.secondWord")}
                    </th>
                    <th className="p-4 font-poppins font-semibold">
                      {t("adminCardsPage.modules")}
                    </th>
                    <th className="p-4 font-poppins font-semibold rounded-tr-lg">
                      {t("adminCardsPage.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card, index) => (
                    <motion.tr
                      key={card.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="border-t border-gray-100 hover:bg-accent-opacity-10 transition-all duration-200"
                    >
                      <td className="p-4 text-dark font-poppins">
                        {card.firstWord.text}
                      </td>
                      <td className="p-4 text-dark font-poppins">
                        {card.secondWord.text}
                      </td>
                      <td className="p-4 text-dark font-poppins">
                        {card.modules.map((mod) => mod.name).join(", ")}
                      </td>
                      <td className="p-4 space-x-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setCurrentCard(card);
                            setFormData({
                              firstWordId: card.firstWord.id,
                              secondWordId: card.secondWord.id,
                              moduleIds: card.modules.map((m) => m.id),
                            });
                            setSearchedFirstWords([card.firstWord]);
                            setSearchedSecondWords([card.secondWord]);
                            setSearchedModules(card.modules);
                            setErrors({});
                            setServerError("");
                            setIsEditModalOpen(true);
                            setIsVisible(true);
                          }}
                          className="text-accent hover:text-primary font-poppins font-medium hover:underline transition-all duration-200"
                        >
                          {t("adminCardsPage.edit")}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setCurrentCard(card);
                            setIsDeleteModalOpen(true);
                            setIsVisible(true);
                          }}
                          className="text-red-600 hover:text-red-800 font-poppins font-medium hover:underline transition-all duration-200"
                        >
                          {t("adminCardsPage.delete")}
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
                {t("adminCardsPage.previous")}
              </motion.button>
              <span className="text-dark font-poppins">
                {t("adminCardsPage.pageInfo", {
                  currentPage: filters.page,
                  totalPages,
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
                {t("adminCardsPage.next")}
              </motion.button>
            </motion.div>
          </>
        )}
      </motion.div>
      <Dialog
        open={isAddModalOpen}
        onClose={closeAddModal}
        className="relative z-50"
      >
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
              {t("adminCardsPage.addCardModalTitle")}
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
            <form onSubmit={handleAddCard} className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-2 space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5 font-poppins">
                    {t("adminCardsPage.firstWord")}
                  </label>
                  <div className="flex w-full mb-4">
                    <input
                      type="text"
                      placeholder={t("adminCardsPage.searchWords")}
                      value={searchData.firstWord}
                      onChange={(e) =>
                        setSearchData({
                          ...searchData,
                          firstWord: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-200 font-poppins text-dark bg-white/90 shadow-sm focus:outline-none focus:ring-2 border border-gray-100 focus:ring-accent hover:bg-white/80"
                    />
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      type="button"
                      onClick={() => handleWordSearch("firstWord")}
                      className="px-4 py-2.5 bg-primary text-white rounded-r-lg hover:bg-accent transition-all duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                  <Listbox
                    value={formData.firstWordId}
                    onChange={(value) => handleChange("firstWordId", value)}
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
                              {formData.firstWordId
                                ? searchedFirstWords.find(
                                    (w) => w.id === formData.firstWordId
                                  )?.text
                                : t("adminCardsPage.selectWord")}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronDownIcon
                                className="h-4 w-4 text-primary"
                                aria-hidden="true"
                              />
                            </span>
                          </ListboxButton>
                        </motion.div>
                        <Transition
                          as={Fragment}
                          show={open}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-100 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                            <ListboxOption
                              value=""
                              className="relative cursor-pointer select-none py-2 px-4 font-poppins font-medium text-primary hover:bg-accent-opacity-10 hover:text-accent transition-all duration-200"
                            >
                              <span className="block truncate">
                                {t("adminCardsPage.selectWord")}
                              </span>
                            </ListboxOption>
                            {searchedFirstWords.map((word) => (
                              <ListboxOption
                                key={word.id}
                                value={word.id}
                                className={({ selected }) =>
                                  `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                    selected
                                      ? "bg-primary text-white"
                                      : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                  }`
                                }
                              >
                                <span className="block truncate">
                                  {word.text}
                                </span>
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </>
                    )}
                  </Listbox>
                  {errors.firstWordId && (
                    <p className="mt-1.5 text-xs text-red-600 font-poppins animate-fade-in">
                      {errors.firstWordId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5 font-poppins">
                    {t("adminCardsPage.secondWord")}
                  </label>
                  <div className="flex w-full mb-4">
                    <input
                      type="text"
                      placeholder={t("adminCardsPage.searchWords")}
                      value={searchData.secondWord}
                      onChange={(e) =>
                        setSearchData({
                          ...searchData,
                          secondWord: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-200 font-poppins text-dark bg-white/90 shadow-sm focus:outline-none focus:ring-2 border border-gray-100 focus:ring-accent hover:bg-white/80"
                    />
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      type="button"
                      onClick={() => handleWordSearch("secondWord")}
                      className="px-4 py-2.5 bg-primary text-white rounded-r-lg hover:bg-accent transition-all duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                  <Listbox
                    value={formData.secondWordId}
                    onChange={(value) => handleChange("secondWordId", value)}
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
                              {formData.secondWordId
                                ? searchedSecondWords.find(
                                    (w) => w.id === formData.secondWordId
                                  )?.text
                                : t("adminCardsPage.selectWord")}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronDownIcon
                                className="h-4 w-4 text-primary"
                                aria-hidden="true"
                              />
                            </span>
                          </ListboxButton>
                        </motion.div>
                        <Transition
                          as={Fragment}
                          show={open}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-100 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                            <ListboxOption
                              value=""
                              className="relative cursor-pointer select-none py-2 px-4 font-poppins font-medium text-primary hover:bg-accent-opacity-10 hover:text-accent transition-all duration-200"
                            >
                              <span className="block truncate">
                                {t("adminCardsPage.selectWord")}
                              </span>
                            </ListboxOption>
                            {searchedSecondWords.map((word) => (
                              <ListboxOption
                                key={word.id}
                                value={word.id}
                                className={({ selected }) =>
                                  `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                    selected
                                      ? "bg-primary text-white"
                                      : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                  }`
                                }
                              >
                                <span className="block truncate">
                                  {word.text}
                                </span>
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </>
                    )}
                  </Listbox>
                  {errors.secondWordId && (
                    <p className="mt-1.5 text-xs text-red-600 font-poppins animate-fade-in">
                      {errors.secondWordId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5 font-poppins">
                    {t("adminCardsPage.modules")}
                  </label>
                  <div className="flex w-full mb-4">
                    <input
                      type="text"
                      placeholder={t("adminCardsPage.searchModules")}
                      value={searchData.module}
                      onChange={(e) =>
                        setSearchData({ ...searchData, module: e.target.value })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-200 font-poppins text-dark bg-white/90 shadow-sm focus:outline-none focus:ring-2 border border-gray-100 focus:ring-accent hover:bg-white/80"
                    />
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      type="button"
                      onClick={handleModuleSearch}
                      className="px-4 py-2.5 bg-primary text-white rounded-r-lg hover:bg-accent transition-all duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                  <Listbox
                    value={formData.moduleIds}
                    onChange={(selectedIds) => {
                      const selected = selectedIds
                        .map((id) =>
                          [...selectedModules, ...searchedModules].find(
                            (m) => m.id === id
                          )
                        )
                        .filter((m): m is Module => !!m);
                      setSelectedModules(selected);
                      setFormData({
                        ...formData,
                        moduleIds: selectedIds,
                      });
                      handleChange("moduleIds", selectedIds);
                    }}
                    multiple
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
                              {formData.moduleIds.length > 0
                                ? formData.moduleIds
                                    .map(
                                      (id) =>
                                        [
                                          ...selectedModules,
                                          ...searchedModules,
                                        ].find((m) => m.id === id)?.name
                                    )
                                    .filter(Boolean)
                                    .join(", ") ||
                                  t("adminCardsPage.selectModules")
                                : t("adminCardsPage.selectModules")}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronDownIcon
                                className="h-4 w-4 text-primary"
                                aria-hidden="true"
                              />
                            </span>
                          </ListboxButton>
                        </motion.div>
                        <Transition
                          as={Fragment}
                          show={open}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-100 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                            {[
                              ...selectedModules,
                              ...searchedModules.filter(
                                (m) =>
                                  !selectedModules.some((sm) => sm.id === m.id)
                              ),
                            ].map((mod) => (
                              <ListboxOption
                                key={mod.id}
                                value={mod.id}
                                className={({ selected }) =>
                                  `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                    selected
                                      ? "bg-primary text-white"
                                      : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                  }`
                                }
                              >
                                <span className="block truncate">
                                  {mod.name}
                                </span>
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </>
                    )}
                  </Listbox>
                  {errors.moduleIds && (
                    <p className="mt-1.5 text-xs text-red-600 font-poppins animate-fade-in">
                      {errors.moduleIds}
                    </p>
                  )}
                </div>
              </motion.div>
              <div className="mt-6 flex justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 text-dark font-poppins font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {t("adminCardsPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminCardsPage.add")}
                </motion.button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog
        open={isEditModalOpen}
        onClose={closeEditModal}
        className="relative z-50"
      >
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
              {t("adminCardsPage.editCardModalTitle")}
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
            <form onSubmit={handleEditCard} className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-2 space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5 font-poppins">
                    {t("adminCardsPage.firstWord")}
                  </label>
                  <div className="flex w-full mb-4">
                    <input
                      type="text"
                      placeholder={t("adminCardsPage.searchWords")}
                      value={searchData.firstWord}
                      onChange={(e) =>
                        setSearchData({
                          ...searchData,
                          firstWord: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-200 font-poppins text-dark bg-white/90 shadow-sm focus:outline-none focus:ring-2 border border-gray-100 focus:ring-accent hover:bg-white/80"
                    />
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      type="button"
                      onClick={() => handleWordSearch("firstWord")}
                      className="px-4 py-2.5 bg-primary text-white rounded-r-lg hover:bg-accent transition-all duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                  <Listbox
                    value={formData.firstWordId}
                    onChange={(value) => handleChange("firstWordId", value)}
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
                              {formData.firstWordId
                                ? searchedFirstWords.find(
                                    (w) => w.id === formData.firstWordId
                                  )?.text
                                : t("adminCardsPage.selectWord")}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronDownIcon
                                className="h-4 w-4 text-primary"
                                aria-hidden="true"
                              />
                            </span>
                          </ListboxButton>
                        </motion.div>
                        <Transition
                          as={Fragment}
                          show={open}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-100 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                            <ListboxOption
                              value=""
                              className="relative cursor-pointer select-none py-2 px-4 font-poppins font-medium text-primary hover:bg-accent-opacity-10 hover:text-accent transition-all duration-200"
                            >
                              <span className="block truncate">
                                {t("adminCardsPage.selectWord")}
                              </span>
                            </ListboxOption>
                            {searchedFirstWords.map((word) => (
                              <ListboxOption
                                key={word.id}
                                value={word.id}
                                className={({ selected }) =>
                                  `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                    selected
                                      ? "bg-primary text-white"
                                      : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                  }`
                                }
                              >
                                <span className="block truncate">
                                  {word.text}
                                </span>
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </>
                    )}
                  </Listbox>
                  {errors.firstWordId && (
                    <p className="mt-1.5 text-xs text-red-600 font-poppins animate-fade-in">
                      {errors.firstWordId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5 font-poppins">
                    {t("adminCardsPage.secondWord")}
                  </label>
                  <div className="flex w-full mb-4">
                    <input
                      type="text"
                      placeholder={t("adminCardsPage.searchWords")}
                      value={searchData.secondWord}
                      onChange={(e) =>
                        setSearchData({
                          ...searchData,
                          secondWord: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-200 font-poppins text-dark bg-white/90 shadow-sm focus:outline-none focus:ring-2 border border-gray-100 focus:ring-accent hover:bg-white/80"
                    />
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      type="button"
                      onClick={() => handleWordSearch("secondWord")}
                      className="px-4 py-2.5 bg-primary text-white rounded-r-lg hover:bg-accent transition-all duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                  <Listbox
                    value={formData.secondWordId}
                    onChange={(value) => handleChange("secondWordId", value)}
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
                              {formData.secondWordId
                                ? searchedSecondWords.find(
                                    (w) => w.id === formData.secondWordId
                                  )?.text
                                : t("adminCardsPage.selectWord")}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronDownIcon
                                className="h-4 w-4 text-primary"
                                aria-hidden="true"
                              />
                            </span>
                          </ListboxButton>
                        </motion.div>
                        <Transition
                          as={Fragment}
                          show={open}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-100 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                            <ListboxOption
                              value=""
                              className="relative cursor-pointer select-none py-2 px-4 font-poppins font-medium text-primary hover:bg-accent-opacity-10 hover:text-accent transition-all duration-200"
                            >
                              <span className="block truncate">
                                {t("adminCardsPage.selectWord")}
                              </span>
                            </ListboxOption>
                            {searchedSecondWords.map((word) => (
                              <ListboxOption
                                key={word.id}
                                value={word.id}
                                className={({ selected }) =>
                                  `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                    selected
                                      ? "bg-primary text-white"
                                      : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                  }`
                                }
                              >
                                <span className="block truncate">
                                  {word.text}
                                </span>
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </>
                    )}
                  </Listbox>
                  {errors.secondWordId && (
                    <p className="mt-1.5 text-xs text-red-600 font-poppins animate-fade-in">
                      {errors.secondWordId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5 font-poppins">
                    {t("adminCardsPage.modules")}
                  </label>
                  <div className="flex w-full mb-4">
                    <input
                      type="text"
                      placeholder={t("adminCardsPage.searchModules")}
                      value={searchData.module}
                      onChange={(e) =>
                        setSearchData({ ...searchData, module: e.target.value })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-200 font-poppins text-dark bg-white/90 shadow-sm focus:outline-none focus:ring-2 border border-gray-100 focus:ring-accent hover:bg-white/80"
                    />
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      type="button"
                      onClick={handleModuleSearch}
                      className="px-4 py-2.5 bg-primary text-white rounded-r-lg hover:bg-accent transition-all duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                  <Listbox
                    value={formData.moduleIds}
                    onChange={(selectedIds) => {
                      const selected = selectedIds
                        .map((id) =>
                          [...selectedModules, ...searchedModules].find(
                            (m) => m.id === id
                          )
                        )
                        .filter((m): m is Module => !!m);
                      setSelectedModules(selected);
                      setFormData({
                        ...formData,
                        moduleIds: selectedIds,
                      });
                      handleChange("moduleIds", selectedIds);
                    }}
                    multiple
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
                              {formData.moduleIds.length > 0
                                ? formData.moduleIds
                                    .map(
                                      (id) =>
                                        [
                                          ...selectedModules,
                                          ...searchedModules,
                                        ].find((m) => m.id === id)?.name
                                    )
                                    .filter(Boolean)
                                    .join(", ") ||
                                  t("adminCardsPage.selectModules")
                                : t("adminCardsPage.selectModules")}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronDownIcon
                                className="h-4 w-4 text-primary"
                                aria-hidden="true"
                              />
                            </span>
                          </ListboxButton>
                        </motion.div>
                        <Transition
                          as={Fragment}
                          show={open}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-100 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                            {[
                              ...selectedModules,
                              ...searchedModules.filter(
                                (m) =>
                                  !selectedModules.some((sm) => sm.id === m.id)
                              ),
                            ].map((mod) => (
                              <ListboxOption
                                key={mod.id}
                                value={mod.id}
                                className={({ selected }) =>
                                  `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                    selected
                                      ? "bg-primary text-white"
                                      : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                  }`
                                }
                              >
                                <span className="block truncate">
                                  {mod.name}
                                </span>
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </>
                    )}
                  </Listbox>
                  {errors.moduleIds && (
                    <p className="mt-1.5 text-xs text-red-600 font-poppins animate-fade-in">
                      {errors.moduleIds}
                    </p>
                  )}
                </div>
              </motion.div>
              <div className="mt-6 flex justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-dark font-poppins font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {t("adminCardsPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminCardsPage.save")}
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
              {t("adminCardsPage.confirmDeletionTitle")}
            </DialogTitle>
            <p className="mt-2 text-dark font-poppins">
              {t("adminCardsPage.confirmDeletionMessage", {
                firstWord: currentCard?.firstWord.text,
                secondWord: currentCard?.secondWord.text,
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
            <form onSubmit={handleDeleteCard} className="space-y-2">
              <div className="mt-6 flex justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-dark font-poppins font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {t("adminCardsPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-poppins font-semibold hover:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
                >
                  {t("adminCardsPage.delete")}
                </motion.button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminCardsPage;
