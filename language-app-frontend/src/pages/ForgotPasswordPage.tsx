import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/ui/FormInput";
import { forgotPassword } from "../services/api";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFormData({ email: "" });
    setErrors({});
    setServerError("");
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = t("forgotPasswordPage.emailRequired");
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t("forgotPasswordPage.emailInvalid");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (field === "email") {
        if (!value.trim()) {
          newErrors.email = t("forgotPasswordPage.emailRequired");
        } else if (!emailRegex.test(value)) {
          newErrors.email = t("forgotPasswordPage.emailInvalid");
        } else {
          delete newErrors.email;
        }
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
      await forgotPassword(formData);
      setSuccessMessage(t("forgotPasswordPage.resetEmailSent"));
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error ||
            t("forgotPasswordPage.failedToSendResetEmail")
        );
      } else {
        setServerError(t("forgotPasswordPage.failedToSendResetEmail"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("forgotPasswordPage.forgotPassword")}
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
        <form onSubmit={handleSubmit} className="space-y-2">
          <FormInput
            label={t("forgotPasswordPage.email")}
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            autoComplete="email"
            placeholder={t("forgotPasswordPage.enterYourEmail")}
          />
          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {t("forgotPasswordPage.forgot")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          {t("forgotPasswordPage.rememberedPassword")}{" "}
          <a
            href="/login"
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
          >
            {t("forgotPasswordPage.login")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
