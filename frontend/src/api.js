const API_URL = "https://taskflow-backend-sqgj.onrender.com/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("taskflow_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export async function loginUser(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function registerUser(name, email, password, role) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      role,
    }),
  });
}

export async function getCurrentUser() {
  return apiRequest("/auth/me");
}

export async function getTasks() {
  return apiRequest("/tasks");
}

export async function getMyTasks() {
  return apiRequest("/tasks/my");
}

export async function createTask(task) {
  return apiRequest("/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function updateTask(id, task) {
  return apiRequest(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(task),
  });
}

export async function getTask(id) {
  return apiRequest(`/tasks/${id}`);
}

export async function deleteTask(id) {
  return apiRequest(`/tasks/${id}`, {
    method: "DELETE",
  });
}

export async function getUsers() {
  return apiRequest("/users");
}

export async function updateUser(id, user) {
  return apiRequest(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(user),
  });
}

export async function deleteUser(id) {
  return apiRequest(`/users/${id}`, {
    method: "DELETE",
  });
}
export async function getNotifications() {
  return apiRequest("/notifications");
}