import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormInput from "../components/ui/FormInput";
import { AuthAPI } from "../services/index";
import { useTranslation } from "react-i18next";
import type { ApiError } from "../types/index";
import { motion } from "framer-motion";

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
      await AuthAPI.resetPassword(token, { password: formData.password });
      setSuccessMessage(t("resetPasswordPage.passwordResetSuccessful"));
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      const error = err as ApiError;
      setServerError(
        error.message || t("resetPasswordPage.failedToResetPassword")
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-poppins font-bold text-center text-primary mb-6">
          {t("resetPasswordPage.resetYourPassword")}
        </h2>
        {serverError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center animate-fade-in"
          >
            {serverError}
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6 p-3 bg-green-50 text-green-600 text-sm rounded-lg text-center animate-fade-in"
          >
            {successMessage}
          </motion.div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <button
              type="submit"
              disabled={Object.keys(errors).length > 0}
              className="w-full bg-gradient-primary text-white py-3 px-4 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus-ring-accent shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {t("resetPasswordPage.reset")}
            </button>
          </motion.div>
        </form>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mt-6 text-center text-sm text-dark font-poppins"
        >
          {t("resetPasswordPage.rememberedPassword")}{" "}
          <Link
            to="/login"
            className="text-accent hover:text-primary font-semibold hover:underline transition-all duration-200"
          >
            {t("resetPasswordPage.login")}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
