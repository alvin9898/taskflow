import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium"
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "On Hold", "Cancelled"],
    default: "Pending"
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  startDate: String,
  dueDate: String,
  tags: [String],
  attachment: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Task", taskSchema);