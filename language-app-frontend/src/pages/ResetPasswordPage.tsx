import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormInput from "../components/FormInput";
import { resetPassword } from "../services/api";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

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

    if (!formData.confirmPassword) {
      if (touched.confirmPassword || isSubmitting) {
        newErrors.confirmPassword = "Confirm password is required";
      }
    } else if (formData.password !== formData.confirmPassword) {
      if (touched.confirmPassword || isSubmitting) {
        newErrors.confirmPassword = "Passwords do not match";
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

    if (!token) {
      setServerError("Invalid verification token");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      await resetPassword(token, { password: formData.password });
      setSuccessMessage("Password reset successfuly! Redirecting to login...");
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
          error.response?.data?.error || "Failed to reset password"
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-105">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Reset Your Password
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
            label="New Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
            required
            autoComplete="new-password"
            placeholder="Enter new password"
          />
          <FormInput
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
            placeholder="Confirm new password"
          />
          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Reset
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

export default ResetPasswordPage;
