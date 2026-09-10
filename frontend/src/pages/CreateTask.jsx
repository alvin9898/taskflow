import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import {
  createTask,
  getUsers,
} from "../api";
import "./CreateTask.css";

function CreateTask() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [attachment, setAttachment] = useState(null);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // =========================================
  // LOAD USERS FROM MONGODB
  // =========================================

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true);

        const data = await getUsers();

        setUsers(
          Array.isArray(data?.users)
            ? data.users
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load users:",
          error
        );

        alert(
          error.message ||
            "Failed to load team members."
        );
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  // =========================================
  // ACCESS CONTROL
  // =========================================

  const isAllowed =
    user?.role === "Manager" ||
    user?.role === "Admin";

  // =========================================
  // CREATE TASK
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    // Task title
    if (!title.trim()) {
      alert(
        "Please enter a task title."
      );
      return;
    }

    // Assignee
    if (!assignee) {
      alert(
        "Please select an assignee."
      );
      return;
    }

    // Date validation
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

    try {
      setSubmitting(true);

      const taskData = {
        title: title.trim(),

        description:
          description.trim(),

        assignedTo: assignee,

        priority,

        startDate,

        dueDate,

        tags: tags
          .split(",")
          .map((tag) =>
            tag.trim()
          )
          .filter(Boolean),

        /*
         Your current backend stores
         the attachment filename.
        */
        attachment: attachment
          ? attachment.name
          : "",
      };

      const response =
        await createTask(
          taskData
        );

      console.log(
        "Task created:",
        response
      );

      alert(
        "Task created successfully!"
      );

      /*
       Go back to All Tasks.
       The page will fetch the
       latest MongoDB data.
      */
      navigate("/tasks");

    } catch (error) {
      console.error(
        "Create task error:",
        error
      );

      alert(
        error.message ||
          "Failed to create task."
      );

    } finally {
      setSubmitting(false);
    }
  };

  // =========================================
  // ACCESS DENIED
  // =========================================

  if (!isAllowed) {
    return (
      <DashboardLayout>

        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >

          <h2>
            Access Denied
          </h2>

          <p>
            Only Managers and Admins
            can create tasks.
          </p>

        </div>

      </DashboardLayout>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <DashboardLayout>

      <div className="create-task-page">

        {/* =================================
            HEADER
            ================================= */}

        <div className="create-task-header">

          <div>

            <h1>
              Create New Task
            </h1>

            <p>
              Create and assign a new
              task to your team.
            </p>

          </div>

        </div>


        {/* =================================
            FORM CARD
            ================================= */}

        <div className="create-task-card">

          <form
            onSubmit={handleSubmit}
          >

            {/* =================================
                TASK INFORMATION
                ================================= */}

            <div className="form-section">

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
                  placeholder="Enter task title"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  required
                  disabled={submitting}
                />

              </div>


              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  placeholder="Describe the task..."
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows="5"
                  disabled={submitting}
                />

              </div>

            </div>


            {/* =================================
                ASSIGNMENT
                ================================= */}

            <div className="form-section">

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
                    value={assignee}
                    onChange={(e) =>
                      setAssignee(
                        e.target.value
                      )
                    }
                    required
                    disabled={
                      submitting ||
                      loadingUsers
                    }
                  >

                    <option value="">
                      {loadingUsers
                        ? "Loading team members..."
                        : "Select team member"}
                    </option>

                    {users.map(
                      (member) => (
                        <option
                          key={
                            member._id
                          }
                          value={
                            member._id
                          }
                        >
                          {member.name} (
                          {member.role})
                        </option>
                      )
                    )}

                  </select>

                  {!loadingUsers &&
                    users.length ===
                      0 && (
                      <small>
                        No team members
                        available.
                      </small>
                    )}

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
                    disabled={
                      submitting
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


            {/* =================================
                SCHEDULE
                ================================= */}

            <div className="form-section">

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
                    disabled={
                      submitting
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
                    disabled={
                      submitting
                    }
                  />

                </div>

              </div>

            </div>


            {/* =================================
                ADDITIONAL DETAILS
                ================================= */}

            <div className="form-section">

              <h2>
                Additional Details
              </h2>


              <div className="form-group">

                <label>
                  Tags
                </label>

                <input
                  type="text"
                  placeholder="e.g. frontend, urgent, website"
                  value={tags}
                  onChange={(e) =>
                    setTags(
                      e.target.value
                    )
                  }
                  disabled={
                    submitting
                  }
                />

                <small>
                  Separate multiple
                  tags with commas.
                </small>

              </div>


              <div className="form-group">

                <label>
                  Attachment
                </label>

                <input
                  type="file"
                  onChange={(e) =>
                    setAttachment(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                  disabled={
                    submitting
                  }
                />

                {attachment && (
                  <small>
                    Selected:{" "}
                    {
                      attachment.name
                    }
                  </small>
                )}

              </div>

            </div>


            {/* =================================
                ACTIONS
                ================================= */}

            <div className="create-task-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  navigate(
                    "/tasks"
                  )
                }
                disabled={submitting}
              >
                Cancel
              </button>


              <button
                type="submit"
                className="create-task-btn"
                disabled={
                  submitting ||
                  loadingUsers
                }
              >
                {submitting
                  ? "Creating..."
                  : "Create Task"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default CreateTask;