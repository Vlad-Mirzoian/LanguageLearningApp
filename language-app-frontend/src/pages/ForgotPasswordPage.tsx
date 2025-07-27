import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import { forgotPassword } from "../services/api";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
      await forgotPassword(formData);
      setSuccessMessage("Reset password email sent! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.details) {
        const validationErrors: any = {};
        error.response.data.details.forEach((err: any) => {
          validationErrors[err.field] = err.message;
        });
        setErrors((prev) => ({ ...prev, ...validationErrors }));
      } else {
        setServerError(
          error.response?.data?.error || "Failed to send reset email"
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-105">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Forgot Password
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
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            required
            autoComplete="email"
            placeholder="Enter your email"
          />
          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Forgot
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Remembered your password?{" "}
          <a
            href="/login"
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
