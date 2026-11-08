import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Login using only email and password.
      // The backend will automatically identify the user's role.
      const user = await login(email, password);

      console.log("Logged in user:", user);
      console.log("User role:", user.role);

      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* Logo */}
        <div className="login-brand">
          <div className="login-logo">
            TF
          </div>

          <h1>TaskFlow</h1>

          <p>
            Task Monitoring & Collaboration System
          </p>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h2>Welcome Back</h2>

          <p>
            Sign in to continue to TaskFlow
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>

          {/* Email */}
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

          {/* Password */}
          <div className="login-form-group">

            <div className="password-label">
              <label>Password</label>

              <Link to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </div>

          {/* Remember Me */}
          <label className="remember-option">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>

          {/* Login Button */}
          <button
            type="submit"
            className="login-submit"
          >
            Login
          </button>

        </form>

        {/* Register */}
        <div className="register-section">

          <span>
            Don't have an account?
          </span>

          <Link to="/register">
            Create an account
          </Link>

        </div>

        {/* Admin Login */}
        <div className="admin-login-section">

          <span>Are you an administrator?</span>

          <Link to="/admin-login">
            Admin Login →
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

export default Login;