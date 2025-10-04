import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen backdrop-blur-sm flex flex-col items-center font-poppins text-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-white/95 rounded-2xl shadow-lg"
      >
        <section className="bg-gradient-primary from-primary to-accent text-white pt-8 sm:pt-12">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-5xl font-bold tracking-tight mb-4"
            >
              {t("landingPage.heroTitle")}
            </motion.h2>
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              src="/images/hero-illustration.png"
              alt="People learning languages around a globe"
              className="w-168 max-w-4xl mx-auto rounded-2xl"
            />
          </div>
        </section>
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center mb-12 sm:mb-16"
            >
              <div className="sm:w-1/2 mb-6 sm:mb-0 pl-40 pr-8 py-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4 tracking-tight">
                  {t("landingPage.flashcardsTitle")}
                </h3>
                <p className="text-dark text-base sm:text-lg mb-6">
                  {t("landingPage.flashcardsDescription")}
                </p>
                <motion.a
                  href="/register"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200 inline-flex items-center"
                >
                  {t("landingPage.tryNow")}
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </motion.a>
              </div>
              <div className="sm:w-1/2 mb-6 sm:mb-0 pr-40 pl-8 flex justify-center">
                <motion.img
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  src="/images/flashcards-illustration.png"
                  alt="Interactive flashcards interface"
                  className="w-120 rounded-2xl"
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row-reverse items-center mb-12 sm:mb-16"
            >
              <div className="sm:w-1/2 mb-6 sm:mb-0 pr-40 pl-8 py-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4 tracking-tight">
                  {t("landingPage.quizzesTitle")}
                </h3>
                <p className="text-dark text-base sm:text-lg mb-6">
                  {t("landingPage.quizzesDescription")}
                </p>
                <motion.a
                  href="/register"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200 inline-flex items-center"
                >
                  {t("landingPage.tryNow")}
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </motion.a>
              </div>
              <div className="sm:w-1/2 mb-6 sm:mb-0 pl-40 pr-8 flex justify-center">
                <motion.img
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  src="/images/quizzes-illustration.png"
                  alt="User taking a quiz on a computer"
                  className="w-96 rounded-2xl"
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center mb-12 sm:mb-16"
            >
              <div className="sm:w-1/2 mb-6 sm:mb-0 pl-40 pr-8 py-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4 tracking-tight">
                  {t("landingPage.progressTitle")}
                </h3>
                <p className="text-dark text-base sm:text-lg mb-6">
                  {t("landingPage.progressDescription")}
                </p>
                <motion.a
                  href="/register"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200 inline-flex items-center"
                >
                  {t("landingPage.tryNow")}
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </motion.a>
              </div>
              <div className="sm:w-1/2 mb-6 sm:mb-0 pr-40 pl-8 flex justify-center">
                <motion.img
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  src="/images/progress-illustration.png"
                  alt="Progress dashboard with charts and achievements"
                  className="w-96 rounded-2xl"
                />
              </div>
            </motion.div>
          </div>
        </section>
        <section className="bg-background/95 backdrop-blur-sm py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl font-bold text-primary mb-4 tracking-tight"
            >
              {t("landingPage.ctaTitle")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-dark text-base sm:text-lg mb-8 max-w-2xl mx-auto"
            >
              {t("landingPage.ctaDescription")}
            </motion.p>
            <motion.a
              href="/register"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-primary text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200 inline-flex items-center"
            >
              {t("landingPage.getStarted")}
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </motion.a>
          </div>
        </section>
        <footer className="bg-background/95 backdrop-blur-sm py-6">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <p className="text-dark text-sm">
              &copy; {new Date().getFullYear()} Langster.{" "}
              {t("landingPage.footerText")}
            </p>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

export default LandingPage;
