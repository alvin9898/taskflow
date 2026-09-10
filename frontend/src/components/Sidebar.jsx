import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        <h2>TaskFlow</h2>
      </div>


      {/* USER */}
      <div className="sidebar-user">

        <div className="sidebar-avatar">
          {user?.name?.charAt(0) || "U"}
        </div>

        <div>
          <strong>
            {user?.name || "User"}
          </strong>

          <p>
            {role || "Guest"}
          </p>
        </div>

      </div>


      {/* MENU */}
      <nav className="sidebar-menu">

        <Link to="/dashboard">
          Dashboard
        </Link>


        {(role === "Manager" ||
          role === "Admin") && (
          <>
            <Link to="/tasks">
              All Tasks
            </Link>

            <Link to="/tasks/create">
              Create Task
            </Link>
          </>
        )}


        <Link to="/my-tasks">
          My Tasks
        </Link>


        <Link to="/notifications">
          Notifications
        </Link>


        <Link to="/profile">
          Profile
        </Link>


        {role === "Admin" && (
          <Link to="/user-management">
            User Management
          </Link>
        )}


        {role === "Manager" && (
          <Link to="/workload">
            Team Workload
          </Link>
        )}

      </nav>


      {/* LOGOUT */}
      <button
        className="logout-btn"
        onClick={handleLogout}
      >
        Logout
      </button>

    </aside>
  );
}

export default Sidebar;