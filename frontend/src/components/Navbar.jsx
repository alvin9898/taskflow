import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user } = useAuth();

  const userName = user?.name || "User";
  const userRole = user?.role || "Guest";

  return (
    <header className="navbar">
      <div className="navbar-title">
        <h2>Dashboard</h2>
      </div>

      <div className="navbar-right">

        <button
          className="notification-icon"
          onClick={() => {
            window.location.href = "/notifications";
          }}
        >
          🔔
        </button>

        <div className="navbar-user">
          <strong>{userName}</strong>
          <span>{userRole}</span>
        </div>

      </div>
    </header>
  );
}

export default Navbar;