# Team Task Manager

A full-stack MERN app where users can create projects, assign tasks, and track progress with role-based access for admins and members.

## Features

- Signup and login with JWT authentication
- Admin/member role-based access control
- Project CRUD with team members
- Task creation, assignment, due dates, priorities, and status tracking
- Dashboard with task totals, status breakdowns, overdue work, and project progress
- REST API with validation and MongoDB relationships
- Railway-ready build/start scripts

## Tech Stack

- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt

## Local Setup

1. Install dependencies:

```bash
npm install
npm run install:all
```

2. Create `server/.env` from `server/.env.example`.

3. Start MongoDB locally or use a MongoDB Atlas connection string.

4. Run the app:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Demo Accounts

Create an admin by signing up with role `Admin`. Member accounts can sign up with role `Member`.

## Railway Deployment

Set these Railway environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- `NODE_ENV=production`
- `CLIENT_URL` if the frontend is hosted separately

Railway can deploy this repo with:

- Build command: `npm run build`
- Start command: `npm start`

In production, Express serves the React build from `client/dist`.

## API Overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/dashboard`
