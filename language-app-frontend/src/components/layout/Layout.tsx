import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../../hooks/useAuth";
import { useState } from "react";

const Layout: React.FC = () => {
  const { isAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarWidth = isCollapsed ? 64 : 256;
  const navbarHeight = 64;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-grow" style={{ marginTop: navbarHeight }}>
        {!isAdmin && (
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        )}
        <div
          className="flex-grow transition-all duration-300"
          style={{
            marginLeft: !isAdmin ? sidebarWidth : 0,
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
