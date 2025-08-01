import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import { login } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    setFormData({ email: "", password: "" });
    setErrors({});
    setServerError("");
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters and contain a letter and a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

      if (field === "email") {
        if (!value.trim()) {
          newErrors.email = "Email is required";
        } else if (!emailRegex.test(value)) {
          newErrors.email = "Invalid email format";
        } else {
          delete newErrors.email;
        }
      } else if (field === "password") {
        if (!value.trim()) {
          newErrors.password = "Password is required";
        } else if (!passwordRegex.test(value)) {
          newErrors.password =
            "Password must be at least 8 characters and contain a letter and a number";
        } else {
          delete newErrors.password;
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
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            autoComplete="email"
            placeholder="Enter your email"
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
