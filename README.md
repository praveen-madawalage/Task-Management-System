# Task Management System

A full-stack task management application built with Node.js, Express, and React.

## Project Structure

```
task-management-system/
├── client/          # React frontend
├── server/
│   ├── controllers/ # Route handler logic
│   ├── routes/      # Express route definitions
│   ├── middleware/   # Custom middleware (auth, validation, etc.)
│   ├── services/    # Business logic layer
│   ├── db/          # Database configuration and queries
│   ├── utils/       # Utility/helper functions
│   ├── .env.example # Environment variable template
│   └── index.js     # Server entry point
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- npm

### Server Setup

```bash
cd server
cp .env.example .env
# Update .env with your database credentials
npm install
npm run dev
```

### Client Setup

```bash
cd client
npm install
npm start
```

## Tech Stack

### Backend

- **Express** — Web framework
- **PostgreSQL** (`pg`) — Database
- **jsonwebtoken** / **bcryptjs** — Authentication
- **Socket.IO** — Real-time communication
- **node-cron** — Scheduled tasks
- **dotenv** — Environment configuration
- **cors** / **cookie-parser** — Middleware

### Frontend

- **React** — UI library
