import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { verifyEmail } from "../services/api";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

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
        await verifyEmail(token);
        setSuccess(t("verifyEmailPage.emailVerifiedSuccess"));
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error: unknown) {
        isMounted.current = true;
        if (error instanceof AxiosError) {
          setError(
            error.response?.data?.error ||
              t("verifyEmailPage.verificationFailed")
          );
        } else {
          setError(t("verifyEmailPage.verificationFailed"));
        }
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token, navigate, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {t("verifyEmailPage.verifyYourEmail")}
        </h2>
        <div
          className={`p-3 text-sm rounded-lg text-center animate-fade-in ${
            success
              ? "bg-green-100 text-green-700"
              : error
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {loading && (
            <div className="flex items-center mb-4">
              <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
              <span className="ml-2 text-gray-600">
                {t("verifyEmailPage.verifying")}
              </span>
            </div>
          )}
        </div>
        {success && (
          <p className="mt-4 text-center text-sm">
            {t("verifyEmailPage.redirectToLogin")}
          </p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm text-gray-600">
            {t("verifyEmailPage.tryAgainOrRegister")}{" "}
            <a
              href="/register"
              className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
            >
              {t("verifyEmailPage.register")}
            </a>{" "}
            {t("verifyEmailPage.newAccount")}
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
