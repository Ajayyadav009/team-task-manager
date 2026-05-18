# Team Task Manager

A full-stack project and task management platform built for teams to collaborate efficiently. The application allows admins to create projects, assign tasks, manage team members, and monitor overall project progress, while members can track and update their assigned work.

Built with React, Node.js, Express, and MongoDB.

---

# Features

## Authentication & Authorization
- Secure user registration and login
- JWT-based authentication
- Role-based access control (Admin / Member)
- Password hashing using bcryptjs

## Project Management
- Create and manage projects
- Add or remove project members
- Maintain project-specific access permissions

## Task Management
- Create, edit, delete, and assign tasks
- Task status workflow:
  - Todo
  - In Progress
  - Done
- Due dates and overdue tracking

## Dashboard & Analytics
- Project-wise task statistics
- Completion tracking
- Overdue task monitoring
- Team performance overview for admins

---

# Tech Stack

## Frontend
- React 18
- Vite
- Tailwind CSS v4
- React Router v7
- Axios
- react-hot-toast

## Backend
- Node.js
- Express.js 5
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs

---

# Folder Structure

```bash
team-task-manager/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

# Local Setup

## Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB Atlas account or local MongoDB server

---

# Backend Setup

## 1. Navigate to backend folder

```bash
cd backend
```

## 2. Install dependencies

```bash
npm install
```

## 3. Create `.env` file inside backend folder

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```

## 4. Start backend server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

Backend runs at:

```bash
http://localhost:5000
```

---

# Frontend Setup

## 1. Navigate to frontend folder

```bash
cd frontend
```

## 2. Install dependencies

```bash
npm install
```

## 3. Create `.env` file inside frontend folder

```env
VITE_API_URL=http://localhost:5000
```

## 4. Start frontend

```bash
npm run dev
```

Frontend runs at:

```bash
http://localhost:5173
```

---

# User Roles

## Admin
- Create projects
- Add/remove members
- Create and assign tasks
- Edit or delete tasks
- Access complete project dashboard
- Monitor team performance

## Member
- View assigned projects
- View assigned tasks
- Update task status
- Access personal dashboard stats

---

# API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/projects` | Authenticated |
| POST | `/api/projects` | Admin |
| POST | `/api/projects/:id/members` | Project Admin |
| DELETE | `/api/projects/:id/members/:userId` | Project Admin |
| GET | `/api/tasks/project/:projectId` | Project Members |
| POST | `/api/tasks` | Project Admin |
| PATCH | `/api/tasks/:id` | Project Admin |
| PATCH | `/api/tasks/:id/status` | Assigned Member/Admin |
| DELETE | `/api/tasks/:id` | Project Admin |
| GET | `/api/dashboard/:projectId` | Project Members |

---

# Security Features

- Passwords are hashed before storing
- JWT authentication with token expiry
- Protected API routes
- Role-based authorization
- Users can only access project-specific resources

---

# Deployment Guide (Render)

# Step 1: Push Project to GitHub

Initialize git and push your project:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

---

# Backend Deployment on Render

## 1. Open Render

Go to:

```bash
https://render.com
```

## 2. Create New Web Service

- Click **New +**
- Select **Web Service**
- Connect your GitHub repository

---

## 3. Configure Backend

Use these settings:

| Setting | Value |
|---|---|
| Name | team-task-manager-backend |
| Root Directory | backend |
| Environment | Node |
| Build Command | npm install |
| Start Command | npm start |

---

## 4. Add Environment Variables

Inside Render dashboard add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```

---

## 5. Deploy Backend

After deployment you will get a backend URL like:

```bash
https://team-task-manager-backend.onrender.com
```

Copy this URL.

---

# Frontend Deployment on Render

## 1. Create New Static Site

- Click **New +**
- Select **Static Site**
- Connect same GitHub repository

---

## 2. Configure Frontend

Use these settings:

| Setting | Value |
|---|---|
| Name | team-task-manager-frontend |
| Root Directory | frontend |
| Build Command | npm run build |
| Publish Directory | dist |

---

## 3. Add Frontend Environment Variable

```env
VITE_API_URL=https://team-task-manager-backend.onrender.com
```

Replace with your actual backend URL.

---

## 4. Deploy Frontend

After deployment Render will provide a frontend URL like:

```bash
https://team-task-manager-frontend.onrender.com
```

---

# Important Deployment Notes

## Backend CORS Setup

Make sure your backend allows frontend requests:

```javascript
app.use(
  cors({
    origin: "https://your-frontend-url.onrender.com",
    credentials: true,
  })
);
```

---

## Frontend Axios Base URL

Example Axios setup:

```javascript
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

---

# Future Improvements

- Real-time notifications
- WebSocket integration
- File attachments in tasks
- Activity logs
- Comments on tasks
- Email reminders
- Team chat system
- Dark mode support

---

# Notes

- JWT tokens are stored in localStorage
- MongoDB aggregation is used for dashboard statistics
- A project must always contain at least one admin
- Members only see tasks assigned to them
- Admins have full project visibility

---

# Author

Developed by Ajay 🚀