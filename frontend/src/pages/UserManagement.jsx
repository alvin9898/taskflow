import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import {
  getUsers,
  updateUser,
  deleteUser,
} from "../api";
import "./UserManagement.css";

function UserManagement() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("All Roles");
  const [statusFilter, setStatusFilter] =
    useState("All Status");

  const [editingUser, setEditingUser] =
    useState(null);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] =
    useState("Team Member");
  const [editStatus, setEditStatus] =
    useState("Active");

  const [saving, setSaving] = useState(false);

  // =========================================
  // ACCESS CONTROL
  // =========================================

  const isAllowed =
    user?.role === "Admin" ||
    user?.role === "Manager";

  // =========================================
  // LOAD USERS FROM MONGODB
  // =========================================

  const loadUsers = async () => {
    try {
      setLoading(true);

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
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAllowed) {
      loadUsers();
    }
  }, [isAllowed]);

  // =========================================
  // SEARCH + FILTER
  // =========================================

  const filteredUsers = useMemo(() => {
    return users.filter((member) => {
      const searchText =
        search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        member.name
          ?.toLowerCase()
          .includes(searchText) ||
        member.email
          ?.toLowerCase()
          .includes(searchText);

      const matchesRole =
        roleFilter === "All Roles" ||
        member.role === roleFilter;

      const matchesStatus =
        statusFilter === "All Status" ||
        member.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  // =========================================
  // STATISTICS
  // =========================================

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (member) =>
      member.status === "Active"
  ).length;

  const inactiveUsers = users.filter(
    (member) =>
      member.status === "Inactive"
  ).length;

  const adminUsers = users.filter(
    (member) =>
      member.role === "Admin"
  ).length;

  const managerUsers = users.filter(
    (member) =>
      member.role === "Manager"
  ).length;

  const teamMembers = users.filter(
    (member) =>
      member.role === "Team Member"
  ).length;

  // =========================================
  // OPEN EDIT MODAL
  // =========================================

  const openEdit = (member) => {
    setEditingUser(member);

    setEditName(member.name || "");
    setEditEmail(member.email || "");
    setEditRole(
      member.role || "Team Member"
    );
    setEditStatus(
      member.status || "Active"
    );
  };

  // =========================================
  // CLOSE EDIT MODAL
  // =========================================

  const closeEdit = () => {
    if (saving) return;

    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditRole("Team Member");
    setEditStatus("Active");
  };

  // =========================================
  // UPDATE USER
  // =========================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingUser) return;

    if (!editName.trim()) {
      alert("Name is required.");
      return;
    }

    if (!editEmail.trim()) {
      alert("Email is required.");
      return;
    }

    try {
      setSaving(true);

      const data = await updateUser(
        editingUser._id,
        {
          name: editName.trim(),
          email: editEmail
            .trim()
            .toLowerCase(),
          role: editRole,
          status: editStatus,
        }
      );

      const updatedUser =
        data?.user;

      setUsers((currentUsers) =>
        currentUsers.map((member) =>
          member._id === editingUser._id
            ? {
                ...member,
                ...(updatedUser || {
                  name: editName.trim(),
                  email: editEmail
                    .trim()
                    .toLowerCase(),
                  role: editRole,
                  status: editStatus,
                }),
              }
            : member
        )
      );

      alert(
        "User updated successfully!"
      );

      closeEdit();
    } catch (error) {
      console.error(
        "Update user error:",
        error
      );

      alert(
        error.message ||
          "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // DELETE USER
  // =========================================

  const handleDelete = async (member) => {
    if (!member?._id) return;

    // Don't allow deleting yourself
    if (
      String(member._id) ===
      String(user?._id || user?.id)
    ) {
      alert(
        "You cannot delete your own account."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${member.name}?`
    );

    if (!confirmed) return;

    try {
      await deleteUser(member._id);

      setUsers((currentUsers) =>
        currentUsers.filter(
          (item) =>
            item._id !== member._id
        )
      );

      alert(
        "User deleted successfully!"
      );
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      alert(
        error.message ||
          "Failed to delete user."
      );
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
          <h2>Access Denied</h2>

          <p>
            Only Managers and Admins can
            access user management.
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
      <div className="user-management-page">

        {/* HEADER */}

        <div className="page-header">
          <div>
            <h1>User Management</h1>

            <p>
              Manage users, roles and
              account status.
            </p>
          </div>
        </div>

        {/* STATISTICS */}

        <div className="user-stats">

          <div className="stat-card">
            <span>Total Users</span>
            <strong>
              {loading ? "..." : totalUsers}
            </strong>
          </div>

          <div className="stat-card">
            <span>Active</span>
            <strong>
              {loading ? "..." : activeUsers}
            </strong>
          </div>

          <div className="stat-card">
            <span>Inactive</span>
            <strong>
              {loading ? "..." : inactiveUsers}
            </strong>
          </div>

          <div className="stat-card">
            <span>Admins</span>
            <strong>
              {loading ? "..." : adminUsers}
            </strong>
          </div>

          <div className="stat-card">
            <span>Managers</span>
            <strong>
              {loading ? "..." : managerUsers}
            </strong>
          </div>

          <div className="stat-card">
            <span>Team Members</span>
            <strong>
              {loading ? "..." : teamMembers}
            </strong>
          </div>

        </div>

        {/* FILTERS */}

        <div className="user-controls">

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value)
            }
          >
            <option>All Roles</option>
            <option>Admin</option>
            <option>Manager</option>
            <option>Team Member</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>

        </div>

        {/* USERS TABLE */}

        <div className="users-table">

          <div className="users-row users-heading">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="no-users">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="no-users">
              No users found.
            </div>
          ) : (
            filteredUsers.map((member) => (
              <div
                className="users-row"
                key={member._id}
              >

                <span>
                  {member.name}
                </span>

                <span>
                  {member.email}
                </span>

                <span>
                  {member.role}
                </span>

                <span>
                  {member.status}
                </span>

                <span className="user-actions">

                  <button
                    type="button"
                    onClick={() =>
                      openEdit(member)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(member)
                    }
                    disabled={
                      String(member._id) ===
                      String(
                        user?._id ||
                          user?.id
                      )
                    }
                  >
                    Delete
                  </button>

                </span>

              </div>
            ))
          )}

        </div>

        {/* =================================
            EDIT USER MODAL
            ================================= */}

        {editingUser && (
          <div
            className="modal-overlay"
            onClick={closeEdit}
          >

            <div
              className="modal-card"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <h2>
                Edit User
              </h2>

              <form
                onSubmit={handleUpdate}
              >

                <div className="form-group">
                  <label>
                    Name
                  </label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) =>
                      setEditName(
                        e.target.value
                      )
                    }
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) =>
                      setEditEmail(
                        e.target.value
                      )
                    }
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Role
                  </label>

                  <select
                    value={editRole}
                    onChange={(e) =>
                      setEditRole(
                        e.target.value
                      )
                    }
                    disabled={
                      saving ||
                      user?.role !==
                        "Admin"
                    }
                  >
                    <option value="Admin">
                      Admin
                    </option>

                    <option value="Manager">
                      Manager
                    </option>

                    <option value="Team Member">
                      Team Member
                    </option>
                  </select>

                  {user?.role !==
                    "Admin" && (
                    <small>
                      Only Admins can
                      change user roles.
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Status
                  </label>

                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(
                        e.target.value
                      )
                    }
                    disabled={saving}
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </div>

                <div className="modal-actions">

                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
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

export default UserManagement;