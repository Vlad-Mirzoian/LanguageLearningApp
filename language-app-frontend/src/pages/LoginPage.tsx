import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../components/ui/FormInput";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";
import type { ApiError } from "../types/index";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-poppins font-bold text-center text-primary mb-6">
          {t("loginPage.welcomeBack")}
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full bg-gradient-primary text-white py-3 px-4 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus-ring-accent shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {t("loginPage.login")}
            </button>
          </motion.div>
        </form>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mt-6 text-center text-sm text-dark font-poppins"
        >
          {t("loginPage.dontHaveAccount")}{" "}
          <Link
            to="/register"
            className="text-accent hover:text-primary font-semibold hover:underline transition-all duration-200"
          >
            {t("loginPage.register")}
          </Link>
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="mt-2 text-center text-sm text-dark font-poppins"
        >
          {t("loginPage.forgotPassword")}{" "}
          <Link
            to="/forgot-password"
            className="text-accent hover:text-primary font-semibold hover:underline transition-all duration-200"
          >
            {t("loginPage.reset")}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
