import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, default: "assignment" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);