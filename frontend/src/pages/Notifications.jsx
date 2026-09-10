import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import "./Notifications.css";

const API_BASE = "http://localhost:5000/api";

/* =========================================
   GET TOKEN
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

  const response = await fetch(
    `${API_BASE}${url}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    }
  );

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
   GET ID
   ========================================= */

function getId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return String(
      value._id ||
        value.id ||
        ""
    );
  }

  return String(value);
}

/* =========================================
   FORMAT TIME
   ========================================= */

function formatTime(dateValue) {
  if (!dateValue) {
    return "Just now";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Just now";
  }

  const now =
    new Date();

  const difference =
    Math.floor(
      (now - date) / 1000
    );

  if (
    difference < 60
  ) {
    return "Just now";
  }

  const minutes =
    Math.floor(
      difference / 60
    );

  if (
    minutes < 60
  ) {
    return `${minutes} minute${
      minutes !== 1
        ? "s"
        : ""
    } ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (
    hours < 24
  ) {
    return `${hours} hour${
      hours !== 1
        ? "s"
        : ""
    } ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (
    days < 7
  ) {
    return `${days} day${
      days !== 1
        ? "s"
        : ""
    } ago`;
  }

  return date.toLocaleDateString();
}

/* =========================================
   NORMALIZE NOTIFICATION
   ========================================= */

function normalizeNotification(
  notification
) {
  const originalType =
    String(
      notification.type ||
        ""
    );

  const title =
    notification.title ||
    "Notification";

  const message =
    notification.message ||
    "";

  const searchText =
    `${title} ${message}`
      .toLowerCase();

  let type =
    originalType.toLowerCase();

  /*
   Backend notification types:
   Task
   User
   System
   Comment

   Frontend filters:
   assignment
   comment
   update
   deadline
  */

  if (
    type === "comment"
  ) {
    type = "comment";
  } else if (
    searchText.includes(
      "deadline"
    ) ||
    searchText.includes(
      "due tomorrow"
    ) ||
    searchText.includes(
      "due today"
    )
  ) {
    type = "deadline";
  } else if (
    type === "task" &&
    (
      searchText.includes(
        "assigned"
      ) ||
      searchText.includes(
        "assignment"
      )
    )
  ) {
    type = "assignment";
  } else {
    type = "update";
  }

  return {
    id:
      notification._id ||
      notification.id,

    type,

    title,

    message,

    read:
      Boolean(
        notification.isRead ??
          notification.read
      ),

    taskId:
      getId(
        notification.relatedTaskId
      ),

    userId:
      getId(
        notification.relatedUserId
      ),

    createdAt:
      notification.createdAt,

    time:
      formatTime(
        notification.createdAt
      ),
  };
}

/* =========================================
   COMPONENT
   ========================================= */

function Notifications() {
  const { user } =
    useAuth();

  const navigate =
    useNavigate();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("All");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =========================================
     LOAD NOTIFICATIONS
     ========================================= */

  const loadNotifications =
    async () => {
      try {
        setLoading(true);

        setError("");

        const data =
          await apiRequest(
            "/notifications"
          );

        const backendNotifications =
          Array.isArray(
            data.notifications
          )
            ? data.notifications
            : Array.isArray(
                data.data?.notifications
              )
            ? data.data.notifications
            : [];

        const normalized =
          backendNotifications.map(
            normalizeNotification
          );

        setNotifications(
          normalized
        );

      } catch (
        requestError
      ) {
        console.error(
          "Failed to load notifications:",
          requestError
        );

        setError(
          requestError.message ||
            "Unable to load notifications."
        );

        setNotifications([]);

      } finally {
        setLoading(false);
      }
    };

  /* =========================================
     INITIAL LOAD
     ========================================= */

  useEffect(() => {
    loadNotifications();

    /*
     Listen for changes from
     other pages.
    */

    const handleNotificationUpdate =
      () => {
        loadNotifications();
      };

    window.addEventListener(
      "taskflowNotificationsUpdated",
      handleNotificationUpdate
    );

    window.addEventListener(
      "taskflowTasksUpdated",
      handleNotificationUpdate
    );

    return () => {
      window.removeEventListener(
        "taskflowNotificationsUpdated",
        handleNotificationUpdate
      );

      window.removeEventListener(
        "taskflowTasksUpdated",
        handleNotificationUpdate
      );
    };
  }, []);

  /* =========================================
     FILTERED NOTIFICATIONS
     ========================================= */

  const filteredNotifications =
    activeFilter === "All"
      ? notifications
      : activeFilter ===
        "Unread"
      ? notifications.filter(
          (notification) =>
            !notification.read
        )
      : notifications.filter(
          (notification) =>
            notification.type ===
            activeFilter
        );

  /* =========================================
     COUNTS
     ========================================= */

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;

  const assignmentCount =
    notifications.filter(
      (notification) =>
        notification.type ===
        "assignment"
    ).length;

  const commentCount =
    notifications.filter(
      (notification) =>
        notification.type ===
        "comment"
    ).length;

  const updateCount =
    notifications.filter(
      (notification) =>
        notification.type ===
        "update"
    ).length;

  /* =========================================
     MARK ONE AS READ
     ========================================= */

  const markAsRead =
    async (id) => {
      try {
        /*
         Optimistic UI update
        */

        setNotifications(
          (current) =>
            current.map(
              (notification) =>
                String(
                  notification.id
                ) === String(id)
                  ? {
                      ...notification,
                      read: true,
                    }
                  : notification
            )
        );

        await apiRequest(
          `/notifications/${id}/read`,
          {
            method: "PUT",
          }
        );

      } catch (
        requestError
      ) {
        console.error(
          "Failed to mark notification as read:",
          requestError
        );

        /*
         Reload from MongoDB
         if the request failed.
        */

        loadNotifications();
      }
    };

  /* =========================================
     MARK ALL AS READ
     ========================================= */

  const markAllAsRead =
    async () => {
      try {
        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                read: true,
              })
            )
        );

        await apiRequest(
          "/notifications/mark-all-read",
          {
            method: "PUT",
          }
        );

      } catch (
        requestError
      ) {
        console.error(
          "Failed to mark all notifications as read:",
          requestError
        );

        loadNotifications();
      }
    };

  /* =========================================
     CLICK NOTIFICATION
     ========================================= */

  const handleNotificationClick =
    async (
      notification
    ) => {
      /*
       Mark as read first.
      */

      if (
        !notification.read
      ) {
        await markAsRead(
          notification.id
        );
      }

      /*
       Open related task
      */

      if (
        notification.taskId
      ) {
        navigate(
          `/tasks/${notification.taskId}`
        );
      }
    };

  /* =========================================
     ICON
     ========================================= */

  const getNotificationIcon =
    (type) => {
      if (
        type ===
        "assignment"
      ) {
        return "📋";
      }

      if (
        type ===
        "comment"
      ) {
        return "💬";
      }

      if (
        type ===
        "deadline"
      ) {
        return "⏰";
      }

      if (
        type ===
        "update"
      ) {
        return "🔄";
      }

      return "🔔";
    };

  /* =========================================
     LOADING
     ========================================= */

  if (loading) {
    return (
      <DashboardLayout>

        <div className="notifications-page">

          <div className="notifications-header">

            <div>

              <p className="notifications-label">
                Updates
              </p>

              <h1>
                Notifications
              </h1>

              <p className="notifications-subtitle">
                Loading your notifications...
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

      <div className="notifications-page">

        {/* =================================
            HEADER
            ================================= */}

        <div className="notifications-header">

          <div>

            <p className="notifications-label">
              Updates
            </p>

            <h1>
              Notifications
            </h1>

            <p className="notifications-subtitle">
              Stay updated with your tasks
              and team activity.
            </p>

          </div>

          {unreadCount > 0 && (
            <button
              className="mark-all-btn"
              onClick={
                markAllAsRead
              }
            >
              ✓ Mark all as read
            </button>
          )}

        </div>

        {/* =================================
            ERROR
            ================================= */}

        {error && (
          <div
            style={{
              marginBottom:
                "16px",

              padding:
                "12px 16px",

              borderRadius:
                "8px",

              background:
                "#fff1f1",

              color:
                "#b42318",
            }}
          >
            {error}
          </div>
        )}

        {/* =================================
            SUMMARY CARDS
            ================================= */}

        <div className="notification-stats">

          <div className="notification-stat">

            <div className="notification-stat-icon blue">
              🔔
            </div>

            <div>

              <span>
                Total
              </span>

              <strong>
                {notifications.length}
              </strong>

            </div>

          </div>

          <div className="notification-stat">

            <div className="notification-stat-icon red">
              ●
            </div>

            <div>

              <span>
                Unread
              </span>

              <strong>
                {unreadCount}
              </strong>

            </div>

          </div>

          <div className="notification-stat">

            <div className="notification-stat-icon purple">
              📋
            </div>

            <div>

              <span>
                Assignments
              </span>

              <strong>
                {assignmentCount}
              </strong>

            </div>

          </div>

          <div className="notification-stat">

            <div className="notification-stat-icon green">
              💬
            </div>

            <div>

              <span>
                Comments
              </span>

              <strong>
                {commentCount}
              </strong>

            </div>

          </div>

        </div>

        {/* =================================
            FILTERS
            ================================= */}

        <div className="notification-filters">

          <button
            className={
              activeFilter ===
              "All"
                ? "notification-filter active"
                : "notification-filter"
            }
            onClick={() =>
              setActiveFilter(
                "All"
              )
            }
          >
            All
          </button>

          <button
            className={
              activeFilter ===
              "Unread"
                ? "notification-filter active"
                : "notification-filter"
            }
            onClick={() =>
              setActiveFilter(
                "Unread"
              )
            }
          >
            Unread

            {unreadCount >
              0 && (
              <span>
                {unreadCount}
              </span>
            )}

          </button>

          <button
            className={
              activeFilter ===
              "assignment"
                ? "notification-filter active"
                : "notification-filter"
            }
            onClick={() =>
              setActiveFilter(
                "assignment"
              )
            }
          >
            Assignments
          </button>

          <button
            className={
              activeFilter ===
              "comment"
                ? "notification-filter active"
                : "notification-filter"
            }
            onClick={() =>
              setActiveFilter(
                "comment"
              )
            }
          >
            Comments
          </button>

          <button
            className={
              activeFilter ===
              "update"
                ? "notification-filter active"
                : "notification-filter"
            }
            onClick={() =>
              setActiveFilter(
                "update"
              )
            }
          >
            Updates
          </button>

        </div>

        {/* =================================
            NOTIFICATION CARD
            ================================= */}

        <div className="notifications-card">

          <div className="notifications-card-header">

            <div>

              <h2>
                Recent Notifications
              </h2>

              <p>
                {unreadCount >
                0
                  ? `${unreadCount} unread notification${
                      unreadCount !==
                      1
                        ? "s"
                        : ""
                    }`
                  : "You're all caught up"}
              </p>

            </div>

            <span>
              {updateCount >
              0
                ? `${updateCount} updates`
                : ""}
            </span>

          </div>

          {/* =================================
              LIST
              ================================= */}

          <div className="notifications-list">

            {filteredNotifications.length >
            0 ? (

              filteredNotifications.map(
                (
                  notification
                ) => (

                  <div
                    key={
                      notification.id
                    }
                    className={
                      notification.read
                        ? "notification-item"
                        : "notification-item unread"
                    }
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                  >

                    {/* ICON */}

                    <div
                      className={`notification-icon ${notification.type}`}
                    >
                      {getNotificationIcon(
                        notification.type
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="notification-content">

                      <div className="notification-title-row">

                        <h3>
                          {
                            notification.title
                          }
                        </h3>

                        {!notification.read && (
                          <span className="unread-dot">
                          </span>
                        )}

                      </div>

                      <p>
                        {
                          notification.message
                        }
                      </p>

                      <div className="notification-meta">

                        <span>
                          🕒{" "}
                          {
                            notification.time
                          }
                        </span>

                        {notification.taskId && (
                          <span>
                            View task →
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                )
              )

            ) : (

              <div className="empty-notifications">

                <div className="empty-notification-icon">
                  🔔
                </div>

                <h2>
                  No notifications
                </h2>

                <p>
                  {activeFilter ===
                  "Unread"
                    ? "You have no unread notifications."
                    : "You're all caught up!"}
                </p>

              </div>

            )}

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Notifications;