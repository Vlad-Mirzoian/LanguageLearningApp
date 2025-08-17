import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/ui/FormInput";
import FormSelect from "../components/ui/FormSelect";
import { updateUser, uploadAvatar } from "../services/api";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import type { Language } from "../types";
import { useAuth } from "../hooks/useAuth";
import { AxiosError } from "axios";

interface FormData {
  email: string;
  username: string;
  password: string;
  nativeLanguageId: string;
  learningLanguagesIds: string[];
  avatarFile: File | null;
}

const baseUrl = import.meta.env.VITE_BASE_URL || "";

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
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
      const response = await api.get("/languages");
      return response.data;
    },
    enabled: true,
  });

  const validateField = useCallback(
    (field: keyof typeof formData, value: string | string[]): string | null => {
      if (field === "email" && typeof value === "string") {
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Invalid email format";
      }
      if (field === "username" && typeof value === "string") {
        if (!value.trim()) return "Username is required";
        if (!/^[a-z0-9_]{6,}$/.test(value)) {
          return "Username must be at least 6 characters and contain only lowercase letters, numbers, or underscores";
        }
      }
      if (field === "password" && typeof value === "string" && value.trim()) {
        if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value)) {
          return "Password must be at least 8 characters and contain a letter and a number";
        }
      }
      return null;
    },
    []
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
        updateData.nativeLanguageId = formData.nativeLanguageId || undefined;
      if (
        JSON.stringify(formData.learningLanguagesIds) !==
        JSON.stringify(user?.learningLanguagesIds)
      )
        updateData.learningLanguagesIds = formData.learningLanguagesIds.length
          ? formData.learningLanguagesIds
          : undefined;
      let avatarChanged = false;
      if (avatarFile) {
        if (avatarFile.size > 5 * 1024 * 1024) {
          setAvatarError("File size must be less than 5MB");
          return;
        }
        if (!["image/jpeg", "image/png"].includes(avatarFile.type)) {
          setAvatarError("Only JPEG and PNG images are allowed");
          return;
        }
        await uploadAvatar(avatarFile);
        avatarChanged = true;
      }
      if (Object.keys(updateData).length > 0) {
        const response = await updateUser(updateData);
        setUser(response.user);
      }
      if (!avatarChanged && Object.keys(updateData).length === 0) {
        setServerError("No changes to save");
        return;
      }
      setSuccessMessage("Profile updated successfully");
      setTimeout(() => {
        setSuccessMessage("");
        navigate("/dashboard");
      }, 3000);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setServerError(
          error.response?.data?.error || "Failed to update profile"
        );
      } else {
        setServerError("Failed to update profile");
      }
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
          Edit Profile
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
                alt="Avatar Preview"
                className="h-24 w-24 rounded-full object-cover border-2 border-indigo-300"
              />
            ) : (
              <img
                src="/images/default-avatar.png"
                alt="Avatar Preview"
                className="h-24 w-24 rounded-full object-cover border-2 border-indigo-300"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Picture
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
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            autoComplete="email"
            placeholder="Enter your email"
          />
          <FormInput
            label="Username"
            type="text"
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value)}
            error={errors.username}
            placeholder="Enter your username"
          />
          <FormInput
            label="Password (leave blank to keep current)"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            placeholder="Enter new password"
          />
          <FormSelect
            label="Native Language"
            value={formData.nativeLanguageId}
            onChange={(e) => handleChange("nativeLanguageId", e.target.value)}
            options={[{ value: "", label: "None" }, ...languageOptions]}
            error={errors.nativeLanguageId}
          />
          <FormSelect
            label="Learning Languages"
            multiple
            value={formData.learningLanguagesIds}
            onChange={(e) =>
              handleChange(
                "learningLanguagesIds",
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            options={[{ value: "", label: "None" }, ...filteredLearningOptions]}
            error={errors.learningLanguagesIds}
          />
          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Back to{" "}
          <a
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
          >
            Dashboard
          </a>
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
