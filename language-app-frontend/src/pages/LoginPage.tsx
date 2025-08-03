import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import { login } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const validateField = useCallback(
    (field: keyof typeof formData, value: string): string | null => {
      if (field === "identifier" && typeof value === "string") {
        if (!value.trim()) return "Email or username is required";
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
          !/^[a-z0-9_]{6,}$/.test(value)
        )
          return "Invalid email or username format";
      }
      if (field === "password" && typeof value === "string") {
        if (!value.trim()) return "Password is required";
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
      const { user, token } = await login(formData);
      setAuth(user, token);
      navigate("/dashboard");
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Logging in failed";
      const details = error.response?.data?.details
        ? error.response.data.details.map((err: any) => err.message).join(", ")
        : "";
      setServerError(details ? `${errorMessage}: ${details}` : errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Welcome Back
        </h2>
        {serverError && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-2">
          <FormInput
            label="Email or username"
            type="text"
            value={formData.identifier}
            onChange={(e) => handleChange("identifier", e.target.value)}
            error={errors.identifier}
            placeholder="Enter your email or username"
          />
          <FormInput
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
            autoComplete="current-password"
            placeholder="Enter your password"
          />
          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Login
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            href="/register"
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
          >
            Register
          </a>
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          Forgot password?{" "}
          <a
            href="/forgot-password"
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
          >
            Reset
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
