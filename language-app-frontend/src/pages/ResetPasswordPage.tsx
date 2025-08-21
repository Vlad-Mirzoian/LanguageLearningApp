import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormInput from "../components/ui/FormInput";
import { resetPassword } from "../services/api";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFormData({ password: "", confirmPassword: "" });
    setErrors({});
    setServerError("");
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!formData.password.trim()) {
      newErrors.password = t("resetPasswordPage.passwordRequired");
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = t("resetPasswordPage.passwordInvalid");
    }
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t(
        "resetPasswordPage.confirmPasswordRequired"
      );
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("resetPasswordPage.passwordsDoNotMatch");
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
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
      if (field === "password") {
        if (!value.trim()) {
          newErrors.password = t("resetPasswordPage.passwordRequired");
        } else if (!passwordRegex.test(value)) {
          newErrors.password = t("resetPasswordPage.passwordInvalid");
        } else {
          delete newErrors.password;
        }
      } else if (field === "confirmPassword") {
        const password =
          field === "confirmPassword" ? formData.password : value;
        if (!value.trim()) {
          newErrors.confirmPassword = t(
            "resetPasswordPage.confirmPasswordRequired"
          );
        } else if (value !== password) {
          newErrors.confirmPassword = t(
            "resetPasswordPage.passwordsDoNotMatch"
          );
        } else {
          delete newErrors.confirmPassword;
        }
      }
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!token) {
      setServerError(t("resetPasswordPage.invalidVerificationToken"));
      return;
    }
    if (!validateForm()) {
      return;
    }

    try {
      await resetPassword(token, { password: formData.password });
      setSuccessMessage(t("resetPasswordPage.passwordResetSuccessful"));
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error ||
            t("resetPasswordPage.failedToResetPassword")
        );
      } else {
        setServerError(t("resetPasswordPage.failedToResetPassword"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("resetPasswordPage.resetYourPassword")}
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
            label={t("resetPasswordPage.newPassword")}
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            placeholder={t("resetPasswordPage.enterNewPassword")}
          />
          <FormInput
            label={t("resetPasswordPage.confirmPassword")}
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
            placeholder={t("resetPasswordPage.confirmNewPassword")}
          />
          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {t("resetPasswordPage.reset")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          {t("resetPasswordPage.rememberedPassword")}{" "}
          <a
            href="/login"
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
          >
            {t("resetPasswordPage.login")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
