
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

function tokenFor(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    manager: user.manager || null,
  };
}

// Public registration is disabled.
// Accounts must be created by the administrator.
export async function register(req, res) {
  return res.status(403).json({
    message: "Public registration is disabled. Contact your administrator.",
  });
}

export async function login(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  // Password is excluded by default in the updated User model.
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (user.status !== "Active") {
    return res.status(403).json({ message: "Account is inactive. Contact your administrator." });
  }

  res.json({
    token: tokenFor(user),
    user: publicUser(user),
  });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current and new passwords are required.",
    });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({
      message: "The new password must contain at least 6 characters.",
    });
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ message: "Current password is incorrect." });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json({ message: "Password changed successfully." });
}

export async function forgotPassword(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await User.findOne({ email });

  // Do not reveal whether an account exists.
  if (!user) {
    return res.json({
      message: "If the account exists, password-reset instructions will be provided.",
    });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  user.resetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  // Development only: do not expose reset tokens in production.
  if (process.env.NODE_ENV !== "production") {
    return res.json({
      message: "Password reset token generated for development.",
      resetToken: rawToken,
    });
  }

  // Production should use an email provider to deliver the reset link.
  res.json({
    message: "If the account exists, password-reset instructions will be provided.",
  });
}

export async function resetPassword(req, res) {
  const token = String(req.body.token || "");
  const newPassword = String(req.body.newPassword || "");

  if (!token || newPassword.length < 6) {
    return res.status(400).json({
      message: "A valid token and a password of at least 6 characters are required.",
    });
  }

  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetToken: hashed,
    resetTokenExpires: { $gt: new Date() },
  }).select("+password +resetToken +resetTokenExpires");

  if (!user) {
    return res.status(400).json({
      message: "Invalid or expired reset token.",
    });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;

  await user.save();

  res.json({ message: "Password reset successfully." });
}

