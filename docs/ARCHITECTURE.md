# Architecture

## Overview

Asap-Agap follows a three-tier architecture:

```
┌─────────────────┐     HTTPS/JSON      ┌─────────────────┐     SQL      ┌─────────────┐
│  React Client   │ ◄─────────────────► │  Express API    │ ◄──────────► │   MySQL     │
│  (Vite, port    │      /api/*         │  (port 5000)    │              │  asap_agap  │
│   5173 dev)     │                     │                 │              │             │
└─────────────────┘                     └─────────────────┘              └─────────────┘
```

## Front-end (`client/`)

- **React 19** with **React Router** for navigation
- **Axios** for REST API calls
- **JWT** stored in `localStorage` (`asap-agap-token`)
- Role-based UI: LDRRMO sees the Decision Support Dashboard; field staff see **My Center**

### Key directories

| Path | Purpose |
|------|---------|
| `src/pages/` | Module screens (Dashboard, Centers, Resources, Requests, Logs) |
| `src/components/` | Layout, sidebar, modals, badges |
| `src/context/AuthContext.jsx` | Authentication state |
| `src/api/client.js` | API client and endpoint helpers |
| `src/constants.js` | Resource types, statuses, labels |

## Back-end (`server/`)

- **Express** REST API
- **mysql2** connection pool with named placeholders
- **bcryptjs** for password hashing
- **jsonwebtoken** for session tokens (12-hour expiry)

### API routes

| Prefix | Purpose |
|--------|---------|
| `POST /api/auth/login` | Sign in |
| `POST /api/auth/register` | Create coordinator account |
| `GET /api/auth/me` | Current user |
| `GET/POST/PUT/PATCH /api/centers` | Module A + evacuees + resources (B) |
| `GET/POST/PATCH /api/requests` | Module C |
| `GET /api/dashboard` | Module D (LDRRMO only) |
| `GET /api/logs` | Module E |
| `POST /api/admin/reset-demo` | Reset demo data (LDRRMO) |

### Authorization

| Role | Access |
|------|--------|
| `ldrrmo` | All centers, dashboard, request review |
| `coordinator` | Assigned center only |
| `camp_manager` | Assigned center only |

Middleware in `server/src/middleware/auth.js` validates JWT and enforces role checks.

## Database schema

| Table | Purpose |
|-------|---------|
| `users` | Authorized accounts |
| `evacuation_centers` | Center profile, evacuee counts, resource statuses |
| `resource_requests` | Module C requests |
| `activity_logs` | Module E audit trail |
| `system_counters` | ID sequences for centers and requests |

See `server/src/db/schema.sql` for full definitions.

## Priority engine

`server/src/services/priority.js` implements the decision-support scoring used in Module D. Factors:

- Number of evacuees and occupancy rate
- Critical and low-stock resource counts
- Vulnerable population ratio
- Pending request priority weights

Rankings are computed server-side and returned via `GET /api/dashboard`.

## Data flow example — submit resource request

1. Coordinator opens **Resource Requests** → **New Request**
2. React calls `POST /api/requests`
3. Server validates center access, inserts row, writes activity log
4. LDRRMO dashboard reflects updated pending count and priority rankings on next load

## Security notes (development)

- Change `JWT_SECRET` before any production deployment
- Use HTTPS in production
- Demo passwords are for demonstration only
