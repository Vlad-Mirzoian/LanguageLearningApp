import { useEffect, useState } from "react";
import type { Category, Language } from "../types";
import {
  createCategory,
  createLanguage,
  deleteCategory,
  deleteLanguage,
  getCategories,
  getLanguages,
  updateCategory,
  updateLanguage,
} from "../services/api";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

const AdminPanelPage: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<"languages" | "categories">(
    "languages"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddLangModalOpen, setIsAddLangModalOpen] = useState(false);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [isEditLangModalOpen, setIsEditLangModalOpen] = useState(false);
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);
  const [isDeleteLangModalOpen, setIsDeleteLangModalOpen] = useState(false);
  const [isDeleteCatModalOpen, setIsDeleteCatModalOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [langFormData, setLangFormData] = useState({
    code: "",
    name: "",
  });
  const [catFormData, setCatFormData] = useState({
    name: "",
    description: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [langData, catData] = await Promise.all([
          getLanguages(),
          getCategories(),
        ]);
        setLanguages(langData);
        setCategories(catData);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddLanguage = async () => {
    if (!langFormData.code || !langFormData.name) {
      setFormError("Code and name are required");
      return;
    }
    try {
      const newLanguage = await createLanguage(langFormData);
      setLanguages([...languages, newLanguage]);
      setIsAddLangModalOpen(false);
      setLangFormData({ code: "", name: "" });
      setFormError("");
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create language");
    }
  };

  const handleEditLanguage = async () => {
    if (!currentLanguage || (!langFormData.code && !langFormData.name)) {
      setFormError("At least one field must be provided");
      return;
    }
    try {
      const updatedLanguage = await updateLanguage(
        currentLanguage._id,
        langFormData
      );
      setLanguages(
        languages.map((lang) =>
          lang._id === updatedLanguage._id ? updatedLanguage : lang
        )
      );
      setIsEditLangModalOpen(false);
      setCurrentLanguage(null);
      setLangFormData({ code: "", name: "" });
      setFormError("");
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to update language");
    }
  };

  const handleDeleteLanguage = async () => {
    if (!currentLanguage) return;
    try {
      await deleteLanguage(currentLanguage._id);
      setLanguages(
        languages.filter((lang) => lang._id !== currentLanguage._id)
      );
      setIsDeleteLangModalOpen(false);
      setCurrentLanguage(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete language");
    }
  };

  const handleAddCategory = async () => {
    if (!catFormData.name) {
      setFormError("Name is required");
      return;
    }
    try {
      const newCategory = await createCategory(catFormData);
      setCategories([...categories, newCategory]);
      setIsAddCatModalOpen(false);
      setCatFormData({ name: "", description: "" });
      setFormError("");
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create category");
    }
  };

  const handleEditCategory = async () => {
    if (!currentCategory || (!catFormData.name && !catFormData.description)) {
      setFormError("At least one field must be provided");
      return;
    }
    try {
      const updatedCategory = await updateCategory(
        currentCategory._id,
        catFormData
      );
      setCategories(
        categories.map((cat) =>
          cat._id === updatedCategory._id ? updatedCategory : cat
        )
      );
      setIsEditCatModalOpen(false);
      setCurrentCategory(null);
      setCatFormData({ name: "", description: "" });
      setFormError("");
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to update category");
    }
  };

  const handleDeleteCategory = async () => {
    if (!currentCategory) return;
    try {
      await deleteCategory(currentCategory._id);
      setCategories(
        categories.filter((cat) => cat._id !== currentCategory._id)
      );
      setIsDeleteCatModalOpen(false);
      setCurrentCategory(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete category");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Admin Panel
        </h2>
        <div>
          <button
            onClick={() => setActiveTab("languages")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "languages"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors duration-200`}
          >
            Languages
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "categories"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors duration-200`}
          >
            Categories
          </button>
        </div>
        <div className="flex justify-center mb-4">
          {activeTab === "languages" && (
            <button
              onClick={() => {
                setLangFormData({ code: "", name: "" });
                setFormError("");
                setIsAddLangModalOpen(true);
              }}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
            >
              Add Language
            </button>
          )}
          {activeTab === "categories" && (
            <button
              onClick={() => {
                setCatFormData({ name: "", description: "" });
                setFormError("");
                setIsAddCatModalOpen(true);
              }}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
            >
              Add Category
            </button>
          )}
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
            <span className="ml-2 text-gray-600">Loading {activeTab}...</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading &&
          !error &&
          activeTab === "languages" &&
          languages.length === 0 && (
            <div className="text-center text-gray-600">
              No languages available.
            </div>
          )}
        {!loading &&
          !error &&
          activeTab === "categories" &&
          categories.length === 0 && (
            <div className="text-center text-gray-600">
              No categories available.
            </div>
          )}
        {!loading &&
          !error &&
          activeTab === "languages" &&
          languages.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="p-4 font-semibold text-indigo-700">Name</th>
                    <th className="p-4 font-semibold text-indigo-700">Code</th>
                    <th className="p-4 font-semibold text-indigo-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {languages.map((lang) => (
                    <tr key={lang._id} className="border-t hover:bg-gray-50">
                      <td className="p-4 text-gray-800">{lang.name}</td>
                      <td className="p-4 text-gray-800">{lang.code}</td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setCurrentLanguage(lang);
                            setLangFormData({
                              code: lang.code,
                              name: lang.name,
                            });
                            setFormError("");
                            setIsEditLangModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 mr-4 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setCurrentLanguage(lang);
                            setIsDeleteLangModalOpen(true);
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
        {!loading &&
          !error &&
          activeTab === "categories" &&
          categories.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="p-4 font-semibold text-indigo-700">Name</th>
                    <th className="p-4 font-semibold text-indigo-700">
                      Description
                    </th>
                    <th className="p-4 font-semibold text-indigo-700">
                      Actions
                    </th>
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
                            setCatFormData({
                              name: cat.name,
                              description: cat.description,
                            });
                            setFormError("");
                            setIsEditCatModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 mr-4 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setCurrentCategory(cat);
                            setIsDeleteCatModalOpen(true);
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
      <Dialog open={isAddLangModalOpen} onClose={() => setIsAddLangModalOpen(false)}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              Add Language
            </DialogTitle>
            {formError && (
              <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded-lg">
                {formError}
              </div>
            )}
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Code
                </label>
                <input
                  type="text"
                  value={langFormData.code}
                  onChange={(e) =>
                    setLangFormData({ ...langFormData, code: e.target.value })
                  }
                  placeholder="e.g., en"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={langFormData.name}
                  onChange={(e) =>
                    setLangFormData({ ...langFormData, name: e.target.value })
                  }
                  placeholder="e.g., English"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setIsAddLangModalOpen(false)}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLanguage}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                Add
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog open={isEditLangModalOpen} onClose={() => setIsEditLangModalOpen(false)}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              Edit Language
            </DialogTitle>
            {formError && (
              <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded-lg">
                {formError}
              </div>
            )}
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Code
                </label>
                <input
                  type="text"
                  value={langFormData.code}
                  onChange={(e) =>
                    setLangFormData({ ...langFormData, code: e.target.value })
                  }
                  placeholder="e.g., en"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={langFormData.name}
                  onChange={(e) =>
                    setLangFormData({ ...langFormData, name: e.target.value })
                  }
                  placeholder="e.g., English"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setIsEditLangModalOpen(false)}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEditLanguage}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                Save
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog
        open={isDeleteLangModalOpen}
        onClose={() => setIsDeleteLangModalOpen(false)}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              Confirm Deletion
            </DialogTitle>
            <p></p>
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setIsDeleteLangModalOpen(false)}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLanguage}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog open={isAddCatModalOpen} onClose={() => setIsAddCatModalOpen(false)}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              Add Category
            </DialogTitle>
            {formError && (
              <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded-lg">
                {formError}
              </div>
            )}
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={catFormData.name}
                  onChange={(e) =>
                    setCatFormData({ ...catFormData, name: e.target.value })
                  }
                  placeholder="Greetings"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={catFormData.description}
                  onChange={(e) =>
                    setCatFormData({
                      ...catFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Words for greetings and introductions"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setIsAddCatModalOpen(false)}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                Add
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog open={isEditCatModalOpen} onClose={() => setIsEditCatModalOpen(false)}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              Edit Category
            </DialogTitle>
            {formError && (
              <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded-lg">
                {formError}
              </div>
            )}
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={catFormData.name}
                  onChange={(e) =>
                    setCatFormData({ ...catFormData, name: e.target.value })
                  }
                  placeholder="Greetings"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={catFormData.description}
                  onChange={(e) =>
                    setCatFormData({
                      ...catFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Words for greetings and introductions"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setIsEditCatModalOpen(false)}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCategory}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                Save
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog
        open={isDeleteCatModalOpen}
        onClose={() => setIsDeleteCatModalOpen(false)}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              Confirm Deletion
            </DialogTitle>
            <p></p>
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setIsDeleteCatModalOpen(false)}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminPanelPage;
