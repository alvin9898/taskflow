import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

const API_BASE = "http://localhost:5000/api";

/* =========================================
   GET AUTH TOKEN
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
   COMPONENT
   ========================================= */

function Profile() {
  const navigate = useNavigate();

  const { user, setUser } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  /* =========================================
     LOAD PROFILE FROM MONGODB
     ========================================= */

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?._id && !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const userId =
          user._id ||
          user.id;

        const data = await apiRequest(
          `/users/${userId}`
        );

        const backendUser =
          data.user || data;

        setName(
          backendUser.name || ""
        );

        setPhone(
          backendUser.phone || ""
        );

        setDesignation(
          backendUser.designation || ""
        );

        /*
         Update AuthContext with
         latest MongoDB user data.
        */

        if (setUser && backendUser) {
          setUser({
            ...user,
            ...backendUser,
            id:
              backendUser.id ||
              backendUser._id ||
              user.id,
            _id:
              backendUser._id ||
              user._id,
          });
        }

      } catch (requestError) {
        console.error(
          "Failed to load profile:",
          requestError
        );

        setError(
          requestError.message ||
            "Unable to load profile."
        );

        /*
         Fallback to AuthContext
         if API loading fails.
        */

        setName(
          user?.name || ""
        );

      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?._id, user?.id]);

  /* =========================================
     LOAD TASKS FROM MONGODB
     ========================================= */

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setTasksLoading(true);

        const data = await apiRequest("/tasks");

        const backendTasks = Array.isArray(data.tasks)
          ? data.tasks
          : Array.isArray(data)
          ? data
          : [];

        setTasks(backendTasks);
      } catch (requestError) {
        console.error(
          "Failed to load tasks:",
          requestError
        );
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };

    loadTasks();
  }, []);

  /* =========================================
     TASK STATISTICS FROM MONGODB
     ========================================= */

  const myTasks = tasks.filter((task) => {
    const assignedTo = task.assignedTo;

    if (
      typeof assignedTo === "object" &&
      assignedTo !== null
    ) {
      const assignedUserId =
        assignedTo._id ||
        assignedTo.id ||
        assignedTo.userId;

      return (
        (assignedUserId &&
          String(assignedUserId) ===
            String(user?._id || user?.id)) ||
        assignedTo.name === user?.name
      );
    }

    return (
      String(assignedTo || "") ===
        String(user?._id || user?.id || "") ||
      assignedTo === user?.name
    );
  });

  const totalTasks = myTasks.length;

  const completedTasks = myTasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const inProgressTasks = myTasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const pendingTasks = myTasks.filter(
    (task) => task.status === "Pending"
  ).length;

  const overdueTasks = myTasks.filter((task) => {
    if (
      !task.dueDate ||
      task.status === "Completed"
    ) {
      return false;
    }

    const dueDate = new Date(task.dueDate);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return dueDate < today;
  }).length;

  /* =========================================
     SAVE PROFILE TO MONGODB
     ========================================= */

  const handleSave =
    async (e) => {
      e.preventDefault();

      if (!name.trim()) {
        setMessage(
          "Please enter your full name."
        );
        return;
      }

      if (
        !user?._id &&
        !user?.id
      ) {
        setMessage(
          "User information is unavailable. Please log in again."
        );
        return;
      }

      try {
        setSaving(true);
        setMessage("");
        setError("");

        const userId =
          user._id ||
          user.id;

        const updatedData = {
          name:
            name.trim(),

          phone:
            phone.trim(),

          designation:
            designation.trim(),
        };

        const data =
          await apiRequest(
            `/users/${userId}`,
            {
              method: "PUT",

              body:
                JSON.stringify(
                  updatedData
                ),
            }
          );

        const updatedUser =
          data.user || data;

        /*
         Update AuthContext
         */

        if (
          setUser &&
          user
        ) {
          setUser({
            ...user,
            ...updatedUser,

            id:
              updatedUser.id ||
              updatedUser._id ||
              user.id,

            _id:
              updatedUser._id ||
              user._id,
          });
        }

        setName(
          updatedUser.name ||
            name.trim()
        );

        setPhone(
          updatedUser.phone ||
            phone.trim()
        );

        setDesignation(
          updatedUser.designation ||
            designation.trim()
        );

        setIsEditing(false);

        setMessage(
          "Profile updated successfully!"
        );

        /*
         Tell other TaskFlow
         components that the
         user information changed.
        */

        window.dispatchEvent(
          new Event(
            "taskflowProfileUpdated"
          )
        );

        setTimeout(() => {
          setMessage("");
        }, 3000);

      } catch (
        requestError
      ) {
        console.error(
          "Failed to update profile:",
          requestError
        );

        setError(
          requestError.message ||
            "Unable to update profile."
        );

      } finally {
        setSaving(false);
      }
    };

  /* =========================================
     INITIALS
     ========================================= */

  const getInitials =
    (value) => {
      if (!value) {
        return "U";
      }

      const words =
        value
          .trim()
          .split(" ")
          .filter(Boolean);

      if (
        words.length === 1
      ) {
        return words[0]
          .charAt(0)
          .toUpperCase();
      }

      return (
        words[0].charAt(0) +
        words[
          words.length - 1
        ].charAt(0)
      ).toUpperCase();
    };

  /* =========================================
     LOADING
     ========================================= */

  if (loading) {
    return (
      <DashboardLayout>

        <div className="profile-page">

          <div className="profile-header">

            <div>
              <p className="profile-label">
                Account
              </p>

              <h1>
                My Profile
              </h1>

              <p>
                Loading your profile...
              </p>
            </div>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  /* =========================================
     PAGE
     ========================================= */

  return (
    <DashboardLayout>

      <div className="profile-page">

        {/* =================================
            HEADER
            ================================= */}

        <div className="profile-header">

          <div>

            <p className="profile-label">
              Account
            </p>

            <h1>
              My Profile
            </h1>

            <p>
              View and manage your account
              information.
            </p>

          </div>

          <div className="profile-header-actions">

            <button
              className="password-btn"
              onClick={() =>
                navigate(
                  "/change-password"
                )
              }
            >
              🔒 Change Password
            </button>

            {!isEditing && (
              <button
                className="edit-profile-btn"
                onClick={() =>
                  setIsEditing(
                    true
                  )
                }
              >
                ✎ Edit Profile
              </button>
            )}

          </div>

        </div>


        {/* =================================
            SUCCESS MESSAGE
            ================================= */}

        {message && (
          <div className="profile-message">
            ✓ {message}
          </div>
        )}


        {/* =================================
            ERROR MESSAGE
            ================================= */}

        {error && (
          <div
            className="profile-message"
            style={{
              color: "#b42318",
              background: "#fff1f1",
            }}
          >
            ⚠ {error}
          </div>
        )}


        <div className="profile-grid">

          {/* =================================
              PROFILE INFORMATION
              ================================= */}

          <div className="profile-card profile-info-card">

            <div className="profile-top">

              <div className="profile-avatar">
                {getInitials(name)}
              </div>

              <div>

                <h2>
                  {name ||
                    "User"}
                </h2>

                <p>
                  {user?.role ||
                    "Team Member"}
                </p>

                <span className="active-badge">
                  {user?.status ||
                    "Active"}
                </span>

              </div>

            </div>


            {isEditing ? (

              <form
                className="profile-edit-form"
                onSubmit={
                  handleSave
                }
              >

                <div className="profile-form-group">

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    required
                  />

                </div>


                <div className="profile-form-group">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      user?.email ||
                      ""
                    }
                    disabled
                  />

                  <small>
                    Email cannot be
                    changed here.
                  </small>

                </div>


                <div className="profile-form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                      )
                    }
                    placeholder="+91 98765 43210"
                  />

                </div>


                <div className="profile-form-group">

                  <label>
                    Designation
                  </label>

                  <input
                    type="text"
                    value={
                      designation
                    }
                    onChange={(e) =>
                      setDesignation(
                        e.target.value
                      )
                    }
                    placeholder="Your designation"
                  />

                </div>


                <div className="profile-edit-actions">

                  <button
                    type="button"
                    className="profile-cancel-btn"
                    onClick={() =>
                      setIsEditing(
                        false
                      )
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="profile-save-btn"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "✓ Save Changes"}
                  </button>

                </div>

              </form>

            ) : (

              <div className="profile-details">

                <div className="detail-item">

                  <span className="detail-label">
                    Full Name
                  </span>

                  <strong>
                    {name ||
                      "Not set"}
                  </strong>

                </div>


                <div className="detail-item">

                  <span className="detail-label">
                    Email
                  </span>

                  <strong>
                    {user?.email ||
                      "Not set"}
                  </strong>

                </div>


                <div className="detail-item">

                  <span className="detail-label">
                    Phone
                  </span>

                  <strong>
                    {phone ||
                      "Not provided"}
                  </strong>

                </div>


                <div className="detail-item">

                  <span className="detail-label">
                    Designation
                  </span>

                  <strong>
                    {designation ||
                      "Not provided"}
                  </strong>

                </div>


                <div className="detail-item">

                  <span className="detail-label">
                    Role
                  </span>

                  <strong>
                    {user?.role ||
                      "Team Member"}
                  </strong>

                </div>


                <div className="detail-item">

                  <span className="detail-label">
                    Account Status
                  </span>

                  <strong className="status-active">
                    {user?.status ||
                      "Active"}
                  </strong>

                </div>

              </div>

            )}

          </div>


          {/* =================================
              STATISTICS
              ================================= */}

          <div className="profile-card">

            <div className="profile-card-heading">

              <div>

                <h2>
                  Task Statistics
                </h2>

                <p>
                  Your current task
                  performance.
                </p>

              </div>

              <span>
                📊
              </span>

            </div>


            <div className="profile-stats">

              <div className="profile-stat">

                <span>
                  Total Tasks
                </span>

                <strong>
                  {totalTasks}
                </strong>

              </div>


              <div className="profile-stat">

                <span>
                  Completed
                </span>

                <strong className="stat-green">
                  {completedTasks}
                </strong>

              </div>


              <div className="profile-stat">

                <span>
                  In Progress
                </span>

                <strong className="stat-blue">
                  {inProgressTasks}
                </strong>

              </div>


              <div className="profile-stat">

                <span>
                  Pending
                </span>

                <strong className="stat-orange">
                  {pendingTasks}
                </strong>

              </div>


              <div className="profile-stat">

                <span>
                  Overdue
                </span>

                <strong className="stat-red">
                  {overdueTasks}
                </strong>

              </div>

            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Profile;