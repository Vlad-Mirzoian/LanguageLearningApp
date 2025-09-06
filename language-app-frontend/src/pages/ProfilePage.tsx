import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/ui/FormInput";
import FormSelect from "../components/ui/FormSelect";
import { useQuery } from "@tanstack/react-query";
import { LanguageAPI } from "../services/index";
import type { ApiError, Language } from "../types/index";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../hooks/useLanguage";

interface FormData {
  email: string;
  username: string;
  password: string;
  nativeLanguageId: string | null;
  learningLanguagesIds: string[];
  avatarFile: File | null;
}

const baseUrl = import.meta.env.VITE_BASE_URL || "";

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser, uploadAvatar } = useAuth();
  const { setSelectedLanguageId } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: user?.email || "",
    username: user?.username || "",
    password: "",
    nativeLanguageId: user?.nativeLanguageId || "",
    learningLanguagesIds: user?.learningLanguagesIds || [],
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

  const handleChange = (
    field: keyof typeof formData,
    value: string | string[]
  ) => {
    setFormData((prev) => {
      let newValue: string | string[] | null;
      if (field === "nativeLanguageId" && value === "") {
        newValue = null;
      } else if (field === "learningLanguagesIds") {
        newValue = Array.isArray(value) ? value.filter(Boolean) : [];
        if (newValue.length === 0) {
          setSelectedLanguageId(null);
        }
      } else {
        newValue = value;
      }
      return { ...prev, [field]: newValue };
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    if (!validateForm()) return;
    try {
      const updateData: Partial<FormData> = {};
      if (formData.email !== user?.email) updateData.email = formData.email;
      if (formData.username !== user?.username)
        updateData.username = formData.username;
      if (formData.password) updateData.password = formData.password;
      if (formData.nativeLanguageId !== user?.nativeLanguageId)
        updateData.nativeLanguageId = formData.nativeLanguageId || null;
      if (
        JSON.stringify(formData.learningLanguagesIds) !==
        JSON.stringify(user?.learningLanguagesIds)
      )
        updateData.learningLanguagesIds = formData.learningLanguagesIds.length
          ? formData.learningLanguagesIds
          : [];
      let avatarChanged = false;
      if (avatarFile) {
        if (avatarFile.size > 5 * 1024 * 1024) {
          setAvatarError(t("profilePage.fileSizeError"));
          return;
        }
        if (!["image/jpeg", "image/png"].includes(avatarFile.type)) {
          setAvatarError(t("profilePage.fileTypeError"));
          return;
        }
        await uploadAvatar(avatarFile);
        avatarChanged = true;
      }
      if (Object.keys(updateData).length > 0) {
        await updateUser(updateData);
      }
      if (!avatarChanged && Object.keys(updateData).length === 0) {
        setServerError(t("profilePage.noChangesToSave"));
        return;
      }
      setSuccessMessage(t("profilePage.profileUpdatedSuccessfully"));
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
      nativeLanguageId: user?.nativeLanguageId || "",
      learningLanguagesIds: user?.learningLanguagesIds || [],
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("profilePage.editProfile")}
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-6">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={t("profilePage.profilePicture")}
                className="h-24 w-24 rounded-full object-cover border-2 border-indigo-300"
              />
            ) : (
              <img
                src="/images/default-avatar.png"
                alt={t("profilePage.profilePicture")}
                className="h-24 w-24 rounded-full object-cover border-2 border-indigo-300"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("profilePage.profilePicture")}
            </label>
            <input
              type="file"
              onChange={handleAvatarChange}
              accept="image/jpeg,image/png"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {avatarError && (
              <p className="mt-1 text-sm text-red-600">{avatarError}</p>
            )}
          </div>
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
          <FormSelect
            label={t("profilePage.nativeLanguage")}
            value={formData.nativeLanguageId ?? ""}
            onChange={(e) => handleChange("nativeLanguageId", e.target.value)}
            options={[
              { value: "", label: t("profilePage.none") },
              ...languageOptions,
            ]}
            error={errors.nativeLanguageId}
          />
          <FormSelect
            label={t("profilePage.learningLanguages")}
            multiple
            value={formData.learningLanguagesIds}
            onChange={(e) =>
              handleChange(
                "learningLanguagesIds",
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            options={[
              { value: "", label: t("profilePage.none") },
              ...filteredLearningOptions,
            ]}
            error={errors.learningLanguagesIds}
          />
          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {t("profilePage.saveChanges")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          {t("profilePage.backToDashboard")}{" "}
          <a
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
          >
            {t("navbar.dashboard")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
