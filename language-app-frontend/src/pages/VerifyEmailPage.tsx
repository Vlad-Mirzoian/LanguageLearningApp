import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { verifyEmail } from "../services/api";

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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-105">
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
            <div className="flex justify-center items-center">
              <svg
                className="animate-spin h-5 w-5 text-indigo-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="ml-2">Verifying...</span>
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
