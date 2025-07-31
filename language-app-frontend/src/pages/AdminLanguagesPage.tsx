import { useEffect, useState } from "react";
import type { Language } from "../types";
import {
  createLanguage,
  deleteLanguage,
  getLanguages,
  updateLanguage,
} from "../services/api";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

const AdminLanguagesPage: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const data = await getLanguages();
        setLanguages(data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load languages");
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  const handleAddLanguage = async () => {
    if (!formData.code || !formData.name) {
      setFormError("Code and name are required");
      return;
    }
    try {
      const newLanguage = await createLanguage(formData);
      setLanguages([...languages, newLanguage]);
      setIsAddModalOpen(false);
      setFormData({ code: "", name: "" });
      setFormError("");
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create language");
    }
  };

  const handleEditLanguage = async () => {
    if (!currentLanguage || !formData.code.trim() || !formData.name.trim()) {
      setFormError("Both code and name are required");
      return;
    }
    try {
      const updatedLanguage = await updateLanguage(
        currentLanguage._id,
        formData
      );
      setLanguages(
        languages.map((lang) =>
          lang._id === updatedLanguage._id ? updatedLanguage : lang
        )
      );
      setIsEditModalOpen(false);
      setCurrentLanguage(null);
      setFormData({ code: "", name: "" });
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
      setIsDeleteModalOpen(false);
      setCurrentLanguage(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete language");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Admin Panel
        </h2>
        <div className="flex justify-center mb-4">
          <button
            onClick={() => {
              setFormData({ code: "", name: "" });
              setFormError("");
              setIsAddModalOpen(true);
            }}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
          >
            Add Language
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
            <span className="ml-2 text-gray-600">Loading languages...</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading && !error && languages.length === 0 && (
          <div className="text-center text-gray-600">
            No languages available.
          </div>
        )}
        {!loading && !error && languages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="p-4 font-semibold text-indigo-700">Name</th>
                  <th className="p-4 font-semibold text-indigo-700">Code</th>
                  <th className="p-4 font-semibold text-indigo-700">Actions</th>
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
                          setFormData({
                            code: lang.code,
                            name: lang.name,
                          });
                          setFormError("");
                          setIsEditModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 mr-4 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setCurrentLanguage(lang);
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
      <Dialog open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
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
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
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
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., English"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
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
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
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
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
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
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., English"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
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
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
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
                onClick={() => setIsDeleteModalOpen(false)}
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
    </div>
  );
};

export default AdminLanguagesPage;
