import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

function tokenFor(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
}

export async function register(req, res) {
  const { name, email, password, role = "Team Member" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    name, email: email.toLowerCase(), password: hashed,
    role: ["Admin", "Manager", "Team Member"].includes(role) ? role : "Team Member"
  });

  res.status(201).json({
    token: tokenFor(user),
    user: publicUser(user)
  });
}

export async function login(req, res) {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!user || !(await bcrypt.compare(password || "", user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (role && role !== user.role && !(role === "Employee" && user.role === "Team Member")) {
    return res.status(403).json({ message: "Selected role does not match this account" });
  }

  if (user.status === "Inactive") {
    return res.status(403).json({ message: "Account is inactive" });
  }

  res.json({ token: tokenFor(user), user: publicUser(user) });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new passwords are required" });
  }

  const user = await User.findById(req.user._id);
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json({ message: "Password changed successfully" });
}

export async function forgotPassword(req, res) {
  const user = await User.findOne({ email: String(req.body.email || "").toLowerCase() });

  // Do not reveal whether an email exists.
  if (!user) {
    return res.json({ message: "If the account exists, a reset token has been generated." });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  // Development-friendly response. Replace with email delivery in production.
  res.json({
    message: "Password reset token generated.",
    resetToken: rawToken
  });
}

export async function resetPassword(req, res) {
  const hashed = crypto.createHash("sha256").update(req.body.token || "").digest("hex");
  const user = await User.findOne({
    resetToken: hashed,
    resetTokenExpires: { $gt: new Date() }
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

  user.password = await bcrypt.hash(req.body.newPassword, 12);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successfully" });
}