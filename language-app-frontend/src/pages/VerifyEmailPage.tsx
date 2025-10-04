import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AuthAPI } from "../services/index";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import type { ApiError } from "../types/index";
import { motion } from "framer-motion";

const VerifyEmailPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isMounted = useRef(false); // to avoid double call to API

  useEffect(() => {
    if (isMounted.current) return;
    const verify = async () => {
      if (!token) {
        setError(t("verifyEmailPage.invalidVerificationToken"));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        isMounted.current = true;
        await AuthAPI.verifyEmail(token);
        setSuccess(t("verifyEmailPage.emailVerifiedSuccess"));
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (err) {
        isMounted.current = true;
        const error = err as ApiError;
        setError(error.message || t("verifyEmailPage.verificationFailed"));
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token, navigate, t]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-poppins font-bold text-center text-primary mb-6">
          {t("verifyEmailPage.verifyYourEmail")}
        </h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`p-3 text-sm rounded-lg text-center font-poppins animate-fade-in ${
            success
              ? "bg-green-50 text-green-600"
              : error
              ? "bg-red-50 text-red-600"
              : "bg-gray-50 text-dark"
          }`}
        >
          {loading && (
            <div className="flex items-center justify-center">
              <ArrowPathIcon className="h-5 w-5 text-primary animate-spin" />
              <span className="ml-2">{t("verifyEmailPage.verifying")}</span>
            </div>
          )}

          {!loading && success && <span>{success}</span>}
          {!loading && error && <span>{error}</span>}
        </motion.div>
        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="mt-4 text-center text-sm text-dark font-poppins"
          >
            {t("verifyEmailPage.redirectToLogin")}
          </motion.p>
        )}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="mt-4 text-center text-sm text-dark font-poppins"
          >
            {t("verifyEmailPage.tryAgainOrRegister")}{" "}
            <Link
              to="/register"
              className="text-accent hover:text-primary font-semibold hover:underline transition-all duration-200"
            >
              {t("verifyEmailPage.register")}
            </Link>{" "}
            {t("verifyEmailPage.newAccount")}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
