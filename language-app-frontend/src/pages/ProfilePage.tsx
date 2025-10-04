import { useState, useCallback, useEffect, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../components/ui/FormInput";
import { useQuery } from "@tanstack/react-query";
import { LanguageAPI } from "../services/index";
import type { ApiError, Language } from "../types/index";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../hooks/useLanguage";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";

type FormData = {
  email: string;
  username: string;
  password: string;
  nativeLanguageId: string | null;
  learningLanguagesIds: string[];
  avatarFile: File | null;
};

const baseUrl = import.meta.env.VITE_BASE_URL || "";

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser, uploadUserAvatar, deleteUserAvatar } = useAuth();
  const { setSelectedLanguageId } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: user?.email || "",
    username: user?.username || "",
    password: "",
    nativeLanguageId: user?.nativeLanguageId ?? null,
    learningLanguagesIds: user?.learningLanguagesIds ?? [],
    avatarFile: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar ? `${baseUrl}${user.avatar}` : null
  );
  const [deleteAvatar, setDeleteAvatar] = useState(false);

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
        if (!value.trim()) return t("profilePage.emailRequired");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return t("profilePage.emailInvalid");
      }
      if (field === "username" && typeof value === "string") {
        if (!value.trim()) return t("profilePage.usernameRequired");
        if (!/^[a-z0-9_]{6,}$/.test(value)) {
          return t("profilePage.usernameInvalid");
        }
      }
      if (field === "password" && typeof value === "string" && value.trim()) {
        if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value)) {
          return t("profilePage.passwordInvalid");
        }
      }
      return null;
    },
    [t]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    (["email", "username", "password"] as const).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => {
      const newForm = { ...prev };
      if (field === "nativeLanguageId") {
        const nativeValue = value === "" ? null : value;
        newForm.nativeLanguageId = nativeValue as FormData["nativeLanguageId"];
        newForm.learningLanguagesIds = prev.learningLanguagesIds.filter(
          (id) => id !== nativeValue
        );
      } else if (field === "learningLanguagesIds" && Array.isArray(value)) {
        let arr = value as string[];
        if (arr.includes("")) {
          arr = [""];
        } else {
          arr = arr.filter((id) => id !== prev.nativeLanguageId && id !== "");
        }
        if (arr.length === 1 && arr[0] === "") {
          setSelectedLanguageId(null);
        }
        newForm.learningLanguagesIds = arr;
      } else {
        newForm[field] = value;
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarError("");
      setSuccessMessage("");

      const previewURL = URL.createObjectURL(file);
      setAvatarPreview(previewURL);
      setAvatarFile(file);
    }
  };

  const handleAvatarDelete = async () => {
    setAvatarError("");
    setSuccessMessage("");
    setDeleteAvatar(true);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    if (!validateForm()) return;
    try {
      const updateData: Partial<FormData> = {};
      let avatarChanged = false;

      if (deleteAvatar && !avatarFile && user?.avatar) {
        await deleteUserAvatar();
        avatarChanged = true;
      }

      if (avatarFile) {
        if (avatarFile.size > 5 * 1024 * 1024) {
          setAvatarError(t("profilePage.fileSizeError"));
          return;
        }
        if (!["image/jpeg", "image/png"].includes(avatarFile.type)) {
          setAvatarError(t("profilePage.fileTypeError"));
          return;
        }
        await uploadUserAvatar(avatarFile);
        avatarChanged = true;
      }

      if (formData.email !== user?.email) updateData.email = formData.email;
      if (formData.username !== user?.username)
        updateData.username = formData.username;
      if (formData.password) updateData.password = formData.password;
      if (formData.nativeLanguageId !== user?.nativeLanguageId) {
        updateData.nativeLanguageId = formData.nativeLanguageId;
      }
      if (
        JSON.stringify(
          formData.learningLanguagesIds.includes("")
            ? []
            : formData.learningLanguagesIds
        ) !== JSON.stringify(user?.learningLanguagesIds)
      ) {
        updateData.learningLanguagesIds =
          formData.learningLanguagesIds.includes("")
            ? []
            : formData.learningLanguagesIds;
      }
      if (Object.keys(updateData).length > 0) {
        await updateUser(updateData);
      }
      if (!avatarChanged && Object.keys(updateData).length === 0) {
        setServerError(t("profilePage.noChangesToSave"));
        return;
      }
      setSuccessMessage(t("profilePage.profileUpdatedSuccessfully"));
      setDeleteAvatar(false);
      setTimeout(() => {
        setSuccessMessage("");
        navigate("/dashboard");
      }, 3000);
    } catch (err) {
      const error = err as ApiError;
      setServerError(error.message || t("profilePage.failedToUpdateProfile"));
    }
  };

  useEffect(() => {
    setFormData({
      email: user?.email || "",
      username: user?.username || "",
      password: "",
      nativeLanguageId: user?.nativeLanguageId ?? null,
      learningLanguagesIds: user?.learningLanguagesIds ?? [],
      avatarFile: null,
    });
    setAvatarPreview(
      user?.avatar
        ? `${baseUrl}${
            user.avatar.startsWith("/") ? user.avatar : "/" + user.avatar
          }`
        : null
    );
    setErrors({});
    setServerError("");
    setSuccessMessage("");
    setAvatarError("");
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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
        className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-25"
      >
        <h2 className="text-3xl font-poppins font-bold text-center text-primary mb-6">
          {t("profilePage.editProfile")}
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex justify-center mb-6 relative"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={t("profilePage.profilePicture")}
                className="h-24 w-24 rounded-full object-cover border-2 border-accent"
              />
            ) : (
              <img
                src="/images/default-avatar.png"
                alt={t("profilePage.profilePicture")}
                className="h-24 w-24 rounded-full object-cover border-2 border-accent"
              />
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <label className="block text-sm font-poppins font-bold text-dark mb-1">
              {t("profilePage.profilePicture")}
            </label>
            <div className="flex flex-row">
              <input
                type="file"
                onChange={handleAvatarChange}
                accept="image/jpeg,image/png"
                className="block w-[90%] text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {avatarPreview && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleAvatarDelete}
                  className="p-2.5 ml-auto bg-primary text-white rounded-full hover:bg-primary-opacity-90 transition-all duration-200"
                  title={t("profilePage.deleteAvatar")}
                >
                  <XMarkIcon className="h-4 w-4" />
                </motion.button>
              )}
            </div>
            {avatarError && (
              <p className="mt-1 text-sm text-red-600 font-poppins">
                {avatarError}
              </p>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <FormInput
              label={t("profilePage.email")}
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
              autoComplete="email"
              placeholder={t("profilePage.enterYourEmail")}
            />
            <FormInput
              label={t("profilePage.username")}
              type="text"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
              error={errors.username}
              placeholder={t("profilePage.enterYourUsername")}
            />
            <FormInput
              label={t("profilePage.passwordLeaveBlank")}
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              error={errors.password}
              autoComplete="new-password"
              placeholder={t("profilePage.enterNewPassword")}
            />
          </motion.div>
          {user?.role === "user" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.3 }}
              >
                <label className="block text-sm font-poppins font-bold text-dark mb-1">
                  {t("profilePage.nativeLanguage")}
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
                        <ListboxButton className="relative w-full py-2.5 px-4 border border-gray-100 rounded-lg bg-white/90 font-poppins text-dark focus:outline-none focus:ring-2 focus:ring-accent shadow-sm transition-all duration-200">
                          <span className="block truncate">
                            {formData.nativeLanguageId === null
                              ? t("profilePage.selectLanguage")
                              : formData.nativeLanguageId === ""
                              ? t("profilePage.none")
                              : languageOptions.find(
                                  (option) =>
                                    option.value === formData.nativeLanguageId
                                )?.label}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDownIcon
                              className="h-4 w-4 text-dark"
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
                            { value: "", label: t("profilePage.none") },
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
                  {t("profilePage.learningLanguages")}
                </label>
                <Listbox
                  value={formData.learningLanguagesIds}
                  onChange={(value) =>
                    handleChange("learningLanguagesIds", value)
                  }
                  multiple
                >
                  {({ open }) => (
                    <>
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ListboxButton className="relative w-full py-2.5 px-4 border border-gray-100 rounded-lg bg-white/90 font-poppins text-dark focus:outline-none focus:ring-2 focus:ring-accent shadow-sm transition-all duration-200">
                          <span className="block truncate">
                            {formData.learningLanguagesIds.length > 0
                              ? formData.learningLanguagesIds
                                  .slice(0, 2)
                                  .map(
                                    (id) =>
                                      [
                                        {
                                          value: "",
                                          label: t("profilePage.none"),
                                        },
                                        ...filteredLearningOptions,
                                      ].find((option) => option.value === id)
                                        ?.label
                                  )
                                  .join(", ") +
                                  (formData.learningLanguagesIds.length > 2
                                    ? "..."
                                    : "") || t("profilePage.selectLanguages")
                              : t("profilePage.selectLanguages")}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDownIcon
                              className="h-4 w-4 text-dark"
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
                            { value: "", label: t("profilePage.none") },
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
            </>
          )}
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
              {t("profilePage.saveChanges")}
            </button>
          </motion.div>
        </form>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
          className="mt-6 text-center text-sm text-dark font-poppins"
        >
          {t("profilePage.backToDashboard")}{" "}
          <Link
            to="/dashboard"
            className="text-accent hover:text-primary font-semibold hover:underline transition-all duration-200"
          >
            {t("navbar.dashboard")}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
