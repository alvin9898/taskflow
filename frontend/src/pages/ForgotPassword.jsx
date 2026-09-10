import { useState } from "react";
import { Link } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="forgot-page">
      <div className="forgot-box">
        <h1>TaskFlow</h1>

        <h2>Forgot Password?</h2>

        {!submitted ? (
          <>
            <p className="forgot-subtitle">
              Enter your email address and we'll help you reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="reset-request-btn">
                Send Reset Link
              </button>
            </form>
          </>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>

            <h3>Check Your Email</h3>

            <p>
              If an account exists for <strong>{email}</strong>, a
              password reset link has been sent.
            </p>

            <Link to="/reset-password" className="continue-btn">
              Continue to Reset Password
            </Link>
          </div>
        )}

        <p className="back-login">
          <Link to="/login">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;