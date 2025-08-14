import { Link, useLocation } from "react-router-dom";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useAuth } from "../../hooks/useAuth";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Bars3Icon } from "@heroicons/react/24/solid";

const baseUrl = import.meta.env.VITE_BASE_URL || "";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getFullAvatarUrl = (
    avatar: string | null | undefined
  ): string | null => {
    if (!avatar) return null;
    return `${baseUrl}${avatar.startsWith("/") ? avatar : "/" + avatar}`;
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", current: false },
    ...(user?.role === "user"
      ? [
          { name: "Review", href: "/review", current: false },
          { name: "Statistics", href: "/stats", current: false },
        ]
      : []),
    ...(user?.role === "admin"
      ? [
          { name: "Languages", href: "/admin/languages", current: false },
          { name: "Categories", href: "/admin/categories", current: false },
          { name: "Words", href: "/admin/words", current: false },
          { name: "Cards", href: "/admin/cards", current: false },
        ]
      : []),
  ];

  const avatarUrl = getFullAvatarUrl(user?.avatar);

  return (
    <Disclosure
      as="nav"
      className="fixed top-0 left-0 right-0 z-50 bg-indigo-700 shadow-md"
    >
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  {/*
                  <img
                    className="h-8 w-auto"
                    src="language-learning-app\language-app-frontend\public\vite.svg"
                    alt="Langster Logo"
                  />
                  */}
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => {
                    const isCurrent = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                          isCurrent
                            ? "border-indigo-300 text-white"
                            : "border-transparent text-indigo-100 hover:border-indigo-200 hover:text-white"
                        }`}
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {user ? (
                  <div className="flex items-center space-x-4">
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
                    <button
                      onClick={logout}
                      className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <DisclosureButton className="inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-300">
                  {open ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </DisclosureButton>
              </div>
            </div>
          </div>
          <DisclosurePanel className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const isCurrent = location.pathname === item.href;
                return (
                  <DisclosureButton
                    key={item.name}
                    as={Link}
                    to={item.href}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isCurrent
                        ? "bg-indigo-700 border-indigo-300 text-white"
                        : "border-transparent text-indigo-100 hover:bg-indigo-700 hover:border-indigo-200 hover:text-white"
                    }`}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {item.name}
                  </DisclosureButton>
                );
              })}
              {user && (
                <>
                  <DisclosureButton
                    as={Link}
                    to="/profile"
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      location.pathname === "/profile"
                        ? "bg-indigo-700 border-indigo-300 text-white"
                        : "border-transparent text-indigo-100 hover:bg-indigo-700 hover:border-indigo-200 hover:text-white"
                    }`}
                    aria-current={
                      location.pathname === "/profile" ? "page" : undefined
                    }
                  >
                    Profile
                  </DisclosureButton>
                  <DisclosureButton
                    as="button"
                    onClick={logout}
                    className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-indigo-100 hover:bg-indigo-700 hover:border-indigo-200 hover:text-white"
                  >
                    Logout
                  </DisclosureButton>
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
