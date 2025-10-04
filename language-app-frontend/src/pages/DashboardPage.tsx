import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-poppins font-bold text-center text-primary mb-6">
          {t("dashboardPage.welcomeToLangster")}
        </h2>
        {user && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center text-dark font-poppins text-lg mb-8"
          >
            {t("dashboardPage.greeting", { email: user.email })}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardPage;
