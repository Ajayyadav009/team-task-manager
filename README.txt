# Team Task Manager

A full-stack web app for managing projects and tasks across a team. Built with React on the frontend and Node/Express on the backend, with MongoDB as the database.

---

## What it does

You register an account as either an Admin or a Member. Admins create projects, add teammates to those projects, create tasks, and assign them to members. Members log in and see the projects they've been added to, then work through their assigned tasks.

There's also a per-project dashboard that shows task completion stats, overdue items, and (if you're an admin) how each team member is progressing.

---

## Tech stack

**Frontend**
- React 18 with Vite
- Tailwind CSS v4
- React Router v7
- Axios for API calls
- react-hot-toast for notifications

**Backend**
- Node.js + Express 5
- MongoDB with Mongoose
- JWT for auth (7-day expiry)
- bcryptjs for password hashing

---

## Project structure

```
team-task-manager/
├── frontend/          React app
│   └── src/
│       ├── pages/     Login, Register, Projects, Tasks, Dashboard
│       ├── components/  Navbar, PrivateRoute
│       ├── context/   Auth context
│       └── api/       Axios instance
└── backend/
    ├── routes/        auth, projects, tasks, dashboard
    ├── models/        User, Project, Task
    ├── middleware/    JWT protect, isAdmin
    └── server.js
```

---

## Getting started

You'll need Node.js and a MongoDB connection (Atlas or local).

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=pick_something_long_and_random
```

Then start the server:

```bash
npm run dev      # with nodemon (recommended for dev)
npm start        # production
```

The API will be running at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173` by default. It proxies API requests to port 5000.

---

## Roles

**Admin**
- Create projects (only admins can do this)
- Add and remove members from projects
- Create, edit, and delete tasks
- Assign tasks to members
- View the full project dashboard

**Member**
- View projects they've been added to
- See their assigned tasks
- Update the status of their own tasks (todo → in progress → done)
- View their personal task summary on the dashboard

---

## API overview

| Method | Endpoint | Who |
|--------|----------|-----|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/projects` | Any member |
| POST | `/api/projects` | Admin only |
| POST | `/api/projects/:id/members` | Project admin |
| DELETE | `/api/projects/:id/members/:userId` | Project admin |
| GET | `/api/tasks/project/:projectId` | Members (filtered by role) |
| POST | `/api/tasks` | Project admin |
| PATCH | `/api/tasks/:id` | Project admin |
| PATCH | `/api/tasks/:id/status` | Assigned member or admin |
| DELETE | `/api/tasks/:id` | Project admin |
| GET | `/api/dashboard/:projectId` | Members (filtered by role) |

---

## Notes

- Passwords are hashed with bcrypt before storing, plain text is never saved
- JWT tokens are stored in localStorage on the client side
- A project always needs at least one admin — the last admin can't be removed
- Members only see tasks assigned to them, admins see everything in the project
- The dashboard stats are calculated server-side using MongoDB aggregation
