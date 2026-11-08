import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./RoleLogin.css";

function RoleLogin({ role, title, subtitle }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Login using ONLY email and password
      const data = await login(email, password);

      // Get the role saved in the user's account
      const userRole = data?.user?.role || data?.role;

      if (userRole === "Admin") {
        navigate("/dashboard");
      } else if (userRole === "Manager") {
        navigate("/dashboard");
      } else if (
        userRole === "Team Member" ||
        userRole === "Employee"
      ) {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="role-login-page">

      {/* BRAND */}
      <div className="login-brand">
        <div className="brand-logo">TF</div>

        <h1>TaskFlow</h1>

        <p>Task Monitoring & Collaboration System</p>
      </div>

      {/* LOGIN CARD */}
      <div className="role-login-card">

        <div className="role-login-header">

          <div className="role-icon">
            🔐
          </div>

          <h2>Welcome Back</h2>

          <p>Sign in to continue to TaskFlow</p>

        </div>

        <form onSubmit={handleLogin}>

          {/* EMAIL */}
          <div className="login-form-group">

            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </div>

          {/* PASSWORD */}
          <div className="login-form-group">

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </div>

          {/* OPTIONS */}
          <div className="login-options">

            <label className="remember-me">

              <input type="checkbox" />

              <span>Remember me</span>

            </label>

            <Link to="/forgot-password">
              Forgot password?
            </Link>

          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="role-login-btn"
          >
            Login
          </button>

        </form>

        {/* REGISTER */}
        <div className="register-link">

          <span>Don't have an account?</span>{" "}

          <Link to="/register">
            Create an account
          </Link>

        </div>

      </div>

      {/* FOOTER */}
      <div className="login-footer">

        <span>© 2026 TaskFlow</span>

        <span>Secure Task Management</span>

      </div>

    </div>
  );
}

export default RoleLogin;