# Task Management System

A full-stack task management application that lets teams create, assign, and track
tasks collaboratively in real time. Built for INTE 21323.

> **Current status:** Backend API is feature-complete — authentication (login,
> logout, JWT refresh with rotation, mandatory first-login reset), user management,
> projects, tasks, labels, comments, file attachments (Supabase Storage), real-time
> notifications (Socket.IO), and interactive Swagger API docs are implemented. The
> React frontend is not built yet.

## Project Structure

```
task-management-system/
├── client/          # React frontend (not yet scaffolded)
├── server/
│   ├── controllers/ # Route handler logic
│   ├── routes/      # Express route definitions
│   ├── middleware/  # Custom middleware (auth, RBAC, etc.)
│   ├── services/    # Business logic + data access
│   ├── jobs/        # Scheduled background jobs (node-cron)
│   ├── db/          # Database schema (schema.sql)
│   ├── utils/       # Shared helpers (Supabase client)
│   ├── .env.example # Environment variable template
│   └── index.js     # Server entry point
├── .gitignore
└── README.md
```

## Tech Stack

### Backend

- **Express 5** — Web framework
- **Supabase (PostgreSQL)** (`@supabase/supabase-js`) — Database, accessed server-side
  with the service-role key
- **jsonwebtoken** — JWT access tokens
- **bcryptjs** — Password hashing
- **express-validator** — Input validation
- **helmet** / **cors** / **cookie-parser** — Security & request middleware
- **express-rate-limit** — Global + per-route (login) rate limiting
- **node-cron** — Scheduled jobs (expired refresh-token cleanup)
- **socket.io** — Real-time notifications (JWT-authenticated, per-user rooms)
- **swagger-jsdoc** / **swagger-ui-express** — Interactive API docs at `/api/docs`
- **dotenv** — Environment configuration

### Frontend

- **React** — UI library *(planned; not yet scaffolded)*

## Getting Started

### Prerequisites

- Node.js (v18+)
- A Supabase project (or any PostgreSQL database) with the schema in
  [`server/db/schema.sql`](server/db/schema.sql) applied
- npm

### Database Setup

Run the SQL in `server/db/schema.sql` against your database (e.g. via the Supabase
SQL editor) to create the tables, enums, and indexes.

### Server Setup

```bash
cd server
cp .env.example .env
# Fill in .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, etc.
npm install
npm run dev        # starts on http://localhost:8000 with nodemon
```

Health check: `GET http://localhost:8000/health` → `{ "status": "ok" }`

### Client Setup

The React client has not been scaffolded yet. Setup steps will be added here once
it exists.

## API

Auth endpoints (base path `/api/auth`):

| Method | Endpoint           | Auth        | Description                                              |
|--------|--------------------|-------------|----------------------------------------------------------|
| POST   | `/login`           | —           | Log in with email + password; returns an access token and sets the refresh-token cookie. Rate-limited to 10/15min. |
| POST   | `/refresh`         | cookie      | Exchange the refresh-token cookie for a new access token (rotates the refresh token). |
| POST   | `/logout`          | Bearer      | Revoke the current refresh token and clear the cookie.   |
| POST   | `/change-password` | Bearer      | Change password; revokes all other sessions and clears the mandatory-reset flag. |

### Interactive API docs

With the server running, open **`http://localhost:8000/api/docs`** for the full
Swagger UI (try endpoints in-browser). The raw OpenAPI spec is at
`http://localhost:8000/api/docs.json`.

To authorize protected endpoints in Swagger UI: call `POST /api/auth/login`, copy
the `accessToken`, click **Authorize**, and paste it.

## Team Member Contributions

_To be completed._
