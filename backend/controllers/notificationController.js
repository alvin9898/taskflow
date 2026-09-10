import Notification from "../models/Notification.js";

export async function listNotifications(req, res) {
  const notifications = await Notification.find({ user: req.user._id })
    .populate("taskId", "title status")
    .sort({ createdAt: -1 });
  res.json({ notifications });
}

export async function markRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  res.json({ notification });
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: "All notifications marked as read" });
}

export async function deleteNotification(req, res) {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ message: "Notification deleted" });
}