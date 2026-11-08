import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

/* =========================================
   LIST USERS — ADMIN ONLY
   ========================================= */

export async function listUsers(req, res) {
  const users = await User.find()
    .select("-password -resetToken -resetTokenExpires")
    .populate("manager", "name email")
    .sort({ createdAt: 1 });

  res.json({ users });
}

/* =========================================
   CREATE USER — ADMIN ONLY
   ========================================= */

export async function createUser(req, res) {
  const { name, email, password, role, phone, designation } = req.body;

  if (!name?.trim() || !email?.trim() || !password || !role) {
    return res.status(400).json({
      message: "Name, email, password and role are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  if (!["Manager", "Team Member"].includes(role)) {
    return res.status(400).json({
      message: "Admin can create Manager or Team Member accounts only",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return res.status(409).json({
      message: "Email already registered",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone?.trim() || "",
    designation: designation?.trim() || "",
    role,
    status: "Active",
    manager: null,
  });

  res.status(201).json({
    message: `${role} account created successfully`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      designation: user.designation,
      role: user.role,
      status: user.status,
      manager: user.manager,
    },
  });
}

/* =========================================
   ASSIGN MANAGER — ADMIN ONLY
   ========================================= */

export async function assignManager(req, res) {
  const { managerId } = req.body;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: "Invalid employee ID",
    });
  }

  if (!mongoose.isValidObjectId(managerId)) {
    return res.status(400).json({
      message: "A valid manager ID is required",
    });
  }

  const employee = await User.findById(id);
  const manager = await User.findById(managerId);

  if (!employee) {
    return res.status(404).json({
      message: "Employee not found",
    });
  }

  if (employee.role !== "Team Member") {
    return res.status(400).json({
      message: "Only Team Member accounts can be assigned to a manager",
    });
  }

  if (!manager || manager.role !== "Manager") {
    return res.status(400).json({
      message: "Selected user is not a valid Manager",
    });
  }

  if (manager.status !== "Active") {
    return res.status(400).json({
      message: "Cannot assign an inactive manager",
    });
  }

  employee.manager = manager._id;
  await employee.save();

  res.json({
    message: "Manager assigned successfully",
    user: {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
      },
    },
  });
}

/* =========================================
   GET USER
   ========================================= */

export async function getUser(req, res) {
  const requestedUserId = String(req.params.id);
  const loggedInUserId = String(req.user._id);

  // Admin can view any user; others can view only themselves.
  if (
    requestedUserId !== loggedInUserId &&
    req.user.role !== "Admin"
  ) {
    return res.status(403).json({
      message: "You can only view your own profile",
    });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid user ID",
    });
  }

  const user = await User.findById(req.params.id)
    .select("-password -resetToken -resetTokenExpires")
    .populate("manager", "name email");

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  res.json({ user });
}

/* =========================================
   UPDATE USER
   ========================================= */

export async function updateUser(req, res) {
  const requestedUserId = String(req.params.id);
  const loggedInUserId = String(req.user._id);

  if (
    requestedUserId !== loggedInUserId &&
    req.user.role !== "Admin"
  ) {
    return res.status(403).json({
      message: "You can only update your own profile",
    });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid user ID",
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const { name, email, role, status, password, phone, designation } =
    req.body;

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Name cannot be empty",
      });
    }
    user.name = name.trim();
  }

  if (phone !== undefined) {
    user.phone = String(phone).trim();
  }

  if (designation !== undefined) {
    user.designation = String(designation).trim();
  }

  if (email !== undefined) {
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "A valid email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const duplicate = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });

    if (duplicate) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    user.email = normalizedEmail;
  }

  // Only Admin can change account role or status.
  if (req.user.role === "Admin") {
    if (role !== undefined) {
      if (!["Admin", "Manager", "Team Member"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
        });
      }

      // Prevent accidental removal of the only Admin.
      if (user.role === "Admin" && role !== "Admin") {
        const adminCount = await User.countDocuments({ role: "Admin" });

        if (adminCount <= 1) {
          return res.status(400).json({
            message: "You cannot remove the only Admin",
          });
        }
      }

      user.role = role;
    }

    if (status !== undefined) {
      if (!["Active", "Inactive"].includes(status)) {
        return res.status(400).json({
          message: "Invalid account status",
        });
      }

      user.status = status;
    }
  }

  if (password !== undefined && password !== "") {
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    user.password = await bcrypt.hash(password, 12);
  }

  await user.save();

  res.json({
    message: "User updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      designation: user.designation,
      role: user.role,
      status: user.status,
      manager: user.manager || null,
    },
  });
}

/* =========================================
   DELETE USER — ADMIN ONLY
   ========================================= */

export async function deleteUser(req, res) {
  if (String(req.user._id) === String(req.params.id)) {
    return res.status(400).json({
      message: "You cannot delete your own account",
    });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid user ID",
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (user.role === "Admin") {
    const adminCount = await User.countDocuments({ role: "Admin" });

    if (adminCount <= 1) {
      return res.status(400).json({
        message: "You cannot delete the only Admin",
      });
    }
  }

  // Unassign this manager's employees instead of deleting their accounts.
  if (user.role === "Manager") {
    await User.updateMany(
      { manager: user._id },
      { $set: { manager: null } }
    );
  }

  await User.findByIdAndDelete(user._id);

  res.json({
    message: "User deleted successfully",
  });
}

// Get Team Members assigned to the logged-in Manager
export async function getMyTeam(req, res) {
  try {
    if (req.user.role !== "Manager") {
      return res.status(403).json({
        message: "Access denied. Managers only.",
      });
    }

    const users = await User.find({
      manager: req.user._id,
      role: "Team Member",
    })
      .select("-password")
      .sort({ name: 1 });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Get my team error:", error);

    return res.status(500).json({
      message: "Failed to fetch team members.",
    });
  }
}
