import { Route, Routes } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
// import LoginPage from "./pages/LoginPage";
// import VerifyEmailPage from "./pages/VerifyEmailPage";
// import ForgotPasswordPage from "./pages/ForgotPasswordPage";
// import ResetPasswordPage from "./pages/ResetPasswordPage";
// import DashboardPage from "./pages/DashboardPage";
// import AdminPanelPage from "./pages/AdminPanelPage";
// import ReviewCardsPage from "./pages/ReviewCardsPage";
// import ProgressPage from "./pages/ProgressPage";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
}

export default App;
