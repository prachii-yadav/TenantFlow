# TenantFlow

A full-stack **multi-tenant user management platform** with role-based access control (RBAC). TenantFlow lets platform administrators manage tenant organizations (Sites), their members (Users), and permission groups (Roles) through a clean, permission-aware admin dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Design](#database-design)
- [Project Structure](#project-structure)
- [Features](#features)
- [Role-Based Access Control](#role-based-access-control)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seeding the Database](#seeding-the-database)
- [Default Credentials](#default-credentials)

---

## Overview

TenantFlow is built around three core entities:

- **Sites** — tenant organizations (e.g. "Acme Corp", "Beta Inc")
- **Roles** — named permission groups (Super Admin, Admin, Manager, Viewer)
- **Users** — members who belong to a site and are assigned a role

The platform enforces strict data isolation: non-Super-Admin users can only see and manage data within their own site. A special **Super Admin** role has global access across all sites and tenants and cannot be assigned via the UI or API.

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JSON Web Tokens (JWT) | Stateless authentication |
| bcryptjs | Password hashing (pre-save hook) |
| dotenv | Environment configuration |
| nodemon | Development auto-reload |

### Frontend

| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework & build tool |
| React Router v7 | Client-side routing & protected routes |
| Tailwind CSS v4 | Utility-first styling |
| Recharts | Dashboard bar charts |
| React Icons (Heroicons v2) | Consistent SVG icon set |
| react-hot-toast | Toast notifications |
| Axios | HTTP client with request/response interceptors |

---

## Architecture

```
Browser  (React + Vite  →  localhost:5175)
        │
        │  HTTP + JWT Bearer token
        │  (Vite proxies /api/* → localhost:5000 in dev)
        ▼
Express REST API  (/api/v1/...)   localhost:5000
        │
        │  Mongoose ODM
        ▼
MongoDB Atlas
```

### Request Lifecycle

1. User submits login form → `POST /api/v1/auth/login`
2. Backend validates credentials, signs a JWT, returns it with the user object
3. React stores the JWT in `localStorage` (`tf_token`) and hydrates `AuthContext`
4. All subsequent API calls attach `Authorization: Bearer <token>` via an Axios request interceptor
5. Express `protect` middleware verifies the JWT and attaches `req.user` to every protected route
6. Controllers query MongoDB, enforce site-level scoping, and return JSON

---

## Database Design

### Collections

#### Site
```
{
  _id:       ObjectId
  name:      String  (required, unique)
  domain:    String
  createdAt: Date
  updatedAt: Date
}
```

#### Role
```
{
  _id:         ObjectId
  name:        String  (required, unique)   e.g. "Super Admin", "Admin", "Manager", "Viewer"
  description: String
  createdAt:   Date
  updatedAt:   Date
}
```

#### User
```
{
  _id:       ObjectId
  name:      String   (required)
  email:     String   (required, unique, lowercase)
  password:  String   (bcrypt hashed, never returned in responses)
  siteId:    ObjectId → ref: Site   (null for Super Admin)
  roleId:    ObjectId → ref: Role   (required)
  isActive:  Boolean  (default: true)
  createdAt: Date
  updatedAt: Date
}
```

### Relationships

```
Site  (1) ──────< User (many)
Role  (1) ──────< User (many)
```

- A **Site** is a tenant container — regular users belong to exactly one site
- A **Role** is global — the same role definition applies across all sites
- **Super Admin** users have `siteId: null` (no site affiliation)

---

## Project Structure

```
TenantFlow/
├── backend/
│   ├── server.js                      # Entry point — connects DB and starts server
│   ├── seed.js                        # Database seeder (clears + repopulates)
│   ├── .env.example                   # Environment variable template
│   └── src/
│       ├── app.js                     # Express setup: CORS, body parser, route mounting
│       ├── config/
│       │   └── db.js                  # MongoDB connection via Mongoose
│       ├── middleware/
│       │   ├── authMiddleware.js      # JWT protect() + isSuperAdmin() helper
│       │   └── errorHandler.js        # Centralised error response formatter
│       ├── models/
│       │   ├── User.js                # Schema + bcrypt pre-save hook + toJSON transform
│       │   ├── Role.js                # Schema
│       │   └── Site.js                # Schema
│       ├── controllers/
│       │   ├── authController.js      # login, getMe
│       │   ├── userController.js      # Full CRUD + activate/deactivate
│       │   ├── roleController.js      # Full CRUD
│       │   ├── siteController.js      # Full CRUD
│       │   └── dashboardController.js # Aggregated stats + chart data (role-scoped)
│       └── routes/
│           ├── authRoutes.js
│           ├── userRoutes.js
│           ├── roleRoutes.js
│           ├── siteRoutes.js
│           └── dashboardRoutes.js
│
└── frontend/
    └── src/
        ├── api/
        │   ├── axios.js               # Axios instance with JWT + 401-redirect interceptors
        │   ├── auth.js
        │   ├── users.js
        │   ├── roles.js
        │   ├── sites.js
        │   └── dashboard.js
        ├── context/
        │   └── AuthContext.jsx        # Global auth state: user, login, logout, refreshUser
        ├── hooks/
        │   └── useRole.js             # Derived flags: isSuperAdmin, canCreate, canEdit, canDelete
        ├── components/
        │   ├── Layout.jsx             # Sidebar + main content wrapper
        │   ├── Sidebar.jsx            # Navigation with Heroicons, role-filtered links
        │   ├── ProtectedRoute.jsx     # Redirects unauthenticated users to /login
        │   ├── SuperAdminRoute.jsx    # Restricts routes to Super Admin only
        │   ├── Modal.jsx              # Reusable dialog overlay
        │   ├── Badge.jsx              # Active / Inactive status pill
        │   ├── Spinner.jsx            # Loading indicator
        │   └── Pagination.jsx         # Page controls
        └── pages/
            ├── Login.jsx              # JWT login with inline error banner
            ├── Dashboard.jsx          # Stats cards + role-aware bar chart
            ├── Users.jsx              # CRUD table with confirm modals
            ├── Roles.jsx              # Role management
            ├── Sites.jsx              # Site management (Super Admin only)
            └── Profile.jsx            # Logged-in user's own info + edit modal
```

---

## Features

### Authentication
- JWT login — token stored in `localStorage`, attached to every request by an Axios interceptor
- On any `401` response the interceptor clears the token and redirects to `/login`, **except** for the login endpoint itself — so wrong-credential responses display an inline red error banner instead of silently redirecting
- `AuthContext` hydrates the logged-in user on app load via `GET /auth/me`
- `refreshUser()` exposed from `AuthContext` so the Profile page can sync name/email changes to the sidebar without a page reload
- `ProtectedRoute` wraps all non-login pages
- `SuperAdminRoute` restricts the Sites page to Super Admin only
- Deactivated users are rejected at the middleware level even if their token is still valid

### Dashboard (`/dashboard`)
- **Super Admin** view — global stats: Total Users, Active Users, Inactive Users, Roles, Sites + **Users per Site** bar chart
- **Site-scoped** view (Admin, Manager, Viewer) — same stats limited to their own site + **Users by Role** bar chart
- Stat cards use colour-coded Heroicons v2 icons (indigo, green, amber, purple, sky)

### User Management (`/users`)
- Paginated, searchable user table (search by name or email)
- The **logged-in user is excluded** from the list — they manage their own account via `/profile`
- **Create**: name, email, password, site, role — Super Admin is filtered out of the role dropdown
- **Edit**: update any field; leave password blank to keep the current one
- **Deactivate / Activate**: soft toggle — uses a colour-coded confirmation modal (amber/green)
- **Delete**: hard delete — uses a red confirmation modal
- Non-Super-Admins can only see users within their own site

### Role Management (`/roles`)
- List, create, edit, and delete roles
- Accessible to all authenticated users (visibility of action buttons gated by `useRole`)

### Site Management (`/sites`)
- List, create, edit, and delete tenant sites
- Hidden from the sidebar and route-guarded for all non-Super-Admin roles

### Profile (`/profile`)
- Shows the logged-in user's avatar initial, name, email, role, site, and active status
- Pencil edit icon in the card header opens a modal to update name, email, or password
- Role and Site are read-only (only an Admin can change another user's role/site)
- On save, calls `refreshUser()` to update the sidebar and header immediately

### Confirmation Modals
- All destructive or irreversible actions use a custom `Modal`-based confirm dialog — no `window.confirm()`
- Button colour signals intent: **red** (Delete), **amber** (Deactivate), **green** (Activate)

### Super Admin Guardrails
- Super Admin **cannot be assigned** when creating or editing a user — enforced in the frontend dropdown filter AND as a backend 400 validation
- Super Admin users have **no site** (`siteId: null`) — the User model makes `siteId` optional

---

## Role-Based Access Control

### Permission Matrix

| Permission | Super Admin | Admin | Manager | Viewer |
|---|:---:|:---:|:---:|:---:|
| Dashboard — global (all sites) | ✅ | — | — | — |
| Dashboard — site-scoped | — | ✅ | ✅ | ✅ |
| View users (all sites) | ✅ | — | — | — |
| View users (own site) | — | ✅ | ✅ | ✅ |
| Create users | ✅ | ✅ | — | — |
| Edit users | ✅ | ✅ | ✅ | — |
| Delete / Deactivate users | ✅ | ✅ | — | — |
| Manage roles | ✅ | ✅ | — | — |
| Manage sites | ✅ | — | — | — |
| View & edit own profile | ✅ | ✅ | ✅ | ✅ |

### How permissions are enforced

**Backend** — the `isSuperAdmin(req.user)` helper in `authMiddleware.js` checks `user.roleId.name === 'super admin'` (case-insensitive). Controllers use this to scope queries, reject forbidden operations, and return 403s.

**Frontend** — the `useRole` hook derives `isSuperAdmin`, `canCreate`, `canEdit`, `canDelete` from `AuthContext`. These flags control visibility of buttons, table columns, and entire pages. The backend is the authoritative enforcement layer.

---

## API Reference

All routes are prefixed with `/api/v1`. Protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Validate credentials, return JWT + user |
| GET | `/auth/me` | Protected | Return the current authenticated user |

**Login request body:**
```json
{ "email": "admin@tenantflow.com", "password": "admin123" }
```

**Login response:**
```json
{
  "token": "<jwt>",
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@tenantflow.com",
    "siteId": { "_id": "...", "name": "Acme Corp" },
    "roleId": { "_id": "...", "name": "Admin" },
    "isActive": true
  }
}
```

---

### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List users (excludes self; scoped by role) |
| POST | `/users` | Create a user (Super Admin role blocked) |
| GET | `/users/:id` | Get a single user |
| PUT | `/users/:id` | Update a user (Super Admin role blocked) |
| DELETE | `/users/:id` | Hard delete |
| PATCH | `/users/:id/deactivate` | Soft deactivate (`isActive: false`) |
| PATCH | `/users/:id/activate` | Reactivate (`isActive: true`) |

**Query parameters (GET /users):**
```
?page=1&limit=10&search=jane&siteId=<id>&roleId=<id>
```

**Create / Update body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@acme.com",
  "password": "secret123",
  "siteId": "<site_id>",
  "roleId": "<role_id>"
}
```

---

### Roles

| Method | Endpoint | Description |
|---|---|---|
| GET | `/roles` | List all roles |
| POST | `/roles` | Create a role |
| GET | `/roles/:id` | Get a single role |
| PUT | `/roles/:id` | Update a role |
| DELETE | `/roles/:id` | Delete a role |

---

### Sites

| Method | Endpoint | Description |
|---|---|---|
| GET | `/sites` | List all sites |
| POST | `/sites` | Create a site |
| GET | `/sites/:id` | Get a single site |
| PUT | `/sites/:id` | Update a site |
| DELETE | `/sites/:id` | Delete a site |

---

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Role-scoped stats + chart data |

**Super Admin response:**
```json
{
  "totalUsers": 6,
  "activeUsers": 5,
  "inactiveUsers": 1,
  "totalRoles": 4,
  "totalSites": 2,
  "chart": [
    { "label": "Acme Corp", "count": 3 },
    { "label": "Beta Inc",  "count": 3 }
  ]
}
```

**Site-scoped (Admin / Manager / Viewer) response:**
```json
{
  "totalUsers": 3,
  "activeUsers": 3,
  "inactiveUsers": 0,
  "totalRoles": 4,
  "usersPerRole": [
    { "roleName": "Admin",   "count": 1 },
    { "roleName": "Manager", "count": 1 },
    { "roleName": "Viewer",  "count": 1 }
  ]
}
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)

### 1. Clone the repository
```bash
git clone https://github.com/prachii-yadav/TenantFlow.git
cd TenantFlow
```

### 2. Configure and start the backend
```bash
cd backend
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET (see Environment Variables below)
npm install
npm run dev
```
API starts on `http://localhost:5000`

### 3. Seed the database
```bash
# Still inside backend/
node seed.js
```

### 4. Start the frontend
```bash
cd ../frontend
npm install
npm run dev
```
App starts on `http://localhost:5175`

### 5. Open the app
Visit `http://localhost:5175` and log in with any of the seeded accounts.

---

## Environment Variables

Create `backend/.env` from the template:

```bash
cd backend && cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Express server port |
| `MONGO_URI` | Yes | — | Full MongoDB connection string |
| `JWT_SECRET` | Yes | — | Secret used to sign JWTs (use a long random string) |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry (e.g. `1d`, `7d`, `30d`) |
| `CLIENT_URL` | Yes | — | Frontend origin for CORS (e.g. `http://localhost:5175`) |

---

## Seeding the Database

```bash
cd backend
node seed.js
```

The seeder:
1. Clears all existing Users, Roles, and Sites
2. Creates **4 roles**: Super Admin, Admin, Manager, Viewer
3. Creates **2 sites**: Acme Corp, Beta Inc
4. Creates **6 users** covering all roles and states

> Re-run at any time to reset to a clean state.

---

## Default Credentials

| Role | Email | Password | Site |
|---|---|---|---|
| Super Admin | superadmin@tenantflow.com | superadmin123 | — (global, no site) |
| Admin | admin@tenantflow.com | admin123 | Acme Corp |
| Admin | admin@beta.io | admin123 | Beta Inc |
| Manager | manager@tenantflow.com | manager123 | Acme Corp |
| Viewer | viewer@tenantflow.com | viewer123 | Beta Inc |
| Inactive | inactive@tenantflow.com | inactive123 | Beta Inc |
