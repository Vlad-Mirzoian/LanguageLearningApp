import { useCallback, useEffect, useState } from "react";
import type { Module, Card, Word, ApiError } from "../types/index";
import { CardAPI, ModuleAPI, WordAPI } from "../services/index";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

const AdminCardsPage: React.FC = () => {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("adminCardsPage.failedToCreateCard"));
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
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("adminCardsPage.failedToUpdateCard"));
    }
  };

  const handleDeleteCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentCard) return;

    try {
      await CardAPI.deleteCard(currentCard.id);
      setCards(cards.filter((card) => card.id !== currentCard.id));
      setTotalCards(totalCards - 1);
      setIsDeleteModalOpen(false);
      setCurrentCard(null);
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("adminCardsPage.failedToDeleteCard"));
    }
  };

  console.log(currentCard);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          {t("adminCardsPage.adminPanel")}
        </h2>
        <div className="flex flex-col sm:flex-row justify-center items-end gap-8 mt-4 mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminCardsPage.filterByWord")}
            </label>
            <input
              type="text"
              value={filters.wordText}
              onChange={(e) => handleFilterChange("wordText", e.target.value)}
              placeholder={t("adminCardsPage.searchByWordPlaceholder")}
              className="w-full py-2.5 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminCardsPage.filterByModule")}
            </label>
            <input
              type="text"
              value={filters.moduleName}
              onChange={(e) => handleFilterChange("moduleName", e.target.value)}
              placeholder={t("adminCardsPage.searchByModulePlaceholder")}
              className="w-full py-2.5 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <button
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
                      {t("adminCardsPage.firstWord")}
                    </th>
                    <th className="p-4 font-semibold text-indigo-700">
                      {t("adminCardsPage.secondWord")}
                    </th>
                    <th className="p-4 font-semibold text-indigo-700">
                      {t("adminCardsPage.modules")}
                    </th>
                    <th className="p-4 font-semibold text-indigo-700">
                      {t("adminCardsPage.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id} className="border-t hover:bg-gray-50">
                      <td className="p-4 text-gray-800">
                        {card.firstWord.text}
                      </td>
                      <td className="p-4 text-gray-800">
                        {card.secondWord.text}
                      </td>
                      <td className="p-4 text-gray-800">
                        {card.modules.map((mod) => mod.name).join(", ")}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            console.log(card.modules);
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
        }}
        className="relative z-50"
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
                      className="flex-1 px-4 py-2.5 text-sm rounded-l-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleWordSearch("firstWord")}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <select
                    value={formData.firstWordId}
                    onChange={(e) =>
                      handleChange("firstWordId", e.target.value)
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">{t("adminCardsPage.selectWord")}</option>
                    {searchedFirstWords.map((word) => (
                      <option key={word.id} value={word.id}>
                        {word.text}
                      </option>
                    ))}
                  </select>
                  {errors.firstWordId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.firstWordId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
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
                      className="flex-1 px-4 py-2.5 text-sm rounded-l-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleWordSearch("secondWord")}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <select
                    value={formData.secondWordId}
                    onChange={(e) =>
                      handleChange("secondWordId", e.target.value)
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">{t("adminCardsPage.selectWord")}</option>
                    {searchedSecondWords.map((word) => (
                      <option key={word.id} value={word.id}>
                        {word.text}
                      </option>
                    ))}
                  </select>
                  {errors.secondWordId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.secondWordId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
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
                      className="flex-1 px-4 py-2.5 text-sm rounded-l-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={handleModuleSearch}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <select
                    multiple
                    value={formData.moduleIds}
                    onChange={(e) => {
                      const selectedIds = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      );
                      const selected = [
                        ...selectedModules.filter((m) =>
                          selectedIds.includes(m.id)
                        ),
                        ...searchedModules.filter(
                          (m) =>
                            selectedIds.includes(m.id) &&
                            !selectedModules.some((sm) => sm.id === m.id)
                        ),
                      ];
                      setSelectedModules(selected);
                      setFormData({
                        ...formData,
                        moduleIds: selectedIds,
                      });
                      handleChange("moduleIds", selectedIds);
                    }}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200 h-36"
                  >
                    {[
                      ...selectedModules,
                      ...searchedModules.filter(
                        (m) => !selectedModules.some((sm) => sm.id === m.id)
                      ),
                    ].map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.name}
                      </option>
                    ))}
                  </select>
                  {errors.moduleIds && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.moduleIds}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormData({
                      firstWordId: "",
                      secondWordId: "",
                      moduleIds: [],
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
        }}
        className="relative z-50"
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
                      className="flex-1 px-4 py-2.5 text-sm rounded-l-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleWordSearch("firstWord")}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <select
                    value={formData.firstWordId}
                    onChange={(e) =>
                      handleChange("firstWordId", e.target.value)
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">{t("adminCardsPage.selectWord")}</option>
                    {searchedFirstWords.map((word) => (
                      <option key={word.id} value={word.id}>
                        {word.text}
                      </option>
                    ))}
                  </select>
                  {errors.firstWordId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.firstWordId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
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
                      className="flex-1 px-4 py-2.5 text-sm rounded-l-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleWordSearch("secondWord")}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <select
                    value={formData.secondWordId}
                    onChange={(e) =>
                      handleChange("secondWordId", e.target.value)
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">{t("adminCardsPage.selectWord")}</option>
                    {searchedSecondWords.map((word) => (
                      <option key={word.id} value={word.id}>
                        {word.text}
                      </option>
                    ))}
                  </select>
                  {errors.secondWordId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.secondWordId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
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
                      className="flex-1 px-4 py-2.5 text-sm rounded-l-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={handleModuleSearch}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors duration-200"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <select
                    multiple
                    value={formData.moduleIds}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => {
                          const mod =
                            searchedModules.find(
                              (m) => m.id === option.value
                            ) ||
                            selectedModules.find((m) => m.id === option.value);
                          return mod!;
                        }
                      ).filter(Boolean) as Module[];
                      setSelectedModules(selected);
                      setFormData({
                        ...formData,
                        moduleIds: selected.map((m) => m.id),
                      });
                    }}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200 h-36"
                  >
                    {[
                      ...selectedModules,
                      ...searchedModules.filter(
                        (m) => !selectedModules.some((sm) => sm.id === m.id)
                      ),
                    ].map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.name}
                      </option>
                    ))}
                  </select>
                  {errors.moduleIds && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.moduleIds}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setCurrentCard(null);
                    setFormData({
                      firstWordId: "",
                      secondWordId: "",
                      moduleIds: [],
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
                firstWord: currentCard?.firstWord.text,
                secondWord: currentCard?.secondWord.text,
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
