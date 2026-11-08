# TaskFlow — Vercel-ready configuration

This project is configured to deploy the React/Vite frontend and Express API in one Vercel project. The frontend calls the API on the same origin at `/api`; it no longer hardcodes localhost or a Render URL.

## Before deploying

1. Push this project to a GitHub repository. Do not commit `.env` files or `node_modules`.
2. Import the repository into Vercel with the **project root set to the repository root** (not `frontend`).
3. Add these Vercel Environment Variables for Production (and Preview if needed):
   - `MONGO_URI`: your MongoDB Atlas connection string.
   - `JWT_SECRET`: a long, random secret used to sign tokens.
   - `CLIENT_URL`: optional, your production frontend URL, e.g. `https://your-project.vercel.app`.
4. Deploy. Vercel builds `frontend` and routes `/api/*` to the Express serverless function.
5. Test `https://YOUR-VERCEL-DOMAIN/api/health`.

## Local development

Terminal 1:

```bash
cd backend
npm install
npm run dev
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Set `MONGO_URI` and `JWT_SECRET` in `backend/.env` for local use. The Vite proxy sends `/api` requests to `http://localhost:5000` locally.

## Important

Vercel does not host a MongoDB database. Use MongoDB Atlas and ensure its network access settings allow connections from your deployed function. Never commit real credentials in `.env`.
