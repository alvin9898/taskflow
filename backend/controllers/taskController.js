import mongoose from "mongoose";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

/* =========================================
   HELPER: CHECK TASK ACCESS
   ========================================= */

async function canAccessTask(user, task) {
  if (user.role === "Admin") {
    return true;
  }

  const userId = String(user._id);

  const assignedToId = String(
    task.assignedTo?._id || task.assignedTo
  );

  const assignedById = String(
    task.assignedBy?._id || task.assignedBy
  );

  // Users can access tasks assigned to them or created by them.
  if (
    assignedToId === userId ||
    assignedById === userId
  ) {
    return true;
  }

  // Managers can access tasks assigned to their own team members.
  if (user.role === "Manager") {
    const teamMember = await User.exists({
      _id: assignedToId,
      manager: user._id,
      role: "Team Member",
    });

    return Boolean(teamMember);
  }

  return false;
}

/* =========================================
   LIST TASKS
   Admin: all tasks
   Manager: their team's tasks
   Team Member: own tasks
   ========================================= */

export async function listTasks(req, res) {
  const filter = {};

  if (
    req.query.status &&
    req.query.status !== "All Status"
  ) {
    filter.status = req.query.status;
  }

  if (
    req.query.priority &&
    req.query.priority !== "All Priorities"
  ) {
    filter.priority = req.query.priority;
  }

  // Manager task filtering
  if (req.user.role === "Manager") {
    const teamMembers = await User.find({
      manager: req.user._id,
      role: "Team Member",
    }).select("_id");

    const teamIds = teamMembers.map(
      (member) => member._id
    );

    filter.$or = [
      { assignedTo: { $in: teamIds } },
      { assignedBy: req.user._id },
      { assignedTo: req.user._id },
    ];
  } else if (req.user.role !== "Admin") {
    // Team Members can view tasks assigned to them
    // or created by them.
    filter.$or = [
      { assignedTo: req.user._id },
      { assignedBy: req.user._id },
    ];
  }

  // Validate an optional assignee filter.
  if (req.query.assignedTo) {
    if (
      !mongoose.isValidObjectId(
        req.query.assignedTo
      )
    ) {
      return res.status(400).json({
        message: "Invalid assignee ID",
      });
    }

    const requestedAssigneeId = String(
      req.query.assignedTo
    );

    // Managers can filter only their own tasks
    // or tasks assigned to their team members.
    if (req.user.role === "Manager") {
      const isSelf =
        requestedAssigneeId ===
        String(req.user._id);

      const isTeamMember = await User.exists({
        _id: requestedAssigneeId,
        manager: req.user._id,
        role: "Team Member",
      });

      if (!isSelf && !isTeamMember) {
        return res.status(403).json({
          message:
            "You cannot view tasks outside your team",
        });
      }
    } else if (
      req.user.role !== "Admin" &&
      requestedAssigneeId !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "You can only view your own tasks",
      });
    }

    filter.assignedTo = requestedAssigneeId;
  }

  const tasks = await Task.find(filter)
    .populate("assignedBy", "name email role")
    .populate("assignedTo", "name email role")
    .sort({ createdAt: -1 });

  return res.json({ tasks });
}

/* =========================================
   MY TASKS
   ========================================= */

export async function getMyTasks(req, res) {
  const tasks = await Task.find({
    $or: [
      { assignedTo: req.user._id },
      { assignedBy: req.user._id },
    ],
  })
    .populate("assignedBy", "name email role")
    .populate("assignedTo", "name email role")
    .sort({ createdAt: -1 });

  return res.json({ tasks });
}

/* =========================================
   GET SINGLE TASK
   ========================================= */

export async function getTask(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  const task = await Task.findById(req.params.id)
    .populate("assignedBy", "name email role")
    .populate("assignedTo", "name email role");

  if (!task) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  // Check access using the shared permission helper.
  const hasAccess = await canAccessTask(
    req.user,
    task
  );

  if (!hasAccess) {
    return res.status(403).json({
      message:
        "You do not have permission to access this task",
    });
  }

  return res.json({ task });
}

