import { useCallback, useEffect, useState } from "react";
import type { ApiError, Language } from "../types/index";
import { LanguageAPI } from "../services/index";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import FormInput from "../components/ui/FormInput";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const AdminLanguagesPage: React.FC = () => {
  const { t } = useTranslation();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
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
      closeAddModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminLanguagesPage.failedToCreateLanguage")
      );
    }
  };

  const closeAddModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setFormData({ code: "", name: "" });
      setErrors({});
      setServerError("");
    }, 300);
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
          currentLanguage.id,
          updateData
        );
        setLanguages(
          languages.map((lang) =>
            lang.id === updatedLanguage.id ? updatedLanguage : lang
          )
        );
      }
      closeEditModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminLanguagesPage.failedToUpdateLanguage")
      );
    }
  };

  const closeEditModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsEditModalOpen(false);
      setCurrentLanguage(null);
      setFormData({ code: "", name: "" });
      setErrors({});
      setServerError("");
    }, 300);
  };

  const handleDeleteLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!currentLanguage) return;

    try {
      await LanguageAPI.deleteLanguage(currentLanguage.id);
      setLanguages(languages.filter((lang) => lang.id !== currentLanguage.id));
      closeDeleteModal();
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("adminLanguagesPage.failedToDeleteLanguage")
      );
    }
  };

  const closeDeleteModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsDeleteModalOpen(false);
      setCurrentLanguage(null);
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
          {t("adminLanguagesPage.adminPanel")}
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex justify-center mt-4 mb-6"
        >
          <div className="flex flex-col items-center w-full sm:w-auto">
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("adminLanguagesPage.addLanguage")}
            </label>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setFormData({ code: "", name: "" });
                setErrors({});
                setServerError("");
                setIsAddModalOpen(true);
                setIsVisible(true);
              }}
              className="w-48 sm:w-64 bg-gradient-primary text-white py-2.75 px-4 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
            >
              {t("adminLanguagesPage.addLanguage")}
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
              {t("adminLanguagesPage.loadingLanguages")}
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
        {!loading && !error && languages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center text-dark font-poppins text-lg"
          >
            {t("adminLanguagesPage.noLanguagesAvailable")}
          </motion.div>
        )}
        {!loading && !error && languages.length > 0 && (
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
                    {t("adminLanguagesPage.name")}
                  </th>
                  <th className="p-4 font-poppins font-semibold">
                    {t("adminLanguagesPage.code")}
                  </th>
                  <th className="p-4 font-poppins font-semibold rounded-tr-lg">
                    {t("adminLanguagesPage.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {languages.map((lang, index) => (
                  <motion.tr
                    key={lang.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="border-t border-gray-100 hover:bg-accent-opacity-10 transition-all duration-200"
                  >
                    <td className="p-4 text-dark font-poppins">{lang.name}</td>
                    <td className="p-4 text-dark font-poppins">{lang.code}</td>
                    <td className="p-4 space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setCurrentLanguage(lang);
                          setFormData({ code: lang.code, name: lang.name });
                          setErrors({});
                          setServerError("");
                          setIsEditModalOpen(true);
                          setIsVisible(true);
                        }}
                        className="text-accent hover:text-primary font-poppins font-medium hover:underline transition-all duration-200"
                      >
                        {t("adminLanguagesPage.edit")}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setCurrentLanguage(lang);
                          setIsDeleteModalOpen(true);
                          setIsVisible(true);
                        }}
                        className="text-red-600 hover:text-red-800 font-poppins font-medium hover:underline transition-all duration-200"
                      >
                        {t("adminLanguagesPage.delete")}
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
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
              {t("adminLanguagesPage.addLanguageModalTitle")}
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
            <form onSubmit={handleAddLanguage} className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-2 space-y-4"
              >
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
              </motion.div>
              <div className="mt-6 flex justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 text-dark font-poppins font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {t("adminLanguagesPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminLanguagesPage.add")}
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
              {t("adminLanguagesPage.editLanguageModalTitle")}
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
            <form onSubmit={handleEditLanguage} className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-2 space-y-4"
              >
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
              </motion.div>
              <div className="mt-6 flex justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-dark font-poppins font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {t("adminLanguagesPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("adminLanguagesPage.save")}
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
              {t("adminLanguagesPage.confirmDeletionTitle")}
            </DialogTitle>
            <p className="mt-2 text-dark font-poppins">
              {t("adminLanguagesPage.confirmDeletionMessage", {
                name: currentLanguage?.name,
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
            <form onSubmit={handleDeleteLanguage} className="space-y-4">
              <div className="mt-6 flex justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-dark font-poppins font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {t("adminLanguagesPage.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-poppins font-semibold hover:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
                >
                  {t("adminLanguagesPage.delete")}
                </motion.button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminLanguagesPage;
