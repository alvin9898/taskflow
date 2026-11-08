# TaskFlow

TaskFlow is a task management application with a React/Vite frontend, an Express API, and MongoDB.

## Deployment

The project has been prepared for a **single Vercel deployment**. The frontend uses the same-origin `/api` path, and Vercel routes API requests to the Express serverless function.

See [README-VERCEL.md](README-VERCEL.md) for deployment and environment-variable instructions.

## Security

- Do not commit `.env` files, database connection strings, JWT secrets, or `node_modules`.
- Set `MONGO_URI` and `JWT_SECRET` in Vercel Project Settings → Environment Variables.
- MongoDB must be hosted separately, for example on MongoDB Atlas.
