import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { getTasks, getUsers } from "../api";
import "./Dashboard.css";

function Dashboard() {
  const { user } = useAuth();

  const role = user?.role || "Team Member";

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================
  // LOAD REAL DATA FROM MONGODB
  // =========================================

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        const taskData = await getTasks();

        setTasks(
          Array.isArray(taskData?.tasks)
            ? taskData.tasks
            : []
        );

        // Only Admin and Manager need the
        // complete user count.
        if (
          role === "Admin" ||
          role === "Manager"
        ) {
          const userData = await getUsers();

          setUsers(
            Array.isArray(userData?.users)
              ? userData.users
              : []
          );
        }
      } catch (error) {
        console.error(
          "Failed to load dashboard:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [role]);

  // =========================================
  // NORMALIZE ASSIGNEE NAME
  // =========================================

  const getAssigneeName = (task) => {
    if (
      task.assignedTo &&
      typeof task.assignedTo === "object"
    ) {
      return (
        task.assignedTo.name ||
        task.assignedTo.email ||
        "Unassigned"
      );
    }

    return task.assignedTo || "Unassigned";
  };

  // =========================================
  // TASK COUNTS
  // =========================================

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) =>
      task.status === "Completed"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) =>
      task.status === "In Progress"
  ).length;

  const pendingTasks = tasks.filter(
    (task) =>
      task.status === "Pending"
  ).length;

  // =========================================
  // MY TASKS
  // =========================================

  const myTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (
        task.assignedTo &&
        typeof task.assignedTo === "object"
      ) {
        return (
          String(task.assignedTo._id) ===
          String(user?._id || user?.id)
        );
      }

      return (
        task.assignedTo === user?.name
      );
    });
  }, [tasks, user]);

  const myCompletedTasks =
    myTasks.filter(
      (task) =>
        task.status === "Completed"
    ).length;

  const myInProgressTasks =
    myTasks.filter(
      (task) =>
        task.status === "In Progress"
    ).length;

  const myPendingTasks =
    myTasks.filter(
      (task) =>
        task.status === "Pending"
    ).length;

  // =========================================
  // OVERDUE TASKS
  // =========================================

  const overdueTasks = tasks.filter(
    (task) => {
      if (
        !task.dueDate ||
        task.status === "Completed" ||
        task.status === "Cancelled"
      ) {
        return false;
      }

      const dueDate = new Date(
        task.dueDate
      );

      const today = new Date();

      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      return dueDate < today;
    }
  );

  // =========================================
  // COMPLETION %
  // =========================================

  const completionPercentage =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) *
            100
        )
      : 0;

  // =========================================
  // PRIORITY COUNTS
  // =========================================

  const criticalPriority =
    tasks.filter(
      (task) =>
        task.priority === "Critical"
    ).length;

  const highPriority =
    tasks.filter(
      (task) =>
        task.priority === "High"
    ).length;

  const mediumPriority =
    tasks.filter(
      (task) =>
        task.priority === "Medium"
    ).length;

  const lowPriority =
    tasks.filter(
      (task) =>
        task.priority === "Low"
    ).length;

  // =========================================
  // ROLE BASED STATS
  // =========================================

  let stats;

  if (role === "Admin") {
    stats = [
      {
        title: "Total Users",
        value: loading
          ? "..."
          : users.length,
        icon: "👥",
        type: "blue",
      },
      {
        title: "Total Tasks",
        value: loading
          ? "..."
          : totalTasks,
        icon: "📋",
        type: "purple",
      },
      {
        title: "Completed",
        value: loading
          ? "..."
          : completedTasks,
        icon: "✓",
        type: "green",
      },
      {
        title: "In Progress",
        value: loading
          ? "..."
          : inProgressTasks,
        icon: "↻",
        type: "orange",
      },
    ];
  } else if (role === "Manager") {
    stats = [
      {
        title: "My Tasks",
        value: loading
          ? "..."
          : myTasks.length,
        icon: "📋",
        type: "blue",
      },
      {
        title: "Team Tasks",
        value: loading
          ? "..."
          : totalTasks,
        icon: "👥",
        type: "purple",
      },
      {
        title: "Completed",
        value: loading
          ? "..."
          : completedTasks,
        icon: "✓",
        type: "green",
      },
      {
        title: "Overdue",
        value: loading
          ? "..."
          : overdueTasks.length,
        icon: "⚠",
        type: "red",
      },
    ];
  } else {
    stats = [
      {
        title: "My Tasks",
        value: loading
          ? "..."
          : myTasks.length,
        icon: "📋",
        type: "blue",
      },
      {
        title: "Pending",
        value: loading
          ? "..."
          : myPendingTasks,
        icon: "◷",
        type: "orange",
      },
      {
        title: "In Progress",
        value: loading
          ? "..."
          : myInProgressTasks,
        icon: "↻",
        type: "purple",
      },
      {
        title: "Completed",
        value: loading
          ? "..."
          : myCompletedTasks,
        icon: "✓",
        type: "green",
      },
    ];
  }

  // =========================================
  // RECENT TASKS
  // =========================================

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      )
      .slice(0, 5);
  }, [tasks]);

  // =========================================
  // RENDER
  // =========================================

  return (
    <DashboardLayout>

      {/* =====================================
          WELCOME
          ===================================== */}

      <div className="dashboard-top">

        <div>
          <p className="dashboard-label">
            {role} Dashboard
          </p>

          <h1>
            Welcome back,{" "}
            {user?.name || "User"} 👋
          </h1>

          <p className="dashboard-description">
            Here's what's happening with
            your tasks today.
          </p>
        </div>

        {(role === "Admin" ||
          role === "Manager") && (
          <Link
            to="/tasks/create"
            className="dashboard-create-btn"
          >
            + Create Task
          </Link>
        )}

      </div>

      {/* =====================================
          STAT CARDS
          ===================================== */}

      <div className="dashboard-stats">

        {stats.map((stat) => (
          <div
            className="dashboard-stat-card"
            key={stat.title}
          >

            <div
              className={`dashboard-stat-icon ${stat.type}`}
            >
              {stat.icon}
            </div>

            <div className="dashboard-stat-content">

              <p>{stat.title}</p>

              <h2>{stat.value}</h2>

            </div>

          </div>
        ))}

      </div>

      {/* =====================================
          MAIN GRID
          ===================================== */}

      <div className="dashboard-grid">

        {/* ===================================
            COMPLETION
            =================================== */}

        <div className="dashboard-panel completion-panel">

          <div className="panel-header">

            <div>
              <h2>
                Task Completion
              </h2>

              <p>
                Overall project progress
              </p>
            </div>

            <span className="panel-icon">
              📊
            </span>

          </div>

          <div className="completion-content">

            <div className="completion-circle">

              <div>
                <strong>
                  {completionPercentage}%
                </strong>

                <span>
                  Complete
                </span>
              </div>

            </div>

            <div className="completion-details">

              <div className="completion-row">

                <span>
                  <i className="dot completed-dot"></i>
                  Completed
                </span>

                <strong>
                  {completedTasks}
                </strong>

              </div>

              <div className="completion-row">

                <span>
                  <i className="dot progress-dot"></i>
                  In Progress
                </span>

                <strong>
                  {inProgressTasks}
                </strong>

              </div>

              <div className="completion-row">

                <span>
                  <i className="dot pending-dot"></i>
                  Pending
                </span>

                <strong>
                  {pendingTasks}
                </strong>

              </div>

            </div>

          </div>

        </div>

        {/* ===================================
            PRIORITY
            =================================== */}

        <div className="dashboard-panel priority-panel">

          <div className="panel-header">

            <div>
              <h2>
                Task Priority
              </h2>

              <p>
                Tasks by priority level
              </p>
            </div>

            <span className="panel-icon">
              🎯
            </span>

          </div>

          <div className="priority-list">

            {/* Critical */}

            <div className="priority-item">

              <div className="priority-info">

                <span>
                  Critical
                </span>

                <strong>
                  {criticalPriority}
                </strong>

              </div>

              <div className="priority-bar">

                <div
                  className="priority-fill critical"
                  style={{
                    width: `${
                      totalTasks
                        ? (criticalPriority /
                            totalTasks) *
                          100
                        : 0
                    }%`,
                  }}
                />

              </div>

            </div>

            {/* High */}

            <div className="priority-item">

              <div className="priority-info">

                <span>
                  High
                </span>

                <strong>
                  {highPriority}
                </strong>

              </div>

              <div className="priority-bar">

                <div
                  className="priority-fill high"
                  style={{
                    width: `${
                      totalTasks
                        ? (highPriority /
                            totalTasks) *
                          100
                        : 0
                    }%`,
                  }}
                />

              </div>

            </div>

            {/* Medium */}

            <div className="priority-item">

              <div className="priority-info">

                <span>
                  Medium
                </span>

                <strong>
                  {mediumPriority}
                </strong>

              </div>

              <div className="priority-bar">

                <div
                  className="priority-fill medium"
                  style={{
                    width: `${
                      totalTasks
                        ? (mediumPriority /
                            totalTasks) *
                          100
                        : 0
                    }%`,
                  }}
                />

              </div>

            </div>

            {/* Low */}

            <div className="priority-item">

              <div className="priority-info">

                <span>
                  Low
                </span>

                <strong>
                  {lowPriority}
                </strong>

              </div>

              <div className="priority-bar">

                <div
                  className="priority-fill low"
                  style={{
                    width: `${
                      totalTasks
                        ? (lowPriority /
                            totalTasks) *
                          100
                        : 0
                    }%`,
                  }}
                />

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================
          RECENT TASKS
          ===================================== */}

      <div className="dashboard-panel recent-panel">

        <div className="panel-header">

          <div>

            <h2>
              Recent Tasks
            </h2>

            <p>
              Latest activity across your
              workspace
            </p>

          </div>

          <Link
            to={
              role === "Team Member"
                ? "/my-tasks"
                : "/tasks"
            }
            className="view-all-link"
          >
            View all →
          </Link>

        </div>

        <div className="dashboard-task-list">

          {loading ? (
            <div className="dashboard-empty">

              <span>⏳</span>

              <p>
                Loading tasks...
              </p>

            </div>
          ) : recentTasks.length > 0 ? (

            recentTasks.map((task) => {

              const taskId =
                task._id || task.id;

              const assignee =
                getAssigneeName(task);

              return (
                <Link
                  to={`/tasks/${taskId}`}
                  className="dashboard-task-row"
                  key={taskId}
                >

                  <div className="task-main">

                    <div className="task-mini-icon">
                      📋
                    </div>

                    <div>

                      <h3>
                        {task.title}
                      </h3>

                      <p>
                        Assigned to{" "}
                        {assignee}
                      </p>

                    </div>

                  </div>

                  <div className="task-status-area">

                    <span
                      className={`dashboard-priority ${
                        task.priority
                          ?.toLowerCase() || ""
                      }`}
                    >
                      {task.priority ||
                        "Medium"}
                    </span>

                    <span
                      className={`dashboard-status ${
                        task.status
                          ?.toLowerCase()
                          .replace(
                            /\s+/g,
                            "-"
                          ) || ""
                      }`}
                    >
                      {task.status ||
                        "Pending"}
                    </span>

                    <div className="mini-progress">

                      <div className="mini-progress-bar">

                        <div
                          className="mini-progress-fill"
                          style={{
                            width: `${
                              task.progress ||
                              0
                            }%`,
                          }}
                        />

                      </div>

                      <span>
                        {task.progress ||
                          0}
                        %
                      </span>

                    </div>

                  </div>

                </Link>
              );
            })

          ) : (

            <div className="dashboard-empty">

              <span>📋</span>

              <p>
                No tasks available.
              </p>

            </div>

          )}

        </div>

      </div>

      {/* =====================================
          QUICK ACTIONS
          ===================================== */}

      <div className="quick-actions">

        <div className="quick-action-heading">

          <h2>
            Quick Actions
          </h2>

          <p>
            Get things done faster.
          </p>

        </div>

        <div className="quick-action-grid">

          {(role === "Admin" ||
            role === "Manager") && (

            <Link
              to="/tasks/create"
              className="quick-action"
            >

              <span className="quick-action-icon">
                +
              </span>

              <div>
                <strong>
                  Create Task
                </strong>

                <small>
                  Assign a new task
                </small>
              </div>

              <span>→</span>

            </Link>

          )}

          <Link
            to={
              role === "Team Member"
                ? "/my-tasks"
                : "/tasks"
            }
            className="quick-action"
          >

            <span className="quick-action-icon">
              📋
            </span>

            <div>

              <strong>
                {role === "Team Member"
                  ? "My Tasks"
                  : "All Tasks"}
              </strong>

              <small>
                View your task list
              </small>

            </div>

            <span>→</span>

          </Link>

          <Link
            to="/notifications"
            className="quick-action"
          >

            <span className="quick-action-icon">
              🔔
            </span>

            <div>

              <strong>
                Notifications
              </strong>

              <small>
                Check recent updates
              </small>

            </div>

            <span>→</span>

          </Link>

          <Link
            to="/profile"
            className="quick-action"
          >

            <span className="quick-action-icon">
              👤
            </span>

            <div>

              <strong>
                My Profile
              </strong>

              <small>
                Manage your account
              </small>

            </div>

            <span>→</span>

          </Link>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Dashboard;