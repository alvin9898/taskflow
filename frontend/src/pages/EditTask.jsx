import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import "./EditTask.css";

function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] =
    useState("");
  const [priority, setPriority] =
    useState("Medium");
  const [status, setStatus] =
    useState("Pending");
  const [progress, setProgress] =
    useState(0);
  const [startDate, setStartDate] =
    useState("");
  const [dueDate, setDueDate] =
    useState("");
  const [tags, setTags] = useState("");

  const isAllowed =
    user?.role === "Manager" ||
    user?.role === "Admin";

  useEffect(() => {
    const defaultTasks = [
      {
        id: 1,
        title: "Design Login Page",
        description:
          "Create a modern login interface for TaskFlow.",
        assignedBy: "Arbaz",
        assignedTo: "Arbaz",
        priority: "High",
        status: "In Progress",
        progress: 60,
        startDate: "2026-09-01",
        dueDate: "2026-09-05",
        tags: ["frontend", "login"],
      },
      {
        id: 2,
        title: "Database Setup",
        description:
          "Set up the database for the TaskFlow project.",
        assignedBy: "Arbaz",
        assignedTo: "Rahul",
        priority: "Medium",
        status: "Completed",
        progress: 100,
        startDate: "2026-09-01",
        dueDate: "2026-09-03",
        tags: ["database"],
      },
      {
        id: 3,
        title: "API Integration",
        description:
          "Connect frontend with backend APIs.",
        assignedBy: "Arbaz",
        assignedTo: "Aman",
        priority: "High",
        status: "Pending",
        progress: 0,
        startDate: "2026-09-05",
        dueDate: "2026-09-10",
        tags: ["api", "backend"],
      },
    ];

    const savedTasks = JSON.parse(
      localStorage.getItem(
        "taskflow_tasks"
      ) || "[]"
    );

    const taskMap = new Map();

    defaultTasks.forEach((item) => {
      taskMap.set(String(item.id), item);
    });

    savedTasks.forEach((item) => {
      taskMap.set(String(item.id), item);
    });

    const foundTask = taskMap.get(
      String(id)
    );

    if (foundTask) {
      setTask(foundTask);

      setTitle(foundTask.title || "");
      setDescription(
        foundTask.description || ""
      );
      setAssignedTo(
        foundTask.assignedTo || ""
      );
      setPriority(
        foundTask.priority || "Medium"
      );
      setStatus(
        foundTask.status || "Pending"
      );
      setProgress(
        Number(foundTask.progress || 0)
      );
      setStartDate(
        foundTask.startDate || ""
      );
      setDueDate(
        foundTask.dueDate || ""
      );
      setTags(
        Array.isArray(foundTask.tags)
          ? foundTask.tags.join(", ")
          : foundTask.tags || ""
      );
    }
  }, [id]);

  const handleStatusChange = (value) => {
    setStatus(value);

    if (value === "Completed") {
      setProgress(100);
    }

    if (value === "Pending") {
      setProgress(0);
    }
  };

  const handleProgressChange = (value) => {
    let newProgress = Number(value);

    if (newProgress < 0) {
      newProgress = 0;
    }

    if (newProgress > 100) {
      newProgress = 100;
    }

    setProgress(newProgress);

    if (newProgress === 100) {
      setStatus("Completed");
    } else if (
      newProgress > 0 &&
      status === "Pending"
    ) {
      setStatus("In Progress");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a task title.");
      return;
    }

    if (!assignedTo) {
      alert("Please select an assignee.");
      return;
    }

    if (
      startDate &&
      dueDate &&
      new Date(dueDate) <
        new Date(startDate)
    ) {
      alert(
        "Due date cannot be before the start date."
      );
      return;
    }

    if (
      progress < 0 ||
      progress > 100
    ) {
      alert(
        "Progress must be between 0 and 100."
      );
      return;
    }

    let finalStatus = status;
    let finalProgress = Number(progress);

    if (finalStatus === "Completed") {
      finalProgress = 100;
    }

    if (finalStatus === "Pending") {
      finalProgress = 0;
    }

    if (
      finalProgress === 100
    ) {
      finalStatus = "Completed";
    } else if (
      finalProgress > 0 &&
      finalStatus === "Pending"
    ) {
      finalStatus = "In Progress";
    }

    const savedTasks = JSON.parse(
      localStorage.getItem(
        "taskflow_tasks"
      ) || "[]"
    );

    const updatedTask = {
      ...task,

      id: Number(id),

      title: title.trim(),

      description:
        description.trim(),

      assignedTo,

      priority,

      status: finalStatus,

      progress: finalProgress,

      startDate,

      dueDate,

      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),

      updatedAt:
        new Date().toISOString(),
    };

    const taskExists = savedTasks.some(
      (item) =>
        String(item.id) ===
        String(id)
    );

    const updatedTasks = taskExists
      ? savedTasks.map((item) =>
          String(item.id) ===
          String(id)
            ? updatedTask
            : item
        )
      : [
          ...savedTasks,
          updatedTask,
        ];

    localStorage.setItem(
      "taskflow_tasks",
      JSON.stringify(updatedTasks)
    );

    // Notify all task-related pages
    window.dispatchEvent(
      new Event("taskflowTasksUpdated")
    );

    /* =====================================
       ACTIVITY
       ===================================== */

    const activityKey =
      `taskflow_activities_${id}`;

    const savedActivities =
      JSON.parse(
        localStorage.getItem(
          activityKey
        ) || "[]"
      );

    const newActivity = {
      id: Date.now(),

      text: `${user?.name || "User"} updated the task.`,

      time: new Date().toLocaleString(),

      type: "update",
    };

    localStorage.setItem(
      activityKey,
      JSON.stringify([
        ...savedActivities,
        newActivity,
      ])
    );

    /* =====================================
       NOTIFICATION
       ===================================== */

    if (
      assignedTo &&
      assignedTo !== user?.name
    ) {
      const notification = {
        id: Date.now() + 1,

        type: "update",

        title: "Task Updated",

        message: `The task "${title}" has been updated.`,

        time: "Just now",

        read: false,

        taskId: Number(id),

        assignedTo,
      };

      const savedNotifications =
        JSON.parse(
          localStorage.getItem(
            "taskflow_notifications"
          ) || "[]"
        );

      localStorage.setItem(
        "taskflow_notifications",
        JSON.stringify([
          ...savedNotifications,
          notification,
        ])
      );

      window.dispatchEvent(
        new Event(
          "taskflowNotificationsUpdated"
        )
      );
    }

    alert("Task updated successfully!");

    navigate(`/tasks/${id}`);
  };

  if (!isAllowed) {
    return (
      <DashboardLayout>
        <div className="access-denied">
          <h2>Access Denied</h2>

          <p>
            Only Managers and Admins can
            edit tasks.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout>
        <div className="access-denied">
          <h2>Task Not Found</h2>

          <button
            onClick={() =>
              navigate("/tasks")
            }
          >
            Back to Tasks
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <div className="edit-task-page">

        <div className="edit-task-header">

          <div>

            <p className="edit-task-label">
              Task Management
            </p>

            <h1>
              Edit Task
            </h1>

            <p>
              Update task details,
              assignment, status and
              progress.
            </p>

          </div>

        </div>


        <div className="edit-task-card">

          <form onSubmit={handleSubmit}>

            <div className="edit-section">

              <h2>
                Task Information
              </h2>

              <div className="form-group">

                <label>
                  Task Title
                  <span>*</span>
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  rows="5"
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>


            <div className="edit-section">

              <h2>
                Assignment
              </h2>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Assign To
                    <span>*</span>
                  </label>

                  <select
                    value={assignedTo}
                    onChange={(e) =>
                      setAssignedTo(
                        e.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      Select team member
                    </option>

                    <option value="Arbaz">
                      Arbaz
                    </option>

                    <option value="Rahul">
                      Rahul
                    </option>

                    <option value="Aman">
                      Aman
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(
                        e.target.value
                      )
                    }
                  >

                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>

                    <option value="Critical">
                      Critical
                    </option>

                  </select>

                </div>

              </div>

            </div>


            <div className="edit-section">

              <h2>
                Status & Progress
              </h2>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(e) =>
                      handleStatusChange(
                        e.target.value
                      )
                    }
                  >

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="On Hold">
                      On Hold
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Progress
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) =>
                      handleProgressChange(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

            </div>


            <div className="edit-section">

              <h2>
                Schedule
              </h2>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(
                        e.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Due Date
                  </label>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) =>
                      setDueDate(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

            </div>


            <div className="edit-section">

              <h2>
                Additional Details
              </h2>

              <div className="form-group">

                <label>
                  Tags
                </label>

                <input
                  type="text"
                  value={tags}
                  onChange={(e) =>
                    setTags(
                      e.target.value
                    )
                  }
                  placeholder="frontend, urgent, website"
                />

              </div>

            </div>


            <div className="edit-task-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  navigate(
                    `/tasks/${id}`
                  )
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-task-btn"
              >
                Save Changes
              </button>

            </div>

          </form>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default EditTask;