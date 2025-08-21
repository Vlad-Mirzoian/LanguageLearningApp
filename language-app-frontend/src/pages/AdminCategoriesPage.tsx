import { useCallback, useEffect, useState } from "react";
import type { Category } from "../types";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  updateCategoryOrders,
} from "../services/api";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import FormInput from "../components/ui/FormInput";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

const AdminCategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    order: "",
    requiredScore: "80",
  });
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getCategories();
        setCategories(data.sort((a, b) => a.order - b.order));
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          setError(
            error.response?.data?.error ||
              t("adminCategoriesPage.failedToLoadCategories")
          );
        } else {
          setError(t("adminCategoriesPage.failedToLoadCategories"));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [t]);

  const validateField = useCallback(
    (field: keyof typeof formData, value: string): string | null => {
      if (field === "name") {
        if (!value.trim()) return t("adminCategoriesPage.nameRequired");
      }
      if (field === "order") {
        if (!value || isNaN(Number(value)) || Number(value) < 1) {
          return t("adminCategoriesPage.orderRequired");
        }
        if (
          categories.some(
            (cat) =>
              cat.order === Number(value) && cat._id !== currentCategory?._id
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
    [categories, currentCategory, t]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    (["name", "order", "requiredScore"] as const).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) {
      return;
    }

    try {
      const newCategory = await createCategory({
        ...formData,
        description: formData.description || undefined,
        order: Number(formData.order),
        requiredScore: Number(formData.requiredScore),
      });
      setCategories(
        [...categories, newCategory].sort((a, b) => a.order - b.order)
      );
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        description: "",
        order: "",
        requiredScore: "80",
      });
      setErrors({});
      setServerError("");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error ||
            t("adminCategoriesPage.failedToCreateCategory")
        );
      } else {
        setServerError(t("adminCategoriesPage.failedToCreateCategory"));
      }
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentCategory || !validateForm()) {
      return;
    }

    try {
      const updateData: Partial<typeof formData> = {};
      if (formData.name !== currentCategory.name)
        updateData.name = formData.name;
      if ((formData.description || "") !== (currentCategory.description || ""))
        updateData.description = formData.description || undefined;

      if (Object.keys(updateData).length > 0) {
        const updatedCategory = await updateCategory(currentCategory._id, {
          ...updateData,
          order: Number(formData.order),
          requiredScore: Number(formData.requiredScore),
        });
        setCategories(
          categories
            .map((cat) =>
              cat._id === updatedCategory._id ? updatedCategory : cat
            )
            .sort((a, b) => a.order - b.order)
        );
      }
      setIsEditModalOpen(false);
      setCurrentCategory(null);
      setFormData({
        name: "",
        description: "",
        order: "",
        requiredScore: "80",
      });
      setErrors({});
      setServerError("");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error ||
            t("adminCategoriesPage.failedToUpdateCategory")
        );
      } else {
        setServerError(t("adminCategoriesPage.failedToUpdateCategory"));
      }
    }
  };

  const handleDeleteCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentCategory) return;

    try {
      await deleteCategory(currentCategory._id);
      setCategories(
        categories.filter((cat) => cat._id !== currentCategory._id)
      );
      setIsDeleteModalOpen(false);
      setCurrentCategory(null);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error ||
            t("adminCategoriesPage.failedToDeleteCategory")
        );
      } else {
        setServerError(t("adminCategoriesPage.failedToDeleteCategory"));
      }
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) {
      return;
    }
    const reorderedCategories = [...categories];
    const [movedCategory] = reorderedCategories.splice(source.index, 1);
    reorderedCategories.splice(destination.index, 0, movedCategory);
    const changedOrders = reorderedCategories
      .map((cat, index) => {
        const newOrder = index + 1;
        return cat.order !== newOrder ? { id: cat._id, order: newOrder } : null;
      })
      .filter(Boolean) as { id: string; order: number }[];
    if (changedOrders.length === 0) {
      return;
    }
    const updatedCategories = reorderedCategories.map((cat, index) => ({
      ...cat,
      order: index + 1,
    }));
    setCategories(updatedCategories);
    try {
      await updateCategoryOrders(changedOrders);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.error ||
            t("adminCategoriesPage.failedToUpdateCategoryOrder")
        );
      } else {
        setError(t("adminCategoriesPage.failedToUpdateCategoryOrder"));
      }
      const data = await getCategories();
      setCategories(data.sort((a, b) => a.order - b.order));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          {t("adminCategoriesPage.adminPanel")}
        </h2>
        <div className="flex justify-center mt-4 mb-6">
          <button
            onClick={() => {
              setFormData({
                name: "",
                description: "",
                order: String(categories.length + 1),
                requiredScore: "80",
              });
              setErrors({});
              setServerError("");
              setIsAddModalOpen(true);
            }}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
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
        {!loading && !error && categories.length === 0 && (
          <div className="text-center text-gray-600">
            {t("adminCategoriesPage.noCategoriesAvailable")}
          </div>
        )}
        {!loading && !error && categories.length > 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
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
                          {t("adminCategoriesPage.requiredScore")}
                        </th>
                        <th className="p-4 font-semibold text-indigo-700">
                          {t("adminCategoriesPage.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat, index) => (
                        <Draggable
                          key={cat._id}
                          draggableId={cat._id}
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
                                <svg
                                  className="h-5 w-5 inline mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                                  />
                                </svg>
                                {cat.order}
                              </td>
                              <td className="p-4 text-gray-800">{cat.name}</td>
                              <td className="p-4 text-gray-800">
                                {cat.description}
                              </td>
                              <td className="p-4 text-gray-800">
                                {cat.requiredScore}
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => {
                                    setCurrentCategory(cat);
                                    setFormData({
                                      name: cat.name,
                                      description: cat.description,
                                      order: String(cat.order),
                                      requiredScore: String(cat.requiredScore),
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
                                    setCurrentCategory(cat);
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
        )}
      </div>
      <Dialog
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormData({
            name: "",
            description: "",
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
          setCurrentCategory(null);
          setFormData({
            name: "",
            description: "",
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
                    setCurrentCategory(null);
                    setFormData({
                      name: "",
                      description: "",
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
          setCurrentCategory(null);
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
                name: currentCategory?.name,
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
                    setCurrentCategory(null);
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
