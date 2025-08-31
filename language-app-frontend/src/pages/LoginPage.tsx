import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/ui/FormInput";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";
import type { ApiError } from "../types/index";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const validateField = useCallback(
    (field: keyof typeof formData, value: string): string | null => {
      if (field === "identifier" && typeof value === "string") {
        if (!value.trim()) return t("loginPage.identifierRequired");
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
          !/^[a-z0-9_]{6,}$/.test(value)
        )
          return t("loginPage.identifierInvalid");
      }
      if (field === "password" && typeof value === "string") {
        if (!value.trim()) return t("loginPage.passwordRequired");
        if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value)) {
          return t("loginPage.passwordInvalid");
        }
      }
      return null;
    },
    [t]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    (["identifier", "password"] as const).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.identifier, formData.password);
      navigate("/dashboard");
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("loginPage.loggingInFailed"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("loginPage.welcomeBack")}
        </h2>
        {serverError && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-2">
          <FormInput
            label={t("loginPage.emailOrUsername")}
            type="text"
            value={formData.identifier}
            onChange={(e) => handleChange("identifier", e.target.value)}
            error={errors.identifier}
            placeholder={t("loginPage.enterEmailOrUsername")}
          />
          <FormInput
            label={t("loginPage.password")}
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
            autoComplete="current-password"
            placeholder={t("loginPage.enterYourPassword")}
          />
          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {t("loginPage.login")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          {t("loginPage.dontHaveAccount")}{" "}
          <a
            href="/register"
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
          >
            {t("loginPage.register")}
          </a>
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t("loginPage.forgotPassword")}{" "}
          <a
            href="/forgot-password"
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
          >
            {t("loginPage.reset")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