/* =========================================
   CREATE TASK
   Admin: assign to anyone
   Manager: assign to own team
   Team Member: cannot create tasks for others
   ========================================= */

export async function createTask(req, res) {
  const {
    title,
    description,
    assignedTo,
    priority,
    startDate,
    dueDate,
    tags,
    attachment,
  } = req.body;

  if (!title?.trim() || !assignedTo) {
    return res.status(400).json({
      message: "Title and assignee are required",
    });
  }

  if (!mongoose.isValidObjectId(assignedTo)) {
    return res.status(400).json({
      message: "A valid assignee ID is required",
    });
  }

  const assignee = await User.findById(assignedTo);

  if (!assignee || assignee.status !== "Active") {
    return res.status(400).json({
      message: "Active assignee not found",
    });
  }

  // Team Members cannot create tasks for other users.
  if (req.user.role === "Team Member") {
    return res.status(403).json({
      message:
        "Employees cannot create tasks for other users",
    });
  }

  // Managers can assign tasks only to themselves
  // or their own team members.
  if (req.user.role === "Manager") {
    const isOwnTeam = await User.exists({
      _id: assignee._id,
      manager: req.user._id,
      role: "Team Member",
    });

    if (
      String(assignee._id) !==
        String(req.user._id) &&
      !isOwnTeam
    ) {
      return res.status(403).json({
        message:
          "You can only assign tasks to your own team",
      });
    }
  }

  // Validate task dates.
  if (
    startDate &&
    dueDate &&
    new Date(dueDate) < new Date(startDate)
  ) {
    return res.status(400).json({
      message:
        "Due date cannot be before start date",
    });
  }

  const task = await Task.create({
    title: title.trim(),
    description: description?.trim() || "",
    assignedBy: req.user._id,
    assignedTo: assignee._id,
    priority: priority || "Medium",
    startDate: startDate || "",
    dueDate: dueDate || "",
    tags: Array.isArray(tags)
      ? tags
      : String(tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    attachment: attachment || "",
  });

  // Notify the assigned user.
  await Notification.create({
    user: assignee._id,
    type: "assignment",
    title: "New Task Assigned",
    message: `You have been assigned the task "${task.title}".`,
    taskId: task._id,
  });

  const populated = await task.populate([
    {
      path: "assignedBy",
      select: "name email role",
    },
    {
      path: "assignedTo",
      select: "name email role",
    },
  ]);

  return res.status(201).json({
    task: populated,
  });
}

/* =========================================
   UPDATE TASK
   Admin: any task
   Manager: own team's tasks
   Team Member: assigned tasks, status/progress only
   ========================================= */

export async function updateTask(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  // Check whether the user can access this task.
  const hasAccess = await canAccessTask(
    req.user,
    task
  );

  if (!hasAccess) {
    return res.status(403).json({
      message:
        "You do not have permission to update this task",
    });
  }

  // Managers can update tasks belonging to their team,
  // tasks assigned to themselves, or tasks they created.
  if (req.user.role === "Manager") {
    const assigneeId = String(
      task.assignedTo?._id || task.assignedTo
    );

    const assignedToSelf =
      assigneeId === String(req.user._id);

    const assignedToTeamMember = await User.exists({
      _id: assigneeId,
      manager: req.user._id,
      role: "Team Member",
    });

    const assignedBySelf =
      String(
        task.assignedBy?._id || task.assignedBy
      ) === String(req.user._id);

    if (
      !assignedToSelf &&
      !assignedToTeamMember &&
      !assignedBySelf
    ) {
      return res.status(403).json({
        message: "This task is outside your team",
      });
    }
  }

  // Team Members can update only status and progress.
  if (req.user.role === "Team Member") {
    const allowed = ["status", "progress"];

    for (const key of Object.keys(req.body)) {
      if (!allowed.includes(key)) {
        return res.status(403).json({
          message:
            "Employees can only update task status and progress",
        });
      }
    }

    if (req.body.status !== undefined) {
      task.status = req.body.status;
    }

    if (req.body.progress !== undefined) {
      const progress = Number(req.body.progress);

      if (
        !Number.isFinite(progress) ||
        progress < 0 ||
        progress > 100
      ) {
        return res.status(400).json({
          message:
            "Progress must be a number between 0 and 100",
        });
      }

      task.progress = progress;
    }
  } else {
    // Admins and Managers can update task details.
    const allowed = [
      "title",
      "description",
      "priority",
      "status",
      "progress",
      "startDate",
      "dueDate",
      "tags",
      "attachment",
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        task[key] = req.body[key];
      }
    }

    if (req.body.progress !== undefined) {
      const progress = Number(req.body.progress);

      if (
        !Number.isFinite(progress) ||
        progress < 0 ||
        progress > 100
      ) {
        return res.status(400).json({
          message:
            "Progress must be a number between 0 and 100",
        });
      }

      task.progress = progress;
    }

    // Handle reassignment.
    if (req.body.assignedTo !== undefined) {
      if (
        !mongoose.isValidObjectId(
          req.body.assignedTo
        )
      ) {
        return res.status(400).json({
          message: "A valid assignee ID is required",
        });
      }

      const assignee = await User.findById(
        req.body.assignedTo
      );

      if (
        !assignee ||
        assignee.status !== "Active"
      ) {
        return res.status(400).json({
          message: "Active assignee not found",
        });
      }

      // Managers can reassign tasks only within their team.
      if (req.user.role === "Manager") {
        const isOwnTeam = await User.exists({
          _id: assignee._id,
          manager: req.user._id,
          role: "Team Member",
        });

        if (
          String(assignee._id) !==
            String(req.user._id) &&
          !isOwnTeam
        ) {
          return res.status(403).json({
            message:
              "You can only assign tasks to your own team",
          });
        }
      }

      task.assignedTo = assignee._id;
    }
  }

  // Validate dates after changes.
  if (
    task.startDate &&
    task.dueDate &&
    new Date(task.dueDate) <
      new Date(task.startDate)
  ) {
    return res.status(400).json({
      message:
        "Due date cannot be before start date",
    });
  }

  await task.save();

  const populated = await task.populate([
    {
      path: "assignedBy",
      select: "name email role",
    },
    {
      path: "assignedTo",
      select: "name email role",
    },
  ]);

  return res.json({
    task: populated,
  });
}

