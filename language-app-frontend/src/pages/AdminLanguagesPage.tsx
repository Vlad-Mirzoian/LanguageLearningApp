import { useCallback, useEffect, useState } from "react";
import type { ApiError, Language } from "../types/index";
import { LanguageAPI } from "../services/index";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import FormInput from "../components/ui/FormInput";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

const AdminLanguagesPage: React.FC = () => {
  const { t } = useTranslation();
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
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const data = await LanguageAPI.getLanguages();
        setLanguages(data);
      } catch (err) {
        const error = err as ApiError;
        setError(
          error.message || t("adminLanguagesPage.failedToLoadLanguages")
        );
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, [t]);

  const validateField = useCallback(
    (field: keyof typeof formData, value: string): string | null => {
      if (field === "code") {
        if (!value.trim()) return t("adminLanguagesPage.codeRequired");
      }
      if (field === "name") {
        if (!value.trim()) return t("adminLanguagesPage.nameRequired");
      }
      return null;
    },
    [t]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    (["code", "name"] as const).forEach((field) => {
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

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) {
      return;
    }

    try {
      const newLanguage = await LanguageAPI.createLanguage(formData);
      setLanguages([...languages, newLanguage]);
      setIsAddModalOpen(false);
      setFormData({ code: "", name: "" });
      setErrors({});
      setServerError("");
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminLanguagesPage.failedToCreateLanguage")
      );
    }
  };

  const handleEditLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentLanguage || !validateForm()) {
      return;
    }

    try {
      const updateData: Partial<typeof formData> = {};
      if (formData.code !== currentLanguage.code)
        updateData.code = formData.code;
      if (formData.name !== currentLanguage.name)
        updateData.name = formData.name;

      if (Object.keys(updateData).length > 0) {
        const updatedLanguage = await LanguageAPI.updateLanguage(
          currentLanguage._id,
          updateData
        );
        setLanguages(
          languages.map((lang) =>
            lang._id === updatedLanguage._id ? updatedLanguage : lang
          )
        );
      }
      setIsEditModalOpen(false);
      setCurrentLanguage(null);
      setFormData({ code: "", name: "" });
      setErrors({});
      setServerError("");
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminLanguagesPage.failedToUpdateLanguage")
      );
    }
  };

  const handleDeleteLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentLanguage) return;

    try {
      await LanguageAPI.deleteLanguage(currentLanguage._id);
      setLanguages(
        languages.filter((lang) => lang._id !== currentLanguage._id)
      );
      setIsDeleteModalOpen(false);
      setCurrentLanguage(null);
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminLanguagesPage.failedToDeleteLanguage")
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex justify-center p-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700">
          {t("adminLanguagesPage.adminPanel")}
        </h2>
        <div className="flex justify-center mt-4 mb-6">
          <button
            onClick={() => {
              setFormData({ code: "", name: "" });
              setErrors({});
              setServerError("");
              setIsAddModalOpen(true);
            }}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
          >
            {t("adminLanguagesPage.addLanguage")}
          </button>
        </div>
        {loading && (
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">
              {t("adminLanguagesPage.loadingLanguages")}
            </span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}
        {!loading && !error && languages.length === 0 && (
          <div className="text-center text-gray-600">
            {t("adminLanguagesPage.noLanguagesAvailable")}
          </div>
        )}
        {!loading && !error && languages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="p-4 font-semibold text-indigo-700">
                    {t("adminLanguagesPage.name")}
                  </th>
                  <th className="p-4 font-semibold text-indigo-700">
                    {t("adminLanguagesPage.code")}
                  </th>
                  <th className="p-4 font-semibold text-indigo-700">
                    {t("adminLanguagesPage.actions")}
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
                          setFormData({ code: lang.code, name: lang.name });
                          setErrors({});
                          setServerError("");
                          setIsEditModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 mr-4 cursor-pointer"
                      >
                        {t("adminLanguagesPage.edit")}
                      </button>
                      <button
                        onClick={() => {
                          setCurrentLanguage(lang);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        {t("adminLanguagesPage.delete")}
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
          setFormData({ code: "", name: "" });
          setErrors({});
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminLanguagesPage.addLanguageModalTitle")}
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleAddLanguage} className="space-y-2">
              <div className="mt-2 space-y-4">
                <FormInput
                  label={t("adminLanguagesPage.code")}
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  error={errors.code}
                  placeholder={t("adminLanguagesPage.codePlaceholder")}
                />
                <FormInput
                  label={t("adminLanguagesPage.name")}
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                  placeholder={t("adminLanguagesPage.namePlaceholder")}
                />
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormData({ code: "", name: "" });
                    setErrors({});
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminLanguagesPage.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminLanguagesPage.add")}
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
          setCurrentLanguage(null);
          setFormData({ code: "", name: "" });
          setErrors({});
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminLanguagesPage.editLanguageModalTitle")}
            </DialogTitle>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleEditLanguage} className="space-y-2">
              <div className="mt-2 space-y-4">
                <FormInput
                  label={t("adminLanguagesPage.code")}
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  error={errors.code}
                  placeholder={t("adminLanguagesPage.codePlaceholder")}
                />
                <FormInput
                  label={t("adminLanguagesPage.name")}
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                  placeholder={t("adminLanguagesPage.namePlaceholder")}
                />
              </div>
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setCurrentLanguage(null);
                    setFormData({ code: "", name: "" });
                    setErrors({});
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminLanguagesPage.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminLanguagesPage.save")}
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
          setCurrentLanguage(null);
          setServerError("");
        }}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <DialogTitle className="text-lg font-bold text-indigo-700">
              {t("adminLanguagesPage.confirmDeletionTitle")}
            </DialogTitle>
            <p className="mt-2 text-gray-600">
              {t("adminLanguagesPage.confirmDeletionMessage", {
                name: currentLanguage?.name,
              })}
            </p>
            {serverError && (
              <div className="mb-3 mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
                {serverError}
              </div>
            )}
            <form onSubmit={handleDeleteLanguage} className="space-y-2">
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCurrentLanguage(null);
                    setServerError("");
                  }}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {t("adminLanguagesPage.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 cursor-pointer"
                >
                  {t("adminLanguagesPage.delete")}
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
