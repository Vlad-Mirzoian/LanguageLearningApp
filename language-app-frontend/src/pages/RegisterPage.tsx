import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/ui/FormInput";
import FormSelect from "../components/ui/FormSelect";
import { LanguageAPI, AuthAPI } from "../services/index";
import { useQuery } from "@tanstack/react-query";
import type { ApiError, Language } from "../types/index";
import { useTranslation } from "react-i18next";

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    interfaceLanguageId: "",
    nativeLanguageId: "",
    learningLanguagesIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { data: languages } = useQuery<Language[]>({
    queryKey: ["languages"],
    queryFn: async () => {
      const response = await LanguageAPI.getLanguages();
      return response;
    },
    enabled: true,
  });

  const validateField = useCallback(
    (field: keyof typeof formData, value: string | string[]): string | null => {
      if (field === "email" && typeof value === "string") {
        if (!value.trim()) return t("registerPage.emailRequired");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return t("registerPage.emailInvalid");
      }
      if (field === "username" && typeof value === "string") {
        if (!value.trim()) return t("registerPage.usernameRequired");
        if (!/^[a-z0-9_]{6,}$/.test(value)) {
          return t("registerPage.usernameInvalid");
        }
      }
      if (field === "password" && typeof value === "string") {
        if (!value.trim()) return t("registerPage.passwordRequired");
        if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value)) {
          return t("registerPage.passwordInvalid");
        }
      }
      if (field === "interfaceLanguageId" && typeof value === "string") {
        if (!value.trim()) return t("registerPage.interfaceLanguageRequired");
      }
      return null;
    },
    [t]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    (["email", "username", "password", "interfaceLanguageId"] as const).forEach(
      (field) => {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
        }
      }
    );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) {
      return;
    }

    try {
      await AuthAPI.register({
        ...formData,
        nativeLanguageId: formData.nativeLanguageId || undefined,
        learningLanguagesIds: formData.learningLanguagesIds.length
          ? formData.learningLanguagesIds
          : undefined,
      });
      setSuccessMessage(t("registerPage.registrationSuccessful"));
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("registerPage.failedToRegister"));
    }
  };

  const languageOptions =
    languages?.map((lang) => ({
      value: lang._id,
      label: lang.name,
    })) || [];

  const filteredLearningOptions = languageOptions.filter(
    (option) => option.value !== formData.nativeLanguageId
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("registerPage.createYourAccount")}
        </h2>
        {serverError && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {serverError}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-3 bg-green-100 text-green-700 text-sm rounded-lg text-center animate-fade-in">
            {successMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <FormInput
            label={t("registerPage.email")}
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            autoComplete="email"
            placeholder={t("registerPage.enterYourEmail")}
          />
          <FormInput
            label={t("registerPage.username")}
            type="text"
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value)}
            error={errors.username}
            placeholder={t("registerPage.enterYourUsername")}
          />
          <FormInput
            label={t("registerPage.password")}
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            placeholder={t("registerPage.enterYourPassword")}
          />
          <FormSelect
            label={t("registerPage.interfaceLanguage")}
            value={formData.interfaceLanguageId}
            onChange={(e) =>
              handleChange("interfaceLanguageId", e.target.value)
            }
            options={languageOptions}
            error={errors.interfaceLanguageId}
          />
          <FormSelect
            label={t("registerPage.nativeLanguage")}
            value={formData.nativeLanguageId}
            onChange={(e) => handleChange("nativeLanguageId", e.target.value)}
            options={[
              { value: "", label: t("registerPage.none") },
              ...languageOptions,
            ]}
            error={errors.nativeLanguageId}
          />
          <FormSelect
            label={t("registerPage.learningLanguages")}
            multiple
            value={formData.learningLanguagesIds}
            onChange={(e) =>
              handleChange(
                "learningLanguagesIds",
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            options={[
              { value: "", label: t("registerPage.none") },
              ...filteredLearningOptions,
            ]}
            error={errors.learningLanguagesIds}
          />
          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {t("registerPage.register")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          {t("registerPage.alreadyHaveAccount")}{" "}
          <a
            href="/login"
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
          >
            {t("registerPage.login")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
