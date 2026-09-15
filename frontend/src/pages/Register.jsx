import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();
const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Team Member",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

   try {
    await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role
    );

    alert("Account created successfully!");

    navigate("/dashboard");
  } catch (error) {
    alert(error.message);
  }
};

  return (
    <div className="register-page">

      <div className="register-card">

        {/* LOGO */}
        <div className="register-logo">
          <div className="register-logo-icon">✓</div>
          <span>TaskFlow</span>
        </div>

        {/* HEADER */}
        <div className="register-header">
          <h1>Create your account</h1>
          <p>
            Start managing your tasks and team efficiently.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="register-form"
        >

          {/* NAME */}
          <div className="register-group">
            <label htmlFor="name">
              Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* EMAIL */}
          <div className="register-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="register-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* ROLE */}
          <div className="register-group">
            <label htmlFor="role">
              Role
            </label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="Team Member">
                Team Member
              </option>

              <option value="Admin">
                Admin
              </option>

              <option value="Manager">
                Manager
              </option>
            </select>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            className="register-button"
          >
            Create Account
          </button>

        </form>

        {/* LOGIN */}
        <div className="register-login">
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </div>

      </div>

    </div>
  );
}