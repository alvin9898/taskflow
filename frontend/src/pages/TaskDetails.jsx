import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import "./TaskDetails.css";

const API_BASE = "http://localhost:5000/api";

/* =========================================
   AUTH TOKEN
   ========================================= */

function getAuthToken() {
  return (
    localStorage.getItem("taskflow_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

/* =========================================
   API REQUEST
   ========================================= */

async function apiRequest(url, options = {}) {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    },
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

/* =========================================
   HELPERS
   ========================================= */

function getId(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
}

function getName(value) {
  if (!value) return "—";

  if (typeof value === "object") {
    return value.name || value.email || "—";
  }

  return value;
}

/* =========================================
   COMPONENT
   ========================================= */

function TaskDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const { user } = useAuth();

  const [task, setTask] = useState(null);

  const [status, setStatus] = useState("Pending");

  const [progress, setProgress] = useState(0);

  const [commentText, setCommentText] = useState("");

  const [comments, setComments] = useState([]);

  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [commentSaving, setCommentSaving] = useState(false);

  const [error, setError] = useState("");

  /* =========================================
     LOAD TASK FROM MONGODB
     ========================================= */

  const loadTask = async () => {
    try {
      setLoading(true);

      setError("");

      const data = await apiRequest(`/tasks/${id}`);

      const foundTask =
        data.task ||
        data.data?.task ||
        data.data;

      if (!foundTask) {
        setTask(null);
        return;
      }

      setTask(foundTask);

      setStatus(foundTask.status || "Pending");

      setProgress(Number(foundTask.progress || 0));

      /* =====================================
         COMMENTS FROM MONGODB
         ===================================== */

      const backendComments = Array.isArray(
        foundTask.comments
      )
        ? foundTask.comments
        : [];

      setComments(
        backendComments.map((comment) => ({
          id:
            comment._id ||
            comment.id,

          user: getName(
            comment.userId ||
              comment.user
          ),

          text:
            comment.comment ||
            comment.text ||
            "",

          time: comment.createdAt
            ? new Date(
                comment.createdAt
              ).toLocaleString()
            : "Just now",
        }))
      );

      /* =====================================
         ACTIVITY
         ===================================== */

      const activityKey =
        `taskflow_activities_${id}`;

      const savedActivities = JSON.parse(
        localStorage.getItem(activityKey) ||
          "[]"
      );

      setActivities(savedActivities);

    } catch (requestError) {
      console.error(
        "Failed to load task:",
        requestError
      );

      setTask(null);

      setError(
        requestError.message ||
          "Unable to load task."
      );

    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     INITIAL LOAD
     ========================================= */

  useEffect(() => {
    loadTask();

    const handleTasksUpdated = () => {
      loadTask();
    };

    window.addEventListener(
      "taskflowTasksUpdated",
      handleTasksUpdated
    );

    return () => {
      window.removeEventListener(
        "taskflowTasksUpdated",
        handleTasksUpdated
      );
    };
  }, [id]);

  /* =========================================
     PERMISSIONS
     ========================================= */

  const isAdmin =
    user?.role === "Admin";

  const isManager =
    user?.role === "Manager";

  const assignedUserId =
    getId(task?.assignedTo);

  const currentUserId =
    getId(
      user?._id ||
        user?.id
    );

  const createdById =
    getId(task?.createdBy);

  const isAssignedUser =
    assignedUserId &&
    currentUserId &&
    assignedUserId === currentUserId;

  const isCreator =
    createdById &&
    currentUserId &&
    createdById === currentUserId;

  const canEdit =
    isAdmin ||
    isManager;

  const canUpdate =
    isAdmin ||
    isManager ||
    isAssignedUser ||
    isCreator;

  /* =========================================
     STATUS CHANGE
     ========================================= */

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);

    if (newStatus === "Pending") {
      setProgress(0);
    } else if (
      newStatus === "In Progress"
    ) {
      setProgress(50);
    } else if (
      newStatus === "On Hold"
    ) {
      setProgress(50);
    } else if (
      newStatus === "Completed"
    ) {
      setProgress(100);
    }
  };

  /* =========================================
     UPDATE TASK IN MONGODB
     ========================================= */

  const handleUpdate = async () => {
    if (!task || saving) {
      return;
    }

    /* -----------------------------------------
       AUTOMATIC PROGRESS BASED ON STATUS
       ----------------------------------------- */

    let finalProgress = 0;

    if (status === "Pending") {
      finalProgress = 0;
    } else if (
      status === "In Progress"
    ) {
      finalProgress = 50;
    } else if (
      status === "On Hold"
    ) {
      finalProgress = 50;
    } else if (
      status === "Completed"
    ) {
      finalProgress = 100;
    }

    try {
      setSaving(true);

      setError("");

      const data = await apiRequest(
        `/tasks/${task._id}`,
        {
          method: "PUT",

          body: JSON.stringify({
            status: status,
            progress: finalProgress,
          }),
        }
      );

      const updatedTask =
        data.task ||
        data.data?.task ||
        {
          ...task,
          status: status,
          progress: finalProgress,
        };

      setTask(updatedTask);

      setStatus(
        updatedTask.status ||
          status
      );

      setProgress(
        Number(
          updatedTask.progress ??
            finalProgress
        )
      );

      /* =====================================
         ACTIVITY
         ===================================== */

      const activityKey =
        `taskflow_activities_${task._id}`;

      const newActivity = {
        id: Date.now(),

        text:
          `${user?.name || "User"} updated the task status to ${status}.`,

        time:
          new Date().toLocaleString(),

        type: "update",
      };

      const updatedActivities = [
        ...activities,
        newActivity,
      ];

      localStorage.setItem(
        activityKey,
        JSON.stringify(
          updatedActivities
        )
      );

      setActivities(
        updatedActivities
      );

      window.dispatchEvent(
        new Event(
          "taskflowTasksUpdated"
        )
      );

      alert(
        "Task updated successfully!"
      );

    } catch (requestError) {
      console.error(
        "Failed to update task:",
        requestError
      );

      setError(
        requestError.message ||
          "Unable to update task."
      );

      alert(
        requestError.message ||
          "Unable to update task."
      );

    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     ADD COMMENT TO MONGODB
     ========================================= */

  const handleAddComment = async () => {
    const text =
      commentText.trim();

    if (
      !text ||
      !task ||
      commentSaving
    ) {
      return;
    }

    try {
      setCommentSaving(true);

      setError("");

      const data =
        await apiRequest(
          `/tasks/${task._id}/comments`,
          {
            method: "POST",

            body: JSON.stringify({
              comment: text,
            }),
          }
        );

      const updatedTask =
        data.task ||
        data.data?.task ||
        task;

      setTask(updatedTask);

      /* ===================================
         REFRESH COMMENTS
         =================================== */

      const backendComments =
        Array.isArray(
          updatedTask.comments
        )
          ? updatedTask.comments
          : [];

      setComments(
        backendComments.map(
          (comment) => ({
            id:
              comment._id ||
              comment.id,

            user: getName(
              comment.userId ||
                comment.user
            ),

            text:
              comment.comment ||
              comment.text ||
              "",

            time:
              comment.createdAt
                ? new Date(
                    comment.createdAt
                  ).toLocaleString()
                : "Just now",
          })
        )
      );

      /* ===================================
         ACTIVITY
         =================================== */

      const newActivity = {
        id: Date.now(),

        text:
          `${user?.name || "User"} added a comment.`,

        time:
          new Date().toLocaleString(),

        type: "comment",
      };

      const updatedActivities = [
        ...activities,
        newActivity,
      ];

      localStorage.setItem(
        `taskflow_activities_${task._id}`,
        JSON.stringify(
          updatedActivities
        )
      );

      setActivities(
        updatedActivities
      );

      setCommentText("");

    } catch (requestError) {
      console.error(
        "Failed to add comment:",
        requestError
      );

      setError(
        requestError.message ||
          "Unable to add comment."
      );

      alert(
        requestError.message ||
          "Unable to add comment."
      );

    } finally {
      setCommentSaving(false);
    }
  };

  /* =========================================
     LOADING
     ========================================= */

  if (loading) {
    return (
      <DashboardLayout>

        <div className="task-not-found">

          <h2>
            Loading Task...
          </h2>

          <p>
            Loading task from MongoDB...
          </p>

        </div>

      </DashboardLayout>
    );
  }

  /* =========================================
     TASK NOT FOUND
     ========================================= */

  if (!task) {
    return (
      <DashboardLayout>

        <div className="task-not-found">

          <h2>
            Task Not Found
          </h2>

          {error && (
            <p>
              {error}
            </p>
          )}

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

  const priorityClass =
    (
      task.priority ||
      "Medium"
    )
      .toLowerCase()
      .replace(
        /\s+/g,
        "-"
      );

  /* =========================================
     PAGE
     ========================================= */

  return (
    <DashboardLayout>

      <div className="task-details-page">

        {/* =================================
            HEADER
            ================================= */}

        <div className="task-details-header">

          <button
            className="back-btn"
            onClick={() =>
              navigate("/tasks")
            }
          >
            ← Back to Tasks
          </button>

          <div className="task-header-actions">

            {canEdit && (
              <button
                className="edit-task-btn"
                onClick={() =>
                  navigate(
                    `/tasks/${task._id}/edit`
                  )
                }
              >
                Edit Task
              </button>
            )}

          </div>

        </div>

        {/* =================================
            ERROR
            ================================= */}

        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              borderRadius: "8px",
              background: "#fff1f1",
              color: "#b42318",
            }}
          >
            {error}
          </div>
        )}

        {/* =================================
            MAIN TASK CARD
            ================================= */}

        <div className="task-main-card">

          <div className="task-title-section">

            <div>

              <div className="task-title-row">

                <h1>
                  {task.title}
                </h1>

                <span
                  className={`priority-badge ${priorityClass}`}
                >
                  {task.priority ||
                    "Medium"}
                </span>

              </div>

              <p>
                {task.description ||
                  "No description provided."}
              </p>

            </div>

          </div>

          {/* =================================
              META
              ================================= */}

          <div className="task-meta-grid">

            <div className="task-meta-item">

              <span>
                Assigned By
              </span>

              <strong>
                {getName(
                  task.createdBy
                )}
              </strong>

            </div>

            <div className="task-meta-item">

              <span>
                Assigned To
              </span>

              <strong>
                {getName(
                  task.assignedTo
                )}
              </strong>

            </div>

            <div className="task-meta-item">

              <span>
                Start Date
              </span>

              <strong>
                {task.startDate
                  ? new Date(
                      task.startDate
                    ).toLocaleDateString()
                  : "—"}
              </strong>

            </div>

            <div className="task-meta-item">

              <span>
                Due Date
              </span>

              <strong>
                {task.dueDate
                  ? new Date(
                      task.dueDate
                    ).toLocaleDateString()
                  : "—"}
              </strong>

            </div>

          </div>

          {/* =================================
              PROGRESS DISPLAY
              ================================= */}

          <div className="task-progress-section">

            <div className="task-progress-header">

              <div>

                <span>
                  Progress
                </span>

                <strong>
                  {progress}%
                </strong>

              </div>

              <span>
                {status}
              </span>

            </div>

            <div className="task-progress-bar">

              <div
                className="task-progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              ></div>

            </div>

          </div>

          {/* =================================
              UPDATE CONTROLS
              ================================= */}

          {canUpdate && (
            <div className="task-update-panel">

              <div className="task-update-field">

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
                  disabled={saving}
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

                </select>

              </div>

              <button
                className="update-task-btn"
                onClick={handleUpdate}
                disabled={saving}
              >
                {saving
                  ? "Updating..."
                  : "Update Task"}
              </button>

            </div>
          )}

          {/* =================================
              TAGS
              ================================= */}

          {task.tags &&
            task.tags.length > 0 && (

              <div className="task-tags">

                <span>
                  Tags
                </span>

                <div>

                  {task.tags.map(
                    (tag, index) => (

                      <span
                        key={index}
                        className="task-tag"
                      >
                        {tag}
                      </span>

                    )
                  )}

                </div>

              </div>

            )}

        </div>

        {/* =================================
            COMMENTS
            ================================= */}

        <div className="task-section-card">

          <div className="section-heading">

            <div>

              <h2>
                Comments
              </h2>

              <p>
                Team discussion and
                updates.
              </p>

            </div>

            <span>
              {comments.length}
            </span>

          </div>

          <div className="comment-form">

            <textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) =>
                setCommentText(
                  e.target.value
                )
              }
              disabled={
                commentSaving
              }
            />

            <button
              onClick={
                handleAddComment
              }
              disabled={
                commentSaving ||
                !commentText.trim()
              }
            >
              {commentSaving
                ? "Adding..."
                : "Add Comment"}
            </button>

          </div>

          <div className="comments-list">

            {comments.length > 0 ? (

              comments.map(
                (comment) => (

                  <div
                    className="comment-item"
                    key={comment.id}
                  >

                    <div className="comment-avatar">

                      {(comment.user ||
                        "U")
                        .charAt(0)
                        .toUpperCase()}

                    </div>

                    <div className="comment-content">

                      <div className="comment-top">

                        <strong>
                          {comment.user}
                        </strong>

                        <span>
                          {comment.time}
                        </span>

                      </div>

                      <p>
                        {comment.text}
                      </p>

                    </div>

                  </div>

                )
              )

            ) : (

              <div className="empty-comments">
                No comments yet.
              </div>

            )}

          </div>

        </div>

        {/* =================================
            ACTIVITY
            ================================= */}

        <div className="task-section-card">

          <div className="section-heading">

            <div>

              <h2>
                Activity History
              </h2>

              <p>
                Recent activity on
                this task.
              </p>

            </div>

            <span>
              {activities.length}
            </span>

          </div>

          <div className="activity-list">

            {activities.length > 0 ? (

              activities
                .slice()
                .reverse()
                .map(
                  (activity) => (

                    <div
                      className="activity-item"
                      key={
                        activity.id
                      }
                    >

                      <div className="activity-dot">
                      </div>

                      <div>

                        <p>
                          {activity.text}
                        </p>

                        <span>
                          {activity.time}
                        </span>

                      </div>

                    </div>

                  )
                )

            ) : (

              <div className="empty-comments">
                No activity yet.
              </div>

            )}

          </div>

        </div>

        {/* =================================
            ATTACHMENT
            ================================= */}

        <div className="task-section-card">

          <div className="section-heading">

            <div>

              <h2>
                Attachments
              </h2>

              <p>
                Files attached to
                this task.
              </p>

            </div>

          </div>

          {task.attachment ? (

            <div className="attachment-item">

              <span>
                📎
              </span>

              <strong>
                {task.attachment}
              </strong>

            </div>

          ) : (

            <div className="empty-comments">
              No attachments.
            </div>

          )}

        </div>

      </div>

    </DashboardLayout>
  );
}

export default TaskDetails;