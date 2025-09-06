import { useCallback, useEffect, useState } from "react";
import type { ApiError, Module, Language } from "../types/index";
import { LanguageAPI, ModuleAPI } from "../services/index";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import FormInput from "../components/ui/FormInput";
import { ArrowPathIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";

const AdminCategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const [totalModules, setTotalModules] = useState(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
        setError(
          error.message || t("adminCategoriesPage.failedToLoadCategories")
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [filters, t]);

  const validateField = useCallback(
    (field: keyof typeof formData, value: string): string | null => {
      if (field === "name") {
        if (!value.trim()) return t("adminCategoriesPage.nameRequired");
      }
      if (field === "languageId") {
        if (!value.trim()) return t("adminCategoriesPage.languageRequired");
      }
      if (field === "order") {
        if (!value || isNaN(Number(value)) || Number(value) < 1) {
          return t("adminCategoriesPage.orderRequired");
        }
        if (
          modules.some(
            (mod) => mod.order === Number(value) && mod.id !== currentModule?.id
          )
        ) {
          return t("adminCategoriesPage.orderTaken");
        }
      }
      if (field === "requiredScore") {
        if (!value || isNaN(Number(value)) || Number(value) < 0) {
          return t("adminCategoriesPage.requiredScoreInvalid");
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) {
      return;
    }

    try {
      const newCategory = await ModuleAPI.createModule({
        ...formData,
        description: formData.description || undefined,
        order: Number(formData.order),
        requiredScore: Number(formData.requiredScore),
      });
      setModules([...modules, newCategory].sort((a, b) => a.order - b.order));
      setTotalModules(totalModules + 1);
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
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminCategoriesPage.failedToCreateCategory")
      );
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
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
        const updatedCategory = await ModuleAPI.updateModule(currentModule.id, {
          ...updateData,
          order: Number(formData.order),
          requiredScore: Number(formData.requiredScore),
        });
        setModules(
          modules
            .map((mod) =>
              mod.id === updatedCategory.id ? updatedCategory : mod
            )
            .sort((a, b) => a.order - b.order)
        );
      }
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
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminCategoriesPage.failedToUpdateCategory")
      );
    }
  };

  const handleDeleteCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentModule) return;

    try {
      await ModuleAPI.deleteModule(currentModule.id);
      setModules(modules.filter((mod) => mod.id !== currentModule.id));
      setTotalModules(totalModules - 1);
      setIsDeleteModalOpen(false);
      setCurrentModule(null);
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminCategoriesPage.failedToDeleteCategory")
      );
    }
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
    const updatedCategories = reorderedCategories.map((mod, index) => ({
      ...mod,
      order: index + 1,
    }));
    setModules(updatedCategories);
    try {
      await ModuleAPI.updateModuleOrders(changedOrders);
    } catch (err) {
      const error = err as ApiError;
      setError(
        error.message || t("adminCategoriesPage.failedToUpdateCategoryOrder")
      );
      const data = await ModuleAPI.getModules();
      setModules(data.modules.sort((a, b) => a.order - b.order));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          {t("adminCategoriesPage.adminPanel")}
        </h2>
        <div className="flex flex-col sm:flex-row justify-center items-end gap-8 mt-4 mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminCategoriesPage.filterByLanguage")}
            </label>
            <select
              value={filters.languageId}
              onChange={(e) => handleFilterChange("languageId", e.target.value)}
              className="w-full py-2.5 px-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">{t("adminCategoriesPage.allLanguages")}</option>
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminCategoriesPage.filterByName")}
            </label>
            <input
              type="name"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              placeholder={t("adminCategoriesPage.searchByNamePlaceholder")}
              className="w-full py-2.5 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <button
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
            }}
            className="bg-indigo-600 text-white py-2.5 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
          >
            {t("adminCategoriesPage.addCategory")}
          </button>
        </div>
        {loading && (
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">
              {t("adminCategoriesPage.loadingCategories")}
            </span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading && !error && modules.length === 0 && (
          <div className="text-center text-gray-600">
            {t("adminCategoriesPage.noCategoriesAvailable")}
          </div>
        )}
        {!loading && !error && modules.length > 0 && (
          <>
            {filters.languageId ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="modules">
                  {(provided) => (
                    <div
                      className="bg-white rounded-2xl shadow-xl overflow-x-auto"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-indigo-50">
                            <th className="p-4 font-semibold text-indigo-700">
                              {t("adminCategoriesPage.order")}
                            </th>
                            <th className="p-4 font-semibold text-indigo-700">
                              {t("adminCategoriesPage.name")}
                            </th>
                            <th className="p-4 font-semibold text-indigo-700">
                              {t("adminCategoriesPage.description")}
                            </th>
                            <th className="p-4 font-semibold text-indigo-700">
                              {t("adminCategoriesPage.language")}
                            </th>
                            <th className="p-4 font-semibold text-indigo-700">
                              {t("adminCategoriesPage.requiredScore")}
                            </th>
                            <th className="p-4 font-semibold text-indigo-700">
                              {t("adminCategoriesPage.actions")}
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
                                  <td className="p-4 text-gray-800">
                                    <ChevronUpDownIcon className="h-5 w-5 inline mr-2 text-gray-500" />
                                    {mod.order}
                                  </td>
                                  <td className="p-4 text-gray-800">
                                    {mod.name}
                                  </td>
                                  <td className="p-4 text-gray-800">
                                    {mod.description || "-"}
                                  </td>
                                  <td className="p-4 text-gray-800">
                                    {mod.language.name}
                                  </td>
                                  <td className="p-4 text-gray-800">
                                    {mod.requiredScore}
                                  </td>
                                  <td className="p-4">
                                    <button
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
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 mr-4 cursor-pointer"
                                    >
                                      {t("adminCategoriesPage.edit")}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCurrentModule(mod);
                                        setIsDeleteModalOpen(true);
                                      }}
                                      className="text-red-600 hover:text-red-800 cursor-pointer"
                                    >
                                      {t("adminCategoriesPage.delete")}
                                    </button>
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
              <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-indigo-50">
                      <th className="p-4 font-semibold text-indigo-700">
                        {t("adminCategoriesPage.order")}
                      </th>
                      <th className="p-4 font-semibold text-indigo-700">
                        {t("adminCategoriesPage.name")}
                      </th>
                      <th className="p-4 font-semibold text-indigo-700">
                        {t("adminCategoriesPage.description")}
                      </th>
                      <th className="p-4 font-semibold text-indigo-700">
                        {t("adminCategoriesPage.language")}
                      </th>
                      <th className="p-4 font-semibold text-indigo-700">
                        {t("adminCategoriesPage.requiredScore")}
                      </th>
                      <th className="p-4 font-semibold text-indigo-700">
                        {t("adminCategoriesPage.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((mod) => (
                      <tr key={mod.id} className="border-t hover:bg-gray-50">
                        <td className="p-4 text-gray-800">{mod.order}</td>
                        <td className="p-4 text-gray-800">{mod.name}</td>
                        <td className="p-4 text-gray-800">
                          {mod.description || "-"}
                        </td>
                        <td className="p-4 text-gray-800">
                          {mod.language.name}
                        </td>
                        <td className="p-4 text-gray-800">
                          {mod.requiredScore}
                        </td>
                        <td className="p-4">
                          <button
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
                            }}
                            className="text-indigo-600 hover:text-indigo-800 mr-4 cursor-pointer"
                          >
                            {t("adminCategoriesPage.edit")}
                          </button>
                          <button
                            onClick={() => {
                              setCurrentModule(mod);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                          >
                            {t("adminCategoriesPage.delete")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {t("adminCategoriesPage.previous")}
              </button>
              <span>
                {t("adminCategoriesPage.pageInfo", {
                  currentPage: filters.page,
                  totalPages,
                })}
              </span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === totalPages}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {t("adminCategoriesPage.next")}
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
            name: "",
            description: "",
            languageId: "",
            order: "",
            requiredScore: "80",
          });
          setErrors({});
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminCategoriesPage.addCategoryModalTitle")}
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleAddCategory} className="space-y-2">
              <div className="mt-2 space-y-4">
                <FormInput
                  label={t("adminCategoriesPage.name")}
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                  placeholder={t("adminCategoriesPage.namePlaceholder")}
                />
                <FormInput
                  label={t("adminCategoriesPage.description")}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  error={errors.description}
                  placeholder={t("adminCategoriesPage.descriptionPlaceholder")}
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t("adminCategoriesPage.language")}
                  </label>
                  <select
                    value={formData.languageId}
                    onChange={(e) => handleChange("languageId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">
                      {t("adminCategoriesPage.selectLanguage")}
                    </option>
                    {languages.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  {errors.languageId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.languageId}
                    </p>
                  )}
                </div>
                <FormInput
                  label={t("adminCategoriesPage.order")}
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleChange("order", e.target.value)}
                  error={errors.order}
                  placeholder={t("adminCategoriesPage.orderPlaceholder")}
                />
                <FormInput
                  label={t("adminCategoriesPage.requiredScore")}
                  type="number"
                  value={formData.requiredScore}
                  onChange={(e) =>
                    handleChange("requiredScore", e.target.value)
                  }
                  error={errors.requiredScore}
                  placeholder={t(
                    "adminCategoriesPage.requiredScorePlaceholder"
                  )}
                />
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
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
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminCategoriesPage.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminCategoriesPage.add")}
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
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminCategoriesPage.editCategoryModalTitle")}
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleEditCategory} className="space-y-2">
              <div className="mt-2 space-y-4">
                <FormInput
                  label={t("adminCategoriesPage.name")}
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                  placeholder={t("adminCategoriesPage.namePlaceholder")}
                />
                <FormInput
                  label={t("adminCategoriesPage.description")}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  error={errors.description}
                  placeholder={t("adminCategoriesPage.descriptionPlaceholder")}
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t("adminCategoriesPage.language")}
                  </label>
                  <select
                    value={formData.languageId}
                    onChange={(e) => handleChange("languageId", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  >
                    <option value="">
                      {t("adminCategoriesPage.selectLanguage")}
                    </option>
                    {languages.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  {errors.languageId && (
                    <p className="mt-1.5 text-xs text-red-500 animate-fade-in">
                      {errors.languageId}
                    </p>
                  )}
                </div>
                <FormInput
                  label={t("adminCategoriesPage.order")}
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleChange("order", e.target.value)}
                  error={errors.order}
                  placeholder={t("adminCategoriesPage.orderPlaceholder")}
                />
                <FormInput
                  label={t("adminCategoriesPage.requiredScore")}
                  type="number"
                  value={formData.requiredScore}
                  onChange={(e) =>
                    handleChange("requiredScore", e.target.value)
                  }
                  error={errors.requiredScore}
                  placeholder={t(
                    "adminCategoriesPage.requiredScorePlaceholder"
                  )}
                />
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
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
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminCategoriesPage.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminCategoriesPage.save")}
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
          setCurrentModule(null);
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminCategoriesPage.confirmDeletionTitle")}
            </DialogTitle>
            <p className="mt-2 text-gray-600">
              {t("adminCategoriesPage.confirmDeletionMessage", {
                name: currentModule?.name,
              })}
            </p>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleDeleteCategory} className="space-y-2">
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCurrentModule(null);
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminCategoriesPage.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 cursor-pointer"
                >
                  {t("adminCategoriesPage.delete")}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminCategoriesPage;
