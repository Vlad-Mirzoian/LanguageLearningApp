import { Link, useLocation } from "react-router-dom";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { useAuth } from "../../hooks/useAuth";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { useInterfaceLanguage } from "../../hooks/useInterfaceLanguage";
import { Fragment, useEffect } from "react";
import { motion } from "framer-motion";

const baseUrl = import.meta.env.VITE_BASE_URL || "";

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { locale, availableLanguages, changeLanguage, loadAvailableLanguages } =
    useInterfaceLanguage();
  const location = useLocation();

  useEffect(() => {
    loadAvailableLanguages();
  }, [loadAvailableLanguages]);

  const getFullAvatarUrl = (
    avatar: string | null | undefined
  ): string | null => {
    if (!avatar) return null;
    return `${baseUrl}${avatar.startsWith("/") ? avatar : "/" + avatar}`;
  };

  const navigation = [
    ...(isAuthenticated
      ? [{ name: t("navbar.dashboard"), href: "/dashboard", current: false }]
      : []),
    ...(user?.role === "user"
      ? [
          { name: t("navbar.review"), href: "/review", current: false },
          { name: t("navbar.statistics"), href: "/stats", current: false },
          {
            name: t("navbar.leaderboard"),
            href: "/leaderboard",
            current: false,
          },
        ]
      : []),
    ...(user?.role === "admin"
      ? [
          {
            name: t("navbar.languages"),
            href: "/admin/languages",
            current: false,
          },
          {
            name: t("navbar.modules"),
            href: "/admin/modules",
            current: false,
          },
          { name: t("navbar.words"), href: "/admin/words", current: false },
          { name: t("navbar.cards"), href: "/admin/cards", current: false },
        ]
      : []),
  ];

  const avatarUrl = getFullAvatarUrl(user?.avatar);

  return (
    <Disclosure
      as="nav"
      className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-sm shadow-md"
    >
      {({ open }) => (
        <>
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex items-center px-15">
                  <h1 className="text-2xl font-bold text-primary tracking-tight">
                    Langster
                  </h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => {
                    const isCurrent = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-poppins font-medium tracking-tight ${
                          isCurrent
                            ? "border-accent text-primary"
                            : "border-transparent text-primary hover:text-accent hover:border-accent"
                        }`}
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="hidden px-15 sm:ml-6 sm:flex sm:items-center space-x-4">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="group rounded-lg transition-all duration-200 hover:bg-gray-100/50 hover:shadow-md active:bg-gray-200/50 active:shadow-sm">
                        <Listbox
                          value={locale || ""}
                          onChange={(value) => {
                            const selectedLang = availableLanguages.find(
                              (l) => l.code === value
                            );
                            if (selectedLang) {
                              changeLanguage(
                                selectedLang.code,
                                selectedLang.id
                              );
                            }
                          }}
                        >
                          {({ open }) => (
                            <>
                              <ListboxButton className="relative w-32 bg-gradient-primary text-white py-2 px-4 pr-8 rounded-lg font-poppins font-semibold hover:bg-gradient-primary-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent shadow-md">
                                <span className="block truncate">
                                  {availableLanguages.find(
                                    (l) => l.code === locale
                                  )?.name || t("navbar.selectLanguage")}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                  <ChevronDownIcon
                                    className="h-4 w-4 text-white"
                                    aria-hidden="true"
                                  />
                                </span>
                              </ListboxButton>
                              <Transition
                                as={Fragment}
                                show={open}
                                enter="transition ease-out duration-100"
                                enterFrom="transform scale-95 opacity-0"
                                enterTo="transform scale-100 opacity-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform scale-100 opacity-100"
                                leaveTo="transform scale-95 opacity-0"
                              >
                                <ListboxOptions className="absolute z-[1000] mt-1 max-h-60 w-32 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                                  {availableLanguages.map((lang) => (
                                    <ListboxOption
                                      key={lang.id}
                                      value={lang.code}
                                      className={({ selected }) =>
                                        `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                          selected
                                            ? "bg-primary text-white"
                                            : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                        }`
                                      }
                                    >
                                      {({ selected }) => (
                                        <span
                                          className={`block truncate ${
                                            selected
                                              ? "font-semibold"
                                              : "font-medium"
                                          }`}
                                        >
                                          {lang.name}
                                        </span>
                                      )}
                                    </ListboxOption>
                                  ))}
                                </ListboxOptions>
                              </Transition>
                            </>
                          )}
                        </Listbox>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link to="/profile" className="flex items-center">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="User avatar"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <img
                            src="/images/default-avatar.png"
                            alt="Default avatar"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={logout}
                        className="text-primary hover:text-accent px-3 py-2 rounded-lg text-sm font-poppins font-medium bg-primary-opacity-10 hover:bg-accent-opacity-20 transition-all duration-200"
                      >
                        {t("navbar.logout")}
                      </button>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex flex-row gap-4">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        to="/register"
                        className="bg-gradient-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200 flex items-center"
                      >
                        {t("navbar.signUp")}
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        to="/login"
                        className="bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200 flex items-center"
                      >
                        {t("navbar.signIn")}
                      </Link>
                    </motion.div>
                  </div>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <DisclosureButton className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:text-accent hover:bg-primary-opacity-10 focus:outline-none focus:ring-2 focus-ring-accent">
                    {open ? (
                      <XMarkIcon className="h-6 w-6" />
                    ) : (
                      <Bars3Icon className="h-6 w-6" />
                    )}
                  </DisclosureButton>
                </motion.div>
              </div>
            </div>
          </div>
          <DisclosurePanel className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1 bg-white/98 backdrop-blur-sm">
              {navigation.map((item) => {
                const isCurrent = location.pathname === item.href;
                return (
                  <motion.div
                    key={item.name}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DisclosureButton
                      as={Link}
                      to={item.href}
                      className={`block pl-3 pr-4 py-2 border-l-4 text-base font-poppins font-medium tracking-tight ${
                        isCurrent
                          ? "bg-primary-opacity-10 border-accent text-primary"
                          : "border-transparent text-primary hover:bg-accent-opacity-10 hover:border-accent hover:text-accent"
                      }`}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {item.name}
                    </DisclosureButton>
                  </motion.div>
                );
              })}
              <div className="block pl-3 pr-4 py-2 border-l-4 border-transparent">
                <Listbox
                  value={locale || ""}
                  onChange={(value) => {
                    const selectedLang = availableLanguages.find(
                      (l) => l.code === value
                    );
                    if (selectedLang) {
                      changeLanguage(selectedLang.code, selectedLang.id);
                    }
                  }}
                >
                  {({ open }) => (
                    <>
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ListboxButton className="relative w-full bg-primary-opacity-10 text-primary py-2 px-4 pr-8 rounded-lg font-poppins font-semibold hover:bg-primary-opacity-20 transition-all duration-200 focus:outline-none focus:ring-2 focus-ring-accent">
                          <span className="block truncate">
                            {availableLanguages.find((l) => l.code === locale)
                              ?.name || t("navbar.selectLanguage")}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDownIcon
                              className="h-4 w-4 text-primary"
                              aria-hidden="true"
                            />
                          </span>
                        </ListboxButton>
                      </motion.div>
                      <Transition
                        as={Fragment}
                        show={open}
                        enter="transition ease-out duration-100"
                        enterFrom="transform scale-95 opacity-0"
                        enterTo="transform scale-100 opacity-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform scale-100 opacity-100"
                        leaveTo="transform scale-95 opacity-0"
                      >
                        <ListboxOptions className="absolute mt-1 max-h-60 w-32 overflow-auto rounded-lg bg-white/98 backdrop-blur-sm py-1 text-base shadow-lg ring-1 ring-gray-100 focus:outline-none">
                          {availableLanguages.map((lang) => (
                            <ListboxOption
                              key={lang.id}
                              value={lang.code}
                              className={({ selected }) =>
                                `relative cursor-pointer select-none py-2 px-4 font-poppins font-medium transition-all duration-200 ${
                                  selected
                                    ? "bg-primary text-white"
                                    : "text-primary hover:bg-accent-opacity-10 hover:text-accent"
                                }`
                              }
                            >
                              {({ selected }) => (
                                <span
                                  className={`block truncate ${
                                    selected ? "font-semibold" : "font-medium"
                                  }`}
                                >
                                  {lang.name}
                                </span>
                              )}
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </Transition>
                    </>
                  )}
                </Listbox>
              </div>
              {user && (
                <>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DisclosureButton
                      as={Link}
                      to="/profile"
                      className={`block pl-3 pr-4 py-2 border-l-4 text-base font-poppins font-medium tracking-tight ${
                        location.pathname === "/profile"
                          ? "bg-primary-opacity-10 border-accent text-primary"
                          : "border-transparent text-primary hover:bg-accent-opacity-10 hover:border-accent hover:text-accent"
                      }`}
                      aria-current={
                        location.pathname === "/profile" ? "page" : undefined
                      }
                    >
                      {t("navbar.profile")}
                    </DisclosureButton>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DisclosureButton
                      as="button"
                      onClick={logout}
                      className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-poppins font-medium text-primary hover:bg-accent-opacity-10 hover:border-accent hover:text-accent"
                    >
                      {t("navbar.logout")}
                    </DisclosureButton>
                  </motion.div>
                </>
              )}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;
