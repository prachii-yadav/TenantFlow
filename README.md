# TenantFlow

A full-stack **multi-tenant user management platform** with role-based access control (RBAC). Manage tenant organizations (Sites), members (Users), and permission groups (Roles) through a permission-aware admin dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs |
| Frontend | React 19, Vite, Tailwind CSS v4, Recharts, React Icons (Heroicons v2), Axios |

---

## Project Structure

```
TenantFlow/
├── backend/
│   ├── server.js
│   ├── seed.js
│   └── src/
│       ├── app.js
│       ├── config/db.js
│       ├── middleware/       # authMiddleware (protect, isSuperAdmin, isManager), errorHandler
│       ├── models/           # User, Role, Site
│       ├── controllers/      # auth, user, role, site, dashboard
│       └── routes/
└── frontend/
    └── src/
        ├── api/              # axios instance + auth, users, roles, sites, dashboard
        ├── context/          # AuthContext (user, login, logout, refreshUser)
        ├── hooks/            # useRole (isSuperAdmin, isManager, canCreate, canEdit, canDelete)
        ├── components/       # Layout, Sidebar, Modal, Badge, Spinner, Pagination, ProtectedRoute
        └── pages/            # Login, Dashboard, Users, Roles, Sites, Profile
```

---

## Features

### Authentication
- JWT login — stored in `localStorage`, attached to every request via Axios interceptor
- Wrong-credential errors show an **inline error banner** on the login page (the 401 interceptor skips the login endpoint so it doesn't redirect prematurely)
- Deactivated users are rejected at the middleware level even with a valid token

### Dashboard
- **Super Admin** — global stats (Total Users, Active, Inactive, Roles, Sites) + **Users per Site** bar chart
- **Admin / Manager / Viewer** — same stats scoped to their own site + **Users by Role** bar chart

### User Management
- Paginated + searchable table; logged-in user is excluded (managed via Profile)
- **Create / Edit / Deactivate / Activate / Delete** — all destructive actions use confirmation modals (no `window.confirm`)
- Site is **pre-filled and disabled** for non-Super-Admin creators (locked to their own site)
- Super Admin has no site field in the create form or profile

### Profile
- View name, email, role, status (site hidden for Super Admin)
- Edit name, email, or password via an inline modal; sidebar updates immediately on save

### Role & Site Management
- Roles — full CRUD, accessible to Admin and above
- Sites — full CRUD, **Super Admin only** (hidden from sidebar for all other roles)

---

## Role-Based Access Control

| Permission | Super Admin | Admin | Manager | Viewer |
|---|:---:|:---:|:---:|:---:|
| Dashboard — global | ✅ | — | — | — |
| Dashboard — site-scoped | — | ✅ | ✅ | ✅ |
| View users (all sites) | ✅ | — | — | — |
| View users (own site) | — | ✅ | ✅ | ✅ |
| Create users | ✅ | ✅ | Viewer only | — |
| Edit users | ✅ | ✅ | Viewer only | — |
| Delete / Deactivate | ✅ | ✅ | — | — |
| Manage roles | ✅ | ✅ | — | — |
| Manage sites | ✅ | — | — | — |
| Own profile | ✅ | ✅ | ✅ | ✅ |

**Manager restrictions (enforced on both frontend and backend):**
- Can only create/edit users with the **Viewer** role
- Action buttons are hidden for non-Viewer rows in the user table
- Backend returns 403 if these rules are violated via direct API calls

**Super Admin guardrails:**
- Cannot be assigned to any user (blocked in UI dropdown + backend validation)
- Has no site affiliation (`siteId: null`) — site field hidden across sidebar, profile, and user forms

---

## API Reference

All routes prefixed with `/api/v1`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login — returns JWT + user |
| GET | `/auth/me` | Current authenticated user |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List (excludes self, scoped by role) |
| POST | `/users` | Create |
| PUT | `/users/:id` | Update |
| DELETE | `/users/:id` | Hard delete |
| PATCH | `/users/:id/deactivate` | Soft deactivate |
| PATCH | `/users/:id/activate` | Reactivate |

### Roles / Sites / Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET/POST/PUT/DELETE | `/roles`, `/roles/:id` | Role CRUD |
| GET/POST/PUT/DELETE | `/sites`, `/sites/:id` | Site CRUD (Super Admin only) |
| GET | `/dashboard` | Role-scoped stats + chart data |

---

## Getting Started

**Prerequisites:** Node.js v18+, MongoDB (local or Atlas free tier)

```bash
# 1. Clone
git clone https://github.com/prachii-yadav/TenantFlow.git && cd TenantFlow

# 2. Backend
cd backend && cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, CLIENT_URL
npm install && npm run dev            # starts on http://localhost:5000

# 3. Seed
node seed.js

# 4. Frontend (new terminal)
cd ../frontend && npm install && npm run dev   # starts on http://localhost:5175
```

### Environment Variables (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `CLIENT_URL` | Yes | Frontend origin for CORS (e.g. `http://localhost:5175`) |
| `PORT` | No | Server port (default `5000`) |
| `JWT_EXPIRES_IN` | No | Token expiry (default `7d`) |

---

## Default Credentials

| Role | Email | Password | Site |
|---|---|---|---|
| Super Admin | superadmin@tenantflow.com | superadmin123 | — |
| Admin | admin@acne.com | admin123 | Acme Corp |
| Manager | manager@acme.com | manager123 | Acme Corp |
| Viewer | viewer@beta.com | viewer123 | Beta Inc |
| Admin | admin@beta.io | admin123 | Beta Inc |

> Run `node seed.js` from `backend/` at any time to reset to this state.
