
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { createTask, getUsers, getMyTeam } from "../api";
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

  const isAllowed =
    user?.role === "Manager" || user?.role === "Admin";

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        setLoadingUsers(true);

        // Managers can access only their own team.
        // Admins can access all users.
        const response =
          user?.role === "Manager"
            ? await getMyTeam()
            : user?.role === "Admin"
              ? await getUsers()
              : { users: [] };

        if (cancelled) return;

        const members = Array.isArray(response?.users)
          ? response.users
          : [];

        setUsers(members);

        if (members.length === 0) {
          console.warn("No eligible assignees were returned.");
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load users:", error);
        alert(error.message || "Failed to load team members.");
        setUsers([]);
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    }

    if (isAllowed) {
      loadUsers();
    } else {
      setLoadingUsers(false);
    }

    return () => {
      cancelled = true;
    };
  }, [user?.role, isAllowed]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    if (!title.trim()) {
      alert("Please enter a task title.");
      return;
    }

    if (!assignee) {
      alert("Please select an assignee.");
      return;
    }

    // Ensure the selected assignee came from the loaded eligible users.
    const selectedMember = users.find(
      (member) => member._id === assignee
    );

    if (!selectedMember) {
      alert("Please select a valid team member.");
      return;
    }

    if (
      startDate &&
      dueDate &&
      new Date(dueDate) < new Date(startDate)
    ) {
      alert("Due date cannot be before the start date.");
      return;
    }

    try {
     
setSubmitting(true);

let attachmentPath = "";

if (attachment) {
  const token = localStorage.getItem("taskflow_token");

  const formData = new FormData();
  formData.append("file", attachment);

  const uploadResponse = await fetch("/api/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const uploadData = await uploadResponse.json();

  if (!uploadResponse.ok) {
    throw new Error(
      uploadData.message || "File upload failed."
    );
  }

  attachmentPath = uploadData.attachment;
}

const taskData = {
  title: title.trim(),
  description: description.trim(),
  assignedTo: assignee,
  priority,
  startDate: startDate || undefined,
  dueDate: dueDate || undefined,
  tags: tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),
  attachment: attachmentPath,
};

await createTask(taskData);


      alert("Task created successfully!");
      navigate("/tasks");
    } catch (error) {
      console.error("Create task error:", error);
      alert(error.message || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAllowed) {
    return (
      <DashboardLayout>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h2>Access Denied</h2>
          <p>Only Managers and Admins can create tasks.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="create-task-page">
        <div className="create-task-header">
          <div>
            <h1>Create New Task</h1>
            <p>Create and assign a new task to your team.</p>
          </div>
        </div>

        <div className="create-task-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Task Information</h2>

              <div className="form-group">
                <label>
                  Task Title <span>*</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  placeholder="Describe the task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="5"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Assignment</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Assign To <span>*</span>
                  </label>

                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    required
                    disabled={submitting || loadingUsers}
                  >
                    <option value="">
                      {loadingUsers
                        ? "Loading team members..."
                        : "Select team member"}
                    </option>

                    {users.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>

                  {!loadingUsers && users.length === 0 && (
                    <small>
                      No eligible users found. Check that you have
                      Team Members assigned to your Manager account.
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Priority</label>

                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={submitting}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Schedule</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Additional Details</h2>

              <div className="form-group">
                <label>Tags</label>

                <input
                  type="text"
                  placeholder="e.g. frontend, urgent, website"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={submitting}
                />

                <small>Separate multiple tags with commas.</small>
              </div>

              <div className="form-group">
                <label>Attachment</label>

                <input
                  type="file"
                  onChange={(e) =>
                    setAttachment(e.target.files?.[0] || null)
                  }
                  disabled={submitting}
                />

                {attachment && (
                  <small>Selected: {attachment.name}</small>
                )}
              </div>
            </div>

            <div className="create-task-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/tasks")}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-task-btn"
                disabled={
                  submitting || loadingUsers || users.length === 0
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
