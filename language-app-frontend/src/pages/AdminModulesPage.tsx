import { Fragment, useCallback, useEffect, useState } from "react";
import type { ApiError, Module, Language } from "../types/index";
import { LanguageAPI, ModuleAPI } from "../services/index";
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
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/solid";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const AdminModulesPage: React.FC = () => {
  const { t } = useTranslation();
  const [totalModules, setTotalModules] = useState(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    languageId: "",
    order: "",
    requiredScore: "80",
  });
  const [filters, setFilters] = useState({
    languageId: "",
    name: "",
    page: 1,
    limit: 20,
  });
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalPages = Math.ceil(totalModules / filters.limit);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const [moduleResponse, langData] = await Promise.all([
          ModuleAPI.getModules({
            languageId: filters.languageId || undefined,
            name: filters.name || undefined,
            limit: filters.limit,
            skip: (filters.page - 1) * filters.limit,
          }),
          LanguageAPI.getLanguages(),
        ]);
        setModules(moduleResponse.modules);
        setTotalModules(moduleResponse.total);
        setLanguages(langData);
      } catch (err) {
        const error = err as ApiError;
        setError(error.message || t("adminModulesPage.failedToLoadCategories"));
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [filters, t]);

  const validateField = useCallback(
    (field: keyof typeof formData, value: string): string | null => {
      if (field === "name") {
        if (!value.trim()) return t("adminModulesPage.nameRequired");
      }
      if (field === "languageId") {
        if (!value.trim()) return t("adminModulesPage.languageRequired");
      }
      if (field === "order") {
        if (!value || isNaN(Number(value)) || Number(value) < 1) {
          return t("adminModulesPage.orderRequired");
        }
        if (
          modules.some(
            (mod) => mod.order === Number(value) && mod.id !== currentModule?.id
          )
        ) {
          return t("adminModulesPage.orderTaken");
        }
      }
      if (field === "requiredScore") {
        if (!value || isNaN(Number(value)) || Number(value) < 0) {
          return t("adminModulesPage.requiredScoreInvalid");
        }
      }
      return null;
    },
    [modules, currentModule, t]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    (["name", "languageId", "order", "requiredScore"] as const).forEach(
      (field) => {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }
    );
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleChange = (field: keyof typeof formData, value: string) => {
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

  const handleFilterChange = (field: "languageId" | "name", value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) {
      return;
    }

    try {
      const newModule = await ModuleAPI.createModule({
        ...formData,
        description: formData.description || undefined,
        order: Number(formData.order),
        requiredScore: Number(formData.requiredScore),
      });
      setModules([...modules, newModule].sort((a, b) => a.order - b.order));
      setTotalModules(totalModules + 1);
      closeAddModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminModulesPage.failedToCreateCategory")
      );
    }
  };

  const closeAddModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        description: "",
        languageId: "",
        order: "",
        requiredScore: "80",
      });
      setErrors({});
      setServerError("");
    }, 300);
  };

  const handleEditModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentModule || !validateForm()) {
      return;
    }

    try {
      const updateData: Partial<typeof formData> = {};
      if (formData.name !== currentModule.name) updateData.name = formData.name;
      if (formData.languageId !== currentModule.language.id)
        updateData.languageId = formData.languageId;
      if ((formData.description || "") !== (currentModule.description || ""))
        updateData.description = formData.description || undefined;

      if (Object.keys(updateData).length > 0) {
        const updatedModule = await ModuleAPI.updateModule(currentModule.id, {
          ...updateData,
          order: Number(formData.order),
          requiredScore: Number(formData.requiredScore),
        });
        setModules(
          modules
            .map((mod) => (mod.id === updatedModule.id ? updatedModule : mod))
            .sort((a, b) => a.order - b.order)
        );
      }
      closeEditModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminModulesPage.failedToUpdateCategory")
      );
    }
  };

  const closeEditModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsEditModalOpen(false);
      setCurrentModule(null);
      setFormData({
        name: "",
        description: "",
        languageId: "",
        order: "",
        requiredScore: "80",
      });
      setErrors({});
      setServerError("");
    }, 300);
  };

  const handleDeleteModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentModule) return;

    try {
      await ModuleAPI.deleteModule(currentModule.id);
      setModules(modules.filter((mod) => mod.id !== currentModule.id));
      setTotalModules(totalModules - 1);
      closeDeleteModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminModulesPage.failedToDeleteCategory")
      );
    }
  };

  const closeDeleteModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsDeleteModalOpen(false);
      setCurrentModule(null);
      setServerError("");
    }, 300);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) {
      return;
    }
    const reorderedCategories = [...modules];
    const [movedCategory] = reorderedCategories.splice(source.index, 1);
    reorderedCategories.splice(destination.index, 0, movedCategory);
    const changedOrders = reorderedCategories
      .map((mod, index) => {
        const newOrder = index + 1;
        return mod.order !== newOrder ? { id: mod.id, order: newOrder } : null;
      })
      .filter(Boolean) as { id: string; order: number }[];
    if (changedOrders.length === 0) {
      return;
    }
    const updatedModules = reorderedCategories.map((mod, index) => ({
      ...mod,
      order: index + 1,
    }));
    setModules(updatedModules);
    try {
      await ModuleAPI.updateModuleOrders(changedOrders);
    } catch (err) {
      const error = err as ApiError;
      setError(
        error.message || t("adminModulesPage.failedToUpdateModuleOrder")
      );
      const data = await ModuleAPI.getModules();
      setModules(data.modules.sort((a, b) => a.order - b.order));
    }
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
          {t("adminModulesPage.adminPanel")}
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mt-4 mb-6 space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <div className="relative flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("adminModulesPage.filterByLanguage")}
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
                          ? t("adminModulesPage.allLanguages")
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
                              {t("adminModulesPage.allLanguages")}
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
              {t("adminModulesPage.filterByName")}
            </label>
            <motion.input
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="text"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              placeholder={t("adminModulesPage.searchByNamePlaceholder")}
              className="w-48 sm:w-64 py-2.5 px-4 border border-gray-100 rounded-lg bg-white/90 font-poppins text-dark focus:outline-none focus:ring-2 focus:ring-accent shadow-sm transition-all duration-200"
            />
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("adminModulesPage.addCategory")}
            </label>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setFormData({
                  name: "",
                  description: "",
                  languageId: "",
                  order: String(modules.length + 1),
                  requiredScore: "80",
                });
                setErrors({});
                setServerError("");
                setIsAddModalOpen(true);
                setIsVisible(true);
              }}
              className="w-48 sm:w-64 bg-gradient-primary text-white py-2.75 px-4 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
            >
              {t("adminModulesPage.addCategory")}
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
              {t("adminModulesPage.loadingModules")}
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
        {!loading && !error && modules.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center text-dark font-poppins text-lg"
          >
            {t("adminModulesPage.noCategoriesAvailable")}
          </motion.div>
        )}
        {!loading && !error && modules.length > 0 && (
          <>
            {filters.languageId ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="modules">
                  {(provided) => (
                    <div
                      className="bg-white rounded-2xl shadow-xl"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gradient-primary text-white">
                            <th className="p-4 font-poppins font-semibold rounded-tl-lg">
                              {t("adminModulesPage.order")}
                            </th>
                            <th className="p-4 font-poppins font-semibold">
                              {t("adminModulesPage.name")}
                            </th>
                            <th className="p-4 font-poppins font-semibold">
                              {t("adminModulesPage.description")}
                            </th>
                            <th className="p-4 font-poppins font-semibold">
                              {t("adminModulesPage.language")}
                            </th>
                            <th className="p-4 font-poppins font-semibold">
                              {t("adminModulesPage.requiredScore")}
                            </th>
                            <th className="p-4 font-poppins font-semibold rounded-tr-lg">
                              {t("adminModulesPage.actions")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {modules.map((mod, index) => (
                            <Draggable
                              key={mod.id}
                              draggableId={mod.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <tr
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`border-t hover:bg-gray-50 cursor-move ${
                                    snapshot.isDragging ? "bg-gray-100" : ""
                                  }`}
                                >
                                  <td className="p-4 text-dark font-poppins">
                                    <ChevronUpDownIcon className="h-5 w-5 inline mr-2 text-gray-500" />
                                    {mod.order}
                                  </td>
                                  <td className="p-4 text-dark font-poppins">
                                    {mod.name}
                                  </td>
                                  <td className="p-4 text-dark font-poppins">
                                    {mod.description || "-"}
                                  </td>
                                  <td className="p-4 text-dark font-poppins">
                                    {mod.language.name}
                                  </td>
                                  <td className="p-4 text-dark font-poppins">
                                    {mod.requiredScore}
                                  </td>
                                  <td className="p-4 space-x-4">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        setCurrentModule(mod);
                                        setFormData({
                                          name: mod.name,
                                          description: mod.description || "",
                                          languageId: mod.language.id,
                                          order: String(mod.order),
                                          requiredScore: String(
                                            mod.requiredScore
                                          ),
                                        });
                                        setErrors({});
                                        setServerError("");
                                        setIsEditModalOpen(true);
                                        setIsVisible(true);
                                      }}
                                      className="text-accent hover:text-primary font-poppins font-medium hover:underline transition-all duration-200"
                                    >
                                      {t("adminModulesPage.edit")}
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        setCurrentModule(mod);
                                        setIsDeleteModalOpen(true);
                                        setIsVisible(true);
                                      }}
                                      className="text-red-600 hover:text-red-800 font-poppins font-medium hover:underline transition-all duration-200"
                                    >
                                      {t("adminModulesPage.delete")}
                                    </motion.button>
                                  </td>
                                </tr>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="bg-white/98 backdrop-blur-sm rounded-2xl shadow-lg"
              >
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gradient-primary text-white">
                      <th className="p-4 font-poppins font-semibold rounded-tl-lg">
                        {t("adminModulesPage.order")}
                      </th>
                      <th className="p-4 font-poppins font-semibold">
                        {t("adminModulesPage.name")}
                      </th>
                      <th className="p-4 font-poppins font-semibold">
                        {t("adminModulesPage.description")}
                      </th>
                      <th className="p-4 font-poppins font-semibold">
                        {t("adminModulesPage.language")}
                      </th>
                      <th className="p-4 font-poppins font-semibold">
                        {t("adminModulesPage.requiredScore")}
                      </th>
                      <th className="p-4 font-poppins font-semibold rounded-tr-lg">
                        {t("adminModulesPage.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((mod, index) => (
                      <motion.tr
                        key={mod.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="border-t border-gray-100 hover:bg-accent-opacity-10 transition-all duration-200"
                      >
                        <td className="p-4 text-dark font-poppins">
                          {mod.order}
                        </td>
                        <td className="p-4 text-dark font-poppins">
                          {mod.name}
                        </td>
                        <td className="p-4 text-dark font-poppins">
                          {mod.description || "-"}
                        </td>
                        <td className="p-4 text-dark font-poppins">
                          {mod.language.name}
                        </td>
                        <td className="p-4 text-dark font-poppins">
                          {mod.requiredScore}
                        </td>
                        <td className="p-4 space-x-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setCurrentModule(mod);
                              setFormData({
                                name: mod.name,
                                description: mod.description || "",
                                languageId: mod.language.id,
                                order: String(mod.order),
                                requiredScore: String(mod.requiredScore),
                              });
                              setErrors({});
                              setServerError("");
                              setIsEditModalOpen(true);
                              setIsVisible(true);
                            }}
                            className="text-accent hover:text-primary font-poppins font-medium hover:underline transition-all duration-200"
                          >
                            {t("adminModulesPage.edit")}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setCurrentModule(mod);
                              setIsDeleteModalOpen(true);
                              setIsVisible(true);
                            }}
                            className="text-red-600 hover:text-red-800 font-poppins font-medium hover:underline transition-all duration-200"
                          >
                            {t("adminModulesPage.delete")}
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
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
                {t("adminModulesPage.previous")}
              </motion.button>
              <span className="text-dark font-poppins">
                {t("adminModulesPage.pageInfo", {
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
                {t("adminModulesPage.next")}
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
              {t("adminModulesPage.addCategoryModalTitle")}
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
            <form onSubmit={handleAddModule} className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-2 space-y-4"
              >
                <FormInput
                  label={t("adminModulesPage.name")}
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                  placeholder={t("adminModulesPage.namePlaceholder")}
                />
                <FormInput
                  label={t("adminModulesPage.description")}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  error={errors.description}
                  placeholder={t("adminModulesPage.descriptionPlaceholder")}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <label className="block text-sm font-poppins font-bold text-dark mb-1">
                    {t("adminModulesPage.language")}
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
                                ? t("adminModulesPage.selectLanguage")
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
                                  {t("adminModulesPage.selectLanguage")}
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
                  label={t("adminModulesPage.order")}
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleChange("order", e.target.value)}
                  error={errors.order}
                  placeholder={t("adminModulesPage.orderPlaceholder")}
                />
                <FormInput
                  label={t("adminModulesPage.requiredScore")}
                  type="number"
                  value={formData.requiredScore}
                  onChange={(e) =>
                    handleChange("requiredScore", e.target.value)
                  }
                  error={errors.requiredScore}
                  placeholder={t("adminModulesPage.requiredScorePlaceholder")}
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
                  {t("adminModulesPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminModulesPage.add")}
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
              {t("adminModulesPage.editCategoryModalTitle")}
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
            <form onSubmit={handleEditModule} className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-2 space-y-4"
              >
                <FormInput
                  label={t("adminModulesPage.name")}
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                  placeholder={t("adminModulesPage.namePlaceholder")}
                />
                <FormInput
                  label={t("adminModulesPage.description")}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  error={errors.description}
                  placeholder={t("adminModulesPage.descriptionPlaceholder")}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <label className="block text-sm font-poppins font-bold text-dark mb-1">
                    {t("adminModulesPage.language")}
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
                                ? t("adminModulesPage.selectLanguage")
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
                                  {t("adminModulesPage.selectLanguage")}
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
                  label={t("adminModulesPage.order")}
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleChange("order", e.target.value)}
                  error={errors.order}
                  placeholder={t("adminModulesPage.orderPlaceholder")}
                />
                <FormInput
                  label={t("adminModulesPage.requiredScore")}
                  type="number"
                  value={formData.requiredScore}
                  onChange={(e) =>
                    handleChange("requiredScore", e.target.value)
                  }
                  error={errors.requiredScore}
                  placeholder={t("adminModulesPage.requiredScorePlaceholder")}
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
                  {t("adminModulesPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminModulesPage.save")}
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
              {t("adminModulesPage.confirmDeletionTitle")}
            </DialogTitle>
            <p className="mt-2 text-dark font-poppins">
              {t("adminModulesPage.confirmDeletionMessage", {
                name: currentModule?.name,
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
            <form onSubmit={handleDeleteModule} className="space-y-4">
              <div className="mt-6 flex justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-dark font-poppins font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {t("adminModulesPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-poppins font-semibold hover:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
                >
                  {t("adminModulesPage.delete")}
                </motion.button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminModulesPage;
