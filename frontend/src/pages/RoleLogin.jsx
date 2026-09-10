import {
  Link,
  useNavigate,
} from "react-router-dom";

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
    await login(
      email,
      password,
      role
    );

    navigate("/dashboard");
  } catch (error) {
    alert(error.message);
  }
};

  const roleClass = role
    .toLowerCase()
    .replace(" ", "-");

  return (
    <div className={`role-login-page ${roleClass}`}>
      <div className="login-brand">
        <div className="brand-logo">TF</div>
        <h1>TaskFlow</h1>
        <p>Task Monitoring & Collaboration</p>
      </div>

      <div className="role-login-card">

        <div className="role-login-header">
          <div className="role-icon">
            {role === "Admin" && "🛡️"}
            {role === "Manager" && "👔"}
            {role === "Team Member" && "👨‍💻"}
          </div>

          <h2>{title}</h2>

          <p>{subtitle}</p>
        </div>

        <form onSubmit={handleLogin}>

          <div className="login-form-group">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input type="password"
  placeholder="Enter your password"
  value={password}
  onChange={(e) =>
    setPassword(e.target.value)
  }
  required
/>
          </div>

          <div className="login-form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>

            <Link to="/forgot-password">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="role-login-btn"
          >
            Login as {role}
          </button>

        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <div className="other-login">
          <p>Login as another role</p>

          <div className="role-links">

            {role !== "Admin" && (
              <Link to="/admin-login">
                Admin
              </Link>
            )}

            {role !== "Manager" && (
              <Link to="/manager-login">
                Manager
              </Link>
            )}

            {role !== "Team Member" && (
              <Link to="/employee-login">
                Employee
              </Link>
            )}

          </div>
        </div>

        <div className="register-link">
          <span>Don't have an account?</span>

          <Link to="/register">
            Create account
          </Link>
        </div>

      </div>

      <div className="login-footer">
        <span>© 2026 TaskFlow</span>
        <span>Secure Task Management</span>
      </div>
    </div>
  );
}

export default RoleLogin;