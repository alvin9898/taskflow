
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ")
      ? header.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing.");
      return res.status(500).json({
        message: "Authentication service is not configured.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the current user and current role from MongoDB.
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists.",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        message: "Account is inactive.",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name !== "JsonWebTokenError" &&
        error.name !== "TokenExpiredError" &&
        error.name !== "CastError") {
      console.error("Authentication error:", error.message);
    }

    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. You do not have permission to perform this action.",
      });
    }

    return next();
  };
}

