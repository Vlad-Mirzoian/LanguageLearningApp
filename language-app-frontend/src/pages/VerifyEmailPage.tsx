import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { verifyEmail } from "../services/api";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const isMounted = useRef(false);

  useEffect(() => {
    if (isMounted.current) return;

    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification token");
        return;
      }

      try {
        isMounted.current = true;
        await verifyEmail(token);
        setStatus("success");
        setMessage("Email verified successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error: any) {
        isMounted.current = true;
        setStatus("error");
        setMessage(error.response?.data?.error || "Verification failed");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Verify Your Email
        </h2>
        <div
          className={`p-3 text-sm rounded-lg text-center animate-fade-in ${
            status === "success"
              ? "bg-green-100 text-green-700"
              : status === "error"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {status === "loading" && (
            <div className="flex items-center mb-4">
              <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin" />
              <span className="ml-2 text-gray-600">Verifying...</span>
            </div>
          )}
          {status !== "loading" && message}
        </div>
        {status === "success" && (
          <p className="mt-4 text-center text-sm text-gray-600">
            You will be redirected to the login page shortly.
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Please try again or{" "}
            <a
              href="/register"
              className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors duration-200"
            >
              register
            </a>{" "}
            a new account.
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
