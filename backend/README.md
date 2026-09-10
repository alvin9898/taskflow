# TaskFlow Backend

Express + MongoDB + JWT backend designed for the TaskFlow frontend.

## 1. Requirements

- Node.js 18+
- MongoDB local installation OR MongoDB Atlas

## 2. Install

```bash
cd backend
npm install
```

## 3. Environment

Copy `.env.example` to `.env` and set:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskflow
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

## 4. Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Health check:

```text
http://localhost:5000/api/health
```

## Main API

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- PUT `/api/auth/change-password`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password`

### Tasks
- GET `/api/tasks`
- GET `/api/tasks/my`
- GET `/api/tasks/:id`
- POST `/api/tasks`
- PUT `/api/tasks/:id`
- DELETE `/api/tasks/:id`

### Users
- GET `/api/users`
- GET `/api/users/:id`
- PUT `/api/users/:id`
- DELETE `/api/users/:id`

### Notifications
- GET `/api/notifications`
- PUT `/api/notifications/:id/read`
- PUT `/api/notifications/read-all`
- DELETE `/api/notifications/:id`

## Important frontend note

The current GitHub frontend stores users, tasks and notifications in `localStorage`. The backend above is ready, but the frontend must be changed from `localStorage` operations to `fetch`/Axios API calls before MongoDB persistence will be used.

The existing UI already has the concepts needed by the API: Manager/Admin task creation, task fields (title, description, assignee, priority, dates, tags, attachment name), user management, authentication, profile/password, and notifications.
