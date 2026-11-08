
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    designation: {
      type: String,
      trim: true,
      default: "",
    },

    role: {
      type: String,
      enum: ["Admin", "Manager", "Team Member"],
      default: "Team Member",
      required: true,
    },

    // The manager responsible for this employee.
    // Existing records remain valid because this field is optional.
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      validate: {
        validator: async function (managerId) {
          if (!managerId) return true;

          const manager = await mongoose.model("User").findById(managerId);

          return manager && manager.role === "Manager";
        },
        message: "The assigned user must have the Manager role.",
      },
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      required: true,
    },

    resetToken: {
      type: String,
      default: undefined,
      select: false,
    },

    resetTokenExpires: {
      type: Date,
      default: undefined,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful for loading a manager's team.
userSchema.index({ manager: 1, role: 1 });

export default mongoose.model("User", userSchema);

