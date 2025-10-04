import { useState, useCallback, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../components/ui/FormInput";
import { LanguageAPI, AuthAPI } from "../services/index";
import { useQuery } from "@tanstack/react-query";
import type { ApiError, Language } from "../types/index";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

type FormData = {
  email: string;
  username: string;
  password: string;
  interfaceLanguageId: string;
  nativeLanguageId: string | null;
  learningLanguagesIds: string[];
};

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    username: "",
    password: "",
    interfaceLanguageId: "",
    nativeLanguageId: null,
    learningLanguagesIds: [],
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

  const handleChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => {
      const newForm: FormData = { ...prev, [field]: value };
      if (field === "learningLanguagesIds") {
        const arr = value as FormData["learningLanguagesIds"];
        if (arr.includes("")) {
          newForm.learningLanguagesIds = [""];
        } else {
          newForm.learningLanguagesIds = arr.filter(
            (id) => id !== "" && id !== prev.nativeLanguageId
          );
        }
      }
      if (field === "nativeLanguageId") {
        const native = value as FormData["nativeLanguageId"];
        newForm.learningLanguagesIds = prev.learningLanguagesIds.filter(
          (id) => id !== native
        );
      }
      return newForm;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (typeof value === "string") {
        const error = validateField(field, value);
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
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
      await AuthAPI.register({
        ...formData,
        nativeLanguageId: formData.nativeLanguageId || undefined,
        learningLanguagesIds: formData.learningLanguagesIds.filter(
          (id) => id !== ""
        ).length
          ? formData.learningLanguagesIds.filter((id) => id !== "")
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
      value: lang.id,
      label: lang.name,
    })) || [];

  const filteredLearningOptions = languageOptions.filter(
    (option) => option.value !== formData.nativeLanguageId
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 my-20"
      >
        <h2 className="text-3xl font-poppins font-bold text-center text-primary mb-6">
          {t("registerPage.createYourAccount")}
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("registerPage.interfaceLanguage")}
            </label>
            <Listbox
              value={formData.interfaceLanguageId}
              onChange={(value) => handleChange("interfaceLanguageId", value)}
            >
              {({ open }) => (
                <>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ListboxButton className="relative w-96 bg-gradient-primary text-white py-3 px-4 pr-8 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus-ring-accent shadow-md">
                      <span className="block truncate">
                        {languageOptions.find(
                          (option) =>
                            option.value === formData.interfaceLanguageId
                        )?.label || t("registerPage.selectLanguage")}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDownIcon
                          className="h-4 w-4 text-white"
                          aria-hidden="true"
                        />
                      </span>
                    </ListboxButton>
                  </motion.div>
                  <Transition
                    as={Fragment}
                    show={open}
                    enter="transition ease-out duration-100"
                    enterFrom="transform scale-95"
                    enterTo="transform scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform scale-100"
                    leaveTo="transform scale-95"
                  >
                    <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-96 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                      {languageOptions.map((option) => (
                        <ListboxOption
                          key={option.value}
                          value={option.value}
                          className={({ selected }) =>
                            `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                              selected
                                ? "bg-primary text-white"
                                : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                            }`
                          }
                        >
                          {({ selected }) => (
                            <span
                              className={`block truncate ${
                                selected ? "font-semibold" : "font-medium"
                              }`}
                            >
                              {option.label}
                            </span>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </>
              )}
            </Listbox>
            {errors.interfaceLanguageId && (
              <p className="mt-1 text-sm text-red-600 font-poppins">
                {errors.interfaceLanguageId}
              </p>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("registerPage.nativeLanguage")}
            </label>
            <Listbox
              value={formData.nativeLanguageId}
              onChange={(value) => handleChange("nativeLanguageId", value)}
            >
              {({ open }) => (
                <>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ListboxButton className="relative w-96 bg-gradient-primary text-white py-3 px-4 pr-8 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus-ring-accent shadow-md">
                      <span className="block truncate">
                        {formData.nativeLanguageId === null
                          ? t("registerPage.selectLanguage")
                          : formData.nativeLanguageId === ""
                          ? t("registerPage.none")
                          : languageOptions.find(
                              (option) =>
                                option.value === formData.nativeLanguageId
                            )?.label}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDownIcon
                          className="h-4 w-4 text-white"
                          aria-hidden="true"
                        />
                      </span>
                    </ListboxButton>
                  </motion.div>
                  <Transition
                    as={Fragment}
                    show={open}
                    enter="transition ease-out duration-100"
                    enterFrom="transform scale-95"
                    enterTo="transform scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform scale-100"
                    leaveTo="transform scale-95"
                  >
                    <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-96 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                      {[
                        { value: "", label: t("registerPage.none") },
                        ...languageOptions,
                      ].map((option) => (
                        <ListboxOption
                          key={option.value}
                          value={option.value}
                          className={({ selected }) =>
                            `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                              selected
                                ? "bg-primary text-white"
                                : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                            }`
                          }
                        >
                          {({ selected }) => (
                            <span
                              className={`block truncate ${
                                selected ? "font-semibold" : "font-medium"
                              }`}
                            >
                              {option.label}
                            </span>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </>
              )}
            </Listbox>
            {errors.nativeLanguageId && (
              <p className="mt-1 text-sm text-red-600 font-poppins">
                {errors.nativeLanguageId}
              </p>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("registerPage.learningLanguages")}
            </label>
            <Listbox
              value={formData.learningLanguagesIds}
              onChange={(value) => handleChange("learningLanguagesIds", value)}
              multiple
            >
              {({ open }) => (
                <>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ListboxButton className="relative w-96 bg-gradient-primary text-white py-3 px-4 pr-8 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus-ring-accent shadow-md">
                      <span className="block truncate">
                        {formData.learningLanguagesIds.length > 0
                          ? formData.learningLanguagesIds
                              .slice(0, 2)
                              .map(
                                (id) =>
                                  [
                                    {
                                      value: "",
                                      label: t("registerPage.none"),
                                    },
                                    ...filteredLearningOptions,
                                  ].find((option) => option.value === id)?.label
                              )
                              .join(", ") +
                              (formData.learningLanguagesIds.length > 2
                                ? "..."
                                : "") || t("registerPage.selectLanguages")
                          : t("registerPage.selectLanguages")}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDownIcon
                          className="h-4 w-4 text-white"
                          aria-hidden="true"
                        />
                      </span>
                    </ListboxButton>
                  </motion.div>
                  <Transition
                    as={Fragment}
                    show={open}
                    enter="transition ease-out duration-100"
                    enterFrom="transform scale-95"
                    enterTo="transform scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform scale-100"
                    leaveTo="transform scale-95"
                  >
                    <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-96 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                      {[
                        { value: "", label: t("registerPage.none") },
                        ...filteredLearningOptions,
                      ].map((option) => (
                        <ListboxOption
                          key={option.value}
                          value={option.value}
                          className={({ selected }) =>
                            `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                              selected
                                ? "bg-primary text-white"
                                : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                            }`
                          }
                        >
                          {({ selected }) => (
                            <span
                              className={`block truncate ${
                                selected ? "font-semibold" : "font-medium"
                              }`}
                            >
                              {option.label}
                            </span>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </>
              )}
            </Listbox>
            {errors.learningLanguagesIds && (
              <p className="mt-1 text-sm text-red-600 font-poppins">
                {errors.learningLanguagesIds}
              </p>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <button
              type="submit"
              disabled={Object.keys(errors).length > 0}
              className="w-full bg-gradient-primary text-white py-3 px-4 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus-ring-accent shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {t("registerPage.register")}
            </button>
          </motion.div>
        </form>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
          className="mt-6 text-center text-sm text-dark font-poppins"
        >
          {t("registerPage.alreadyHaveAccount")}{" "}
          <Link
            to="/login"
            className="text-accent hover:text-primary font-semibold hover:underline transition-all duration-200"
          >
            {t("registerPage.login")}
          </Link>
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.3 }}
          className="mt-2 text-center text-sm text-dark font-poppins"
        >
          {t("registerPage.forgotPassword")}{" "}
          <Link
            to="/forgot-password"
            className="text-accent hover:text-primary font-semibold hover:underline transition-all duration-200"
          >
            {t("registerPage.reset")}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
