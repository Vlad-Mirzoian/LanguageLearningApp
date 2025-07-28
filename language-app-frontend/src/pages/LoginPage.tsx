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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      if (touched.email || isSubmitting) newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      if (touched.email || isSubmitting)
        newErrors.email = "Invalid email format";
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!formData.password) {
      if (touched.password || isSubmitting)
        newErrors.password = "Password is required";
    } else if (!passwordRegex.test(formData.password)) {
      if (touched.password || isSubmitting) {
        newErrors.password =
          "Password must be at least 8 characters and contain a letter and a number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, touched, isSubmitting]);

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setIsSubmitting(true);

    if (!validateForm()) {
      return;
    }

    try {
      const { user, token } = await login(formData);
      setAuth(user, token);
      navigate("/dashboard");
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.details) {
        const validationErrors: any = {};
        error.response.data.details.forEach((err: any) => {
          validationErrors[err.field] = err.message;
        });
        setErrors((prev) => ({ ...prev, ...validationErrors }));
      } else {
        setServerError(error.response?.data?.error || "Logging in failed");
      }
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
            required
            autoComplete="email"
            placeholder="Enter your email"
          />
          <FormInput
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
            required
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
