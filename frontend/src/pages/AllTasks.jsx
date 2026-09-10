import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { getTasks } from "../api";
import "./AllTasks.css";

function AllTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [priorityFilter, setPriorityFilter] =
    useState("All Priorities");

  // =========================================
  // LOAD TASKS FROM MONGODB
  // =========================================

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTasks();

      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setError(error.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // =========================================
  // FILTER TASKS
  // =========================================

  const filteredTasks = tasks.filter((task) => {
    const searchText = search.toLowerCase().trim();

    const title = task.title?.toLowerCase() || "";
    const description = task.description?.toLowerCase() || "";

    const assignee =
      typeof task.assignedTo === "object"
        ? task.assignedTo?.name?.toLowerCase() || ""
        : String(task.assignedTo || "").toLowerCase();

    const matchesSearch =
      !searchText ||
      title.includes(searchText) ||
      description.includes(searchText) ||
      assignee.includes(searchText);

    const matchesStatus =
      statusFilter === "All Status" ||
      task.status === statusFilter;

    const matchesPriority =
      priorityFilter === "All Priorities" ||
      task.priority === priorityFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority
    );
  });

  // =========================================
  // COUNTS
  // =========================================

  const totalTasks = tasks.length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "Pending"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  // =========================================
  // DATE FORMAT
  // =========================================

  const formatDate = (date) => {
    if (!date) return "Not set";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not set";
    }

    return parsedDate.toLocaleDateString();
  };

  // =========================================
  // ASSIGNEE NAME
  // =========================================

  const getAssigneeName = (assignedTo) => {
    if (!assignedTo) {
      return "Unassigned";
    }

    if (typeof assignedTo === "object") {
      return assignedTo.name || "Unassigned";
    }

    return assignedTo;
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <DashboardLayout>
      <div className="tasks-header">
        <div>
          <h1>All Tasks</h1>

          <p>
            Manage and monitor all project tasks.
          </p>
        </div>

        <Link
          to="/tasks/create"
          className="create-task-btn"
        >
          + Create Task
        </Link>
      </div>

      {/* =========================================
          TASK SUMMARY
          ========================================= */}

      <div className="task-summary">
        <div>
          <strong>{totalTasks}</strong>
          <span>Total Tasks</span>
        </div>

        <div>
          <strong>{pendingTasks}</strong>
          <span>Pending</span>
        </div>

        <div>
          <strong>{inProgressTasks}</strong>
          <span>In Progress</span>
        </div>

        <div>
          <strong>{completedTasks}</strong>
          <span>Completed</span>
        </div>
      </div>

      {/* =========================================
          FILTERS
          ========================================= */}

      <div className="task-controls">
        <input
          type="text"
          placeholder="Search tasks..."
          className="search-input"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          <option>All Status</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>On Hold</option>
          <option>Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) =>
            setPriorityFilter(e.target.value)
          }
        >
          <option>All Priorities</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>
      </div>

      {/* =========================================
          ERROR
          ========================================= */}

      {error && (
        <div className="task-error">
          {error}
        </div>
      )}

      {/* =========================================
          TASK TABLE
          ========================================= */}

      <div className="tasks-table">

        <div className="tasks-row tasks-heading">
          <span>Task</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Progress</span>
          <span>Assignee</span>
          <span>Due Date</span>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="no-tasks">
            Loading tasks...
          </div>
        ) : filteredTasks.length > 0 ? (

          /* TASKS */

          filteredTasks.map((task) => (
            <div
              className="tasks-row"
              key={task._id}
            >

              {/* TASK TITLE */}

              <Link
                to={`/tasks/${task._id}`}
                className="task-title task-link"
              >
                {task.title}
              </Link>

              {/* PRIORITY */}

              <span
                className={`priority ${
                  task.priority?.toLowerCase() || ""
                }`}
              >
                {task.priority || "Medium"}
              </span>

              {/* STATUS */}

              <span
                className={`status status-${(
                  task.status || "Pending"
                )
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {task.status || "Pending"}
              </span>

              {/* PROGRESS */}

              <span>
                {Number(task.progress) || 0}%
              </span>

              {/* ASSIGNEE */}

              <span>
                {getAssigneeName(task.assignedTo)}
              </span>

              {/* DUE DATE */}

              <span>
                {formatDate(task.dueDate)}
              </span>

            </div>
          ))

        ) : (

          /* NO TASKS */

          <div className="no-tasks">
            {tasks.length === 0
              ? "No tasks found."
              : "No tasks match your filters."}
          </div>

        )}

      </div>
    </DashboardLayout>
  );
}

export default AllTasks;