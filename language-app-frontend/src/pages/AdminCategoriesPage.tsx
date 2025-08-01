import { useCallback, useEffect, useState } from "react";
import type { Category } from "../types";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../services/api";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import FormInput from "../components/FormInput";

const AdminLanguagesPage: React.FC = () => {
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
  });
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (field === "name" && !value.trim()) {
        newErrors[field] = "Name is required";
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
      const newCategory = await createCategory(formData);
      setCategories([...categories, newCategory]);
      setIsAddModalOpen(false);
      setFormData({ name: "", description: "" });
      setErrors({});
      setServerError("");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to create category";
      const details = error.response?.data?.details
        ? error.response.data.details.map((err: any) => err.message).join(", ")
        : "";
      setServerError(details ? `${errorMessage}: ${details}` : errorMessage);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentCategory || !validateForm()) {
      return;
    }

    try {
      const updatedCategory = await updateCategory(
        currentCategory._id,
        formData
      );
      setCategories(
        categories.map((cat) =>
          cat._id === updatedCategory._id ? updatedCategory : cat
        )
      );
      setIsEditModalOpen(false);
      setCurrentCategory(null);
      setFormData({ name: "", description: "" });
      setErrors({});
      setServerError("");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to update category";
      const details = error.response?.data?.details
        ? error.response.data.details.map((err: any) => err.message).join(", ")
        : "";
      setServerError(details ? `${errorMessage}: ${details}` : errorMessage);
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
    } catch (error: any) {
      setServerError(
        error.response?.data?.error || "Failed to delete category"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          Admin Panel
        </h2>
        <div className="flex justify-center mt-4 mb-6">
          <button
            onClick={() => {
              setFormData({ name: "", description: "" });
              setErrors({});
              setServerError("");
              setIsAddModalOpen(true);
            }}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
          >
            Add Category
          </button>
        </div>
        {loading && (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-2 text-gray-600">Loading categories...</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center text-gray-600">
            No categories available.
          </div>
        )}
        {!loading && !error && categories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="p-4 font-semibold text-indigo-700">Name</th>
                  <th className="p-4 font-semibold text-indigo-700">
                    Description
                  </th>
                  <th className="p-4 font-semibold text-indigo-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat._id} className="border-t hover:bg-gray-50">
                    <td className="p-4 text-gray-800">{cat.name}</td>
                    <td className="p-4 text-gray-800">{cat.description}</td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setCurrentCategory(cat);
                          setFormData({
                            name: cat.name,
                            description: cat.description,
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
                          setCurrentCategory(cat);
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
          setFormData({ name: "", description: "" });
          setErrors({});
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              Add Category
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleAddCategory} className="space-y-2">
              <div className="mt-2 space-y-4">
                <FormInput
                  label="Name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                  placeholder="Greetings"
                />
                <FormInput
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  error={errors.description}
                  placeholder="Words for greetings and introductions"
                />
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormData({ name: "", description: "" });
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
          setCurrentCategory(null);
          setFormData({ name: "", description: "" });
          setErrors({});
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              Edit Category
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleEditCategory} className="space-y-2">
              <div className="mt-2 space-y-4">
                <FormInput
                  label="Name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                  placeholder="Greetings"
                />
                <FormInput
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  error={errors.description}
                  placeholder="Words for greetings and introductions"
                />
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setCurrentCategory(null);
                    setFormData({ name: "", description: "" });
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
          setCurrentCategory(null);
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
              Are you sure you want to delete the category "
              {currentCategory?.name}"? This will also remove related cards.
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

export default AdminLanguagesPage;