/* =========================================
   DELETE TASK
   Admin: any task
   Manager: own team's tasks
   Team Member: cannot delete
   ========================================= */

export async function deleteTask(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  // Team Members cannot delete tasks.
  if (req.user.role === "Team Member") {
    return res.status(403).json({
      message: "Employees cannot delete tasks",
    });
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  // IMPORTANT: await the asynchronous permission check.
  const hasAccess = await canAccessTask(
    req.user,
    task
  );

  if (!hasAccess) {
    return res.status(403).json({
      message:
        "You do not have permission to delete this task",
    });
  }

  // Managers can delete only tasks assigned to themselves
  // or to their own team members.
  if (req.user.role === "Manager") {
    const assignedToId = String(
      task.assignedTo?._id || task.assignedTo
    );

    const assignedToSelf =
      assignedToId === String(req.user._id);

    const assignedToTeamMember = await User.exists({
      _id: assignedToId,
      manager: req.user._id,
      role: "Team Member",
    });

    if (
      !assignedToSelf &&
      !assignedToTeamMember
    ) {
      return res.status(403).json({
        message: "This task is outside your team",
      });
    }
  }

  await Task.findByIdAndDelete(task._id);

  // Remove notifications associated with the deleted task.
  await Notification.deleteMany({
    taskId: task._id,
  });

  return res.json({
    message: "Task deleted successfully",
  });
}