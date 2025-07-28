import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../services/api";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useEffect, useState } from "react";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ email: string; role?: string } | null>(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", current: false },
    { name: "Review", href: "/review", current: false },
    { name: "Progress", href: "/progress", current: false },
    ...(user?.role === "admin"
      ? [{ name: "Admin", href: "/admin", current: false }]
      : []),
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  return (
    <Disclosure as="nav" className="bg-indigo-600">
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
                  <button
                    onClick={handleLogout}
                    className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
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
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
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
                <DisclosureButton
                  as="button"
                  onClick={handleLogout}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-indigo-100 hover:bg-indigo-700 hover:border-indigo-200 hover:text-white"
                >
                  Logout
                </DisclosureButton>
              )}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;
