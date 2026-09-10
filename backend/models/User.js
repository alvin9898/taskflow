import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    phone: {
      type: String,
      trim: true,
      default: ""
    },

    designation: {
      type: String,
      trim: true,
      default: ""
    },

    role: {
      type: String,
      enum: [
        "Admin",
        "Manager",
        "Team Member"
      ],
      default: "Team Member"
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Inactive"
      ],
      default: "Active"
    },

    resetToken: String,

    resetTokenExpires: Date

  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "User",
  userSchema
);