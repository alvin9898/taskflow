import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  assignManager,
} from "../api";
import "./UserManagement.css";

function UserManagement() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Team Member");
  const [newPhone, setNewPhone] = useState("");
  const [newDesignation, setNewDesignation] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("Team Member");
  const [editStatus, setEditStatus] = useState("Active");
  const [saving, setSaving] = useState(false);

  const [selectedManagers, setSelectedManagers] = useState({});
  const [assigningUserId, setAssigningUserId] = useState(null);

  const isAllowed = user?.role === "Admin";

  // LOAD USERS
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getUsers();
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (error) {
      console.error("Failed to load users:", error);
      alert(error.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAllowed) {
      loadUsers();
    }
  }, [isAllowed, loadUsers]);

  // FILTER USERS
  const filteredUsers = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return users.filter((member) => {
      const matchesSearch =
        !searchText ||
        member.name?.toLowerCase().includes(searchText) ||
        member.email?.toLowerCase().includes(searchText);

      const matchesRole =
        roleFilter === "All Roles" || member.role === roleFilter;

      const matchesStatus =
        statusFilter === "All Status" ||
        member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // STATISTICS
  const totalUsers = users.length;
  const activeUsers = users.filter(
    (member) => member.status === "Active"
  ).length;
  const inactiveUsers = users.filter(
    (member) => member.status === "Inactive"
  ).length;
  const adminUsers = users.filter(
    (member) => member.role === "Admin"
  ).length;
  const managerUsers = users.filter(
    (member) => member.role === "Manager"
  ).length;
  const teamMembers = users.filter(
    (member) => member.role === "Team Member"
  ).length;

  const managers = users.filter(
    (member) =>
      member.role === "Manager" && member.status === "Active"
  );

  // CREATE MANAGER OR TEAM MEMBER
  const handleCreateUser = async (event) => {
    event.preventDefault();

    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      alert("Name, email and password are required.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    const roleBeingCreated = newRole;

    try {
      setCreating(true);

      await createUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: roleBeingCreated,
        phone: newPhone.trim(),
        designation: newDesignation.trim(),
      });

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("Team Member");
      setNewPhone("");
      setNewDesignation("");
      setShowCreateForm(false);

      await loadUsers();

      alert(`${roleBeingCreated} account created successfully.`);
    } catch (error) {
      console.error("Create user error:", error);
      alert(error.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  // OPEN EDIT FORM
  const openEdit = (member) => {
    setEditingUser(member);
    setEditName(member.name || "");
    setEditEmail(member.email || "");
    setEditRole(member.role || "Team Member");
    setEditStatus(member.status || "Active");
  };

  // CLOSE EDIT FORM
  const closeEdit = () => {
    if (saving) return;

    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditRole("Team Member");
    setEditStatus("Active");
  };

  // UPDATE USER
  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingUser) return;

    if (!editName.trim() || !editEmail.trim()) {
      alert("Name and email are required.");
      return;
    }

    // Keep the existing Admin role fixed in this form.
    const roleToSave =
      editingUser.role === "Admin" ? "Admin" : editRole;

    try {
      setSaving(true);

      await updateUser(editingUser._id, {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: roleToSave,
        status: editStatus,
      });

      await loadUsers();

      setEditingUser(null);
      alert("User updated successfully.");
    } catch (error) {
      console.error("Update user error:", error);
      alert(error.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  // ASSIGN MANAGER
  const handleAssignManager = async (member) => {
    const managerId = selectedManagers[member._id];

    if (!managerId) {
      alert("Please select a Manager.");
      return;
    }

    try {
      setAssigningUserId(member._id);

      await assignManager(member._id, managerId);
      await loadUsers();

      alert("Manager assigned successfully.");
    } catch (error) {
      console.error("Assign manager error:", error);
      alert(error.message || "Failed to assign Manager.");
    } finally {
      setAssigningUserId(null);
    }
  };

  // DELETE USER
  const handleDelete = async (member) => {
    if (!member?._id) return;

    const currentUserId = user?._id || user?.id;

    if (String(member._id) === String(currentUserId)) {
      alert("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${member.name}?`
    );

    if (!confirmed) return;

    try {
      await deleteUser(member._id);
      await loadUsers();

      alert("User deleted successfully.");
    } catch (error) {
      console.error("Delete user error:", error);
      alert(error.message || "Failed to delete user.");
    }
  };

  // ACCESS CONTROL
  if (!isAllowed) {
    return (
      <DashboardLayout>
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Only the Admin can access User Management.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="user-management-page">
        {/* HEADER */}
        <div className="user-management-header">
          <div>
            <span className="user-management-label">
              ADMINISTRATION
            </span>

            <h1>User Management</h1>

            <p>
              Create accounts, manage roles and assign team members
              to managers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm((previous) => !previous)}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              background: "#4f46e5",
              color: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {showCreateForm ? "Close Form" : "+ Create User"}
          </button>
        </div>

        {/* STATISTICS */}
        <div className="user-management-stats">
          <div className="user-stat-card">
            <span>Total Users</span>
            <strong>{loading ? "..." : totalUsers}</strong>
          </div>

          <div className="user-stat-card">
            <span>Active Users</span>
            <strong>{loading ? "..." : activeUsers}</strong>
          </div>

          <div className="user-stat-card">
            <span>Inactive Users</span>
            <strong>{loading ? "..." : inactiveUsers}</strong>
          </div>

          <div className="user-stat-card">
            <span>Admins</span>
            <strong>{loading ? "..." : adminUsers}</strong>
          </div>

          <div className="user-stat-card">
            <span>Managers</span>
            <strong>{loading ? "..." : managerUsers}</strong>
          </div>

          <div className="user-stat-card">
            <span>Team Members</span>
            <strong>{loading ? "..." : teamMembers}</strong>
          </div>
        </div>

        {/* CREATE USER FORM */}
        {showCreateForm && (
          <div
            className="users-card"
            style={{ padding: "24px", marginBottom: "24px" }}
          >
            <h2 style={{ marginTop: 0 }}>Create New User</h2>

            <p>
              Create a Manager or Team Member account. Public registration
              remains disabled.
            </p>

            <form onSubmit={handleCreateUser}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                }}
              >
                <label>
                  Full Name *
                  <input
                    style={inputStyle}
                    type="text"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Email Address *
                  <input
                    style={inputStyle}
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Password *
                  <input
                    style={inputStyle}
                    type="password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    minLength={6}
                    required
                  />
                </label>

                <label>
                  Account Role *
                  <select
                    style={inputStyle}
                    value={newRole}
                    onChange={(event) => setNewRole(event.target.value)}
                  >
                    <option value="Team Member">Team Member</option>
                    <option value="Manager">Manager</option>
                  </select>
                </label>

                <label>
                  Phone
                  <input
                    style={inputStyle}
                    type="text"
                    value={newPhone}
                    onChange={(event) => setNewPhone(event.target.value)}
                  />
                </label>

                <label>
                  Designation
                  <input
                    style={inputStyle}
                    type="text"
                    value={newDesignation}
                    onChange={(event) =>
                      setNewDesignation(event.target.value)
                    }
                    placeholder="e.g. Developer"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={creating}
                style={primaryButtonStyle}
              >
                {creating ? "Creating..." : "Create Account"}
              </button>
            </form>
          </div>
        )}

        {/* SEARCH AND FILTERS */}
        <div className="users-toolbar">
          <input
            className="users-search"
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="users-filter"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="All Roles">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Team Member">Team Member</option>
          </select>

          <select
            className="users-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* USER LIST */}
        <div className="users-card">
          <div className="users-row users-heading">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
            <span>Manager Assignment</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="users-empty">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="users-empty">No users found.</div>
          ) : (
            filteredUsers.map((member) => {
              const assignedManager =
                member.manager && typeof member.manager === "object"
                  ? member.manager
                  : null;

              return (
                <div className="users-row" key={member._id}>
                  <div className="user-info">
                    <div className="user-avatar">
                      {member.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div>
                      <strong>{member.name}</strong>
                      <div className="user-status">
                        <span
                          className={
                            member.status === "Active"
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {member.status || "Active"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="user-email">{member.email}</span>

                  <span className="role-select">
                    {member.role}
                  </span>

                  <div>
                    {member.role === "Team Member" ? (
                      <>
                        <select
                          style={{
                            ...inputStyle,
                            minWidth: 120,
                            marginBottom: "6px",
                          }}
                          value={
                            selectedManagers[member._id] ||
                            assignedManager?._id ||
                            ""
                          }
                          onChange={(event) =>
                            setSelectedManagers((previous) => ({
                              ...previous,
                              [member._id]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select Manager</option>

                          {managers.map((manager) => (
                            <option
                              key={manager._id}
                              value={manager._id}
                            >
                              {manager.name}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleAssignManager(member)}
                          disabled={
                            assigningUserId === member._id ||
                            managers.length === 0
                          }
                          style={smallButtonStyle}
                        >
                          {assigningUserId === member._id
                            ? "Saving..."
                            : "Assign"}
                        </button>
                      </>
                    ) : member.role === "Manager" ? (
                      <span>Manages team members</span>
                    ) : (
                      <span>Full access</span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openEdit(member)}
                      style={smallButtonStyle}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      disabled={
                        String(member._id) ===
                        String(user?._id || user?.id)
                      }
                      style={{
                        ...smallButtonStyle,
                        background: "#fee2e2",
                        color: "#b91c1c",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* EDIT USER FORM */}
        {editingUser && (
          <div
            className="modal-overlay"
            onClick={closeEdit}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
            }}
          >
            <div
              className="modal-card"
              onClick={(event) => event.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "480px",
                background: "#ffffff",
                color: "#111827",
                borderRadius: "12px",
                padding: "24px",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <h2>Edit User</h2>

              <form onSubmit={handleUpdate}>
                <label>
                  Name
                  <input
                    style={inputStyle}
                    type="text"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    style={inputStyle}
                    type="email"
                    value={editEmail}
                    onChange={(event) => setEditEmail(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Role
                  <select
                    style={inputStyle}
                    value={editRole}
                    onChange={(event) => setEditRole(event.target.value)}
                    disabled={editingUser.role === "Admin"}
                  >
                    {editingUser.role === "Admin" ? (
                      <option value="Admin">Admin</option>
                    ) : (
                      <>
                        <option value="Manager">Manager</option>
                        <option value="Team Member">Team Member</option>
                      </>
                    )}
                  </select>
                </label>

                <label>
                  Account Status
                  <select
                    style={inputStyle}
                    value={editStatus}
                    onChange={(event) => setEditStatus(event.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={saving}
                    style={smallButtonStyle}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    style={primaryButtonStyle}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  marginTop: "6px",
  marginBottom: "14px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#111827",
};

const primaryButtonStyle = {
  padding: "11px 18px",
  border: "none",
  borderRadius: "7px",
  background: "#4f46e5",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
  marginTop: "10px",
};

const smallButtonStyle = {
  padding: "7px 10px",
  border: "none",
  borderRadius: "6px",
  background: "#e0e7ff",
  color: "#3730a3",
  fontWeight: 600,
  cursor: "pointer",
};

export default UserManagement;