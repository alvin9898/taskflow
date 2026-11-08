# TaskFlow API

The Express application is exported from `app.js` for Vercel serverless hosting and started locally by `server.js`.

## Environment variables

- `MONGO_URI`: MongoDB connection string (use MongoDB Atlas for deployment).
- `JWT_SECRET`: long random secret for JWT signing.
- `PORT`: optional local server port (defaults to 5000).
- `CLIENT_URL`: optional comma-separated frontend origin allowlist.

For the single-project Vercel setup, configure `MONGO_URI` and `JWT_SECRET` under Vercel Project Settings → Environment Variables. See the root `README-VERCEL.md`.
