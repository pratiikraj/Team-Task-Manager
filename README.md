# Foreman — Team Task Manager

A full-stack web app for teams to run projects, assign tasks, and track progress with role-based access.

**Live URL:** 

---

## What it does

- Sign up / log in with email and password
- Create projects — the creator becomes the Admin
- Admins invite members by email and pick their role (Admin or Member)
- Tasks have a title, description, priority (Low / Medium / High), due date, assignee, and status (To Do / In Progress / Done)
- Kanban board with drag-and-drop between status columns
- Members can update the status of tasks assigned to them. Admins can edit anything.
- Dashboard with total tasks, breakdown by status, overdue count, and load per person
- Dashboard works across all your projects or scoped to one

## Stack

- **Frontend:** React 18, Vite, React Router v6, plain CSS
- **Backend:** Node.js, Express, JWT auth, bcrypt, express-validator
- **Database:** MongoDB (Mongoose)
- **Deployment:** Railway — single service that serves both the API and the built React app

## Project structure

```
team-task-manager/
├── server/
│   ├── index.js              Express entry, serves built client
│   ├── models/               Mongoose schemas: User, Project, Task
│   ├── routes/               auth, projects, tasks, users, dashboard
│   ├── middleware/auth.js    JWT verification
│   └── .env.example
├── client/
│   ├── index.html
│   └── src/
│       ├── api/client.js     fetch wrapper
│       ├── context/          Auth context
│       ├── components/       Navbar, TaskModal, MembersPanel
│       ├── pages/            Landing, Login, Signup, Dashboard, Projects, ProjectDetail
│       └── styles/global.css
├── nixpacks.toml             Railway build config
├── railway.json
├── package.json
└── README.md
```

## Running locally

You need Node.js 18 or newer and a MongoDB connection string (MongoDB Atlas free tier works fine).

```bash
git clone https://github.com/YOUR_USERNAME/team-task-manager.git
cd team-task-manager
```

**Set up the backend:**

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and fill in your values:

```
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/teamtaskmgr
JWT_SECRET=a_long_random_hex_string
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then install and run:

```bash
npm install
npm run dev
```

The API runs on `http://localhost:5000`.

**Set up the frontend** in a second terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api/*` calls to the backend.

Open `http://localhost:5173` in your browser.

## Environment variables

Set these on your Railway service:

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URI` | Yes | Full MongoDB connection string including the database name |
| `JWT_SECRET` | Yes | Long random string for signing tokens |
| `NODE_ENV` | No | Set to `production` on Railway |
| `PORT` | No | Railway sets this automatically |
| `CLIENT_ORIGIN` | No | Only needed if frontend is hosted separately |

## Deploying to Railway

1. Push the code to a GitHub repository.
2. On Railway, create a new project and pick **Deploy from GitHub repo**.
3. In the service's **Variables** tab, add `MONGO_URI`, `JWT_SECRET`, and `NODE_ENV=production`.
4. For MongoDB, create a free cluster on MongoDB Atlas. In Atlas → **Network Access**, add `0.0.0.0/0` so Railway can connect.
5. Railway uses the included `nixpacks.toml` to build: it installs both server and client dependencies, runs `vite build`, then starts the Express server which serves the built React app from `client/dist`.
6. In **Settings → Networking**, click **Generate Domain** to get a public URL.

The Express server serves the React app at the root, so the frontend and API live on the same origin. No CORS setup needed.

## API reference

All routes are prefixed with `/api`. Authenticated routes require `Authorization: Bearer <jwt>`.

**Auth**

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/signup` | `{ name, email, password }` | Returns `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` | Returns `{ token, user }` |
| GET | `/auth/me` | — | Returns the current user |

**Projects**

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/projects` | required | Lists projects you're a member of |
| POST | `/projects` | required | Body: `{ name, description }`. Creator becomes Admin and owner. |
| GET | `/projects/:id` | required | Must be a member |
| DELETE | `/projects/:id` | required | Owner only. Also deletes all tasks. |
| POST | `/projects/:id/members` | Admin only | Body: `{ email, role }` |
| DELETE | `/projects/:id/members/:userId` | Admin only | Can't remove the owner |

**Tasks**

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/tasks?project=<id>` | required | Filter optional; omit for all your tasks |
| POST | `/tasks` | Admin of project | Body: `{ project, title, description, priority, status, assignee, dueDate }` |
| PATCH | `/tasks/:id` | Admin: any field. Assignee: status only. | |
| DELETE | `/tasks/:id` | Admin only | |

**Dashboard**

| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard?project=<id>` | Project filter optional. Returns total, byStatus, perUser, overdue |

**Users**

| Method | Path | Notes |
|---|---|---|
| GET | `/users/search?q=<query>` | Minimum 2 chars. For member invite UI. |

## Design notes

- Roles are scoped per project. A user can be Admin in one project and Member in another.
- When a member is removed from a project, their assigned tasks get unassigned rather than deleted.
- Passwords are hashed with bcrypt (10 rounds). The `passwordHash` field has `select: false` so it's never returned in queries.
- JWTs expire after 7 days.
- The Kanban board uses the native HTML5 drag-and-drop API — no extra library.
- Frontend uses optimistic updates for drag-and-drop; if the server rejects, the UI rolls back.
- Build output (`client/dist`) is served as static files by Express, so there's only one service to deploy.
