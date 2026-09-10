import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export async function listTasks(req, res) {
  const filter = {};
  if (req.query.status && req.query.status !== "All Status") filter.status = req.query.status;
  if (req.query.priority && req.query.priority !== "All Priorities") filter.priority = req.query.priority;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

  const tasks = await Task.find(filter)
    .populate("assignedBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });

  res.json({ tasks });
}

export async function getMyTasks(req, res) {
  const tasks = await Task.find({ assignedTo: req.user._id })
    .populate("assignedBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });
  res.json({ tasks });
}

export async function getTask(req, res) {
  const task = await Task.findById(req.params.id)
    .populate("assignedBy", "name email")
    .populate("assignedTo", "name email");

  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ task });
}

export async function createTask(req, res) {
  const { title, description, assignedTo, priority, startDate, dueDate, tags, attachment } = req.body;

  if (!title || !assignedTo) {
    return res.status(400).json({ message: "Title and assignee are required" });
  }

  const assignee = await User.findOne({
    $or: [
      { _id: assignedTo },
      { name: assignedTo }
    ]
  });

  if (!assignee) return res.status(400).json({ message: "Assignee not found" });

  if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
    return res.status(400).json({ message: "Due date cannot be before start date" });
  }

  const task = await Task.create({
    title: title.trim(),
    description: description?.trim() || "",
    assignedBy: req.user._id,
    assignedTo: assignee._id,
    priority: priority || "Medium",
    startDate: startDate || "",
    dueDate: dueDate || "",
    tags: Array.isArray(tags) ? tags : String(tags || "").split(",").map(x => x.trim()).filter(Boolean),
    attachment: attachment || ""
  });

  await Notification.create({
    user: assignee._id,
    type: "assignment",
    title: "New Task Assigned",
    message: `You have been assigned the task "${task.title}".`,
    taskId: task._id
  });

  const populated = await task.populate([
    { path: "assignedBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.status(201).json({ task: populated });
}

export async function updateTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const allowed = ["title","description","priority","status","progress","startDate","dueDate","tags","attachment"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) task[key] = req.body[key];
  }

  if (req.body.assignedTo !== undefined) {
    const assignee = await User.findOne({
      $or: [{ _id: req.body.assignedTo }, { name: req.body.assignedTo }]
    });
    if (!assignee) return res.status(400).json({ message: "Assignee not found" });
    task.assignedTo = assignee._id;
  }

  await task.save();

  const populated = await task.populate([
    { path: "assignedBy", select: "name email" },
    { path: "assignedTo", select: "name email" }
  ]);

  res.json({ task: populated });
}

export async function deleteTask(req, res) {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  await Notification.deleteMany({ taskId: task._id });
  res.json({ message: "Task deleted successfully" });
}