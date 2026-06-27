# Asap-Agap

**Asap-Agap: A Web-Based Decision Support System for Monitoring Emergency Resource Needs and Coordinating Resource Requests among Local Evacuation Centers**

A full-stack web application for authorized evacuation center coordinators, designated camp management personnel, and the Local Disaster Risk Reduction and Management Office (LDRRMO) at the LGU level.

## Tech stack

| Layer | Technology |
|-------|------------|
| Front-end | **React.js** (Vite) |
| Back-end | **Node.js** + Express |
| Database | **MySQL** |

## System modules

| Module | Description |
|--------|-------------|
| **A. Evacuation Center Management** | Register centers, maintain information, record evacuee counts and vulnerable populations |
| **B. Emergency Resource Monitoring** | Track food, water, medicines, hygiene kits, and sleeping kits (Sufficient / Low Stock / Critical) |
| **C. Resource Request Management** | Submit and track resource requests with priority, reason, date, and status |
| **D. Decision Support Dashboard** | LDRRMO consolidated view with priority rankings and critical shortage alerts |
| **E. Activity and Inventory Logs** | ICS-aligned audit trail of inventory updates and request changes |

See [docs/MODULES.md](docs/MODULES.md) for detailed scope mapping.

## Quick start

### Prerequisites

- Node.js 18+
- MySQL 8+ (running locally or remotely)

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure the database

The project can use either a local MySQL server or a Docker container.

For Docker:

```bash
docker compose up -d mysql
copy server\.env.example server\.env
```

For a local MySQL installation, update the credentials in `server/.env` to match your setup.

### 3. Initialize and seed MySQL

```bash
npm run db:init
npm run db:seed
```

### 4. Run the application

Terminal 1 — API server:

```bash
npm run dev:server
```

Terminal 2 — React front-end:

```bash
npm run dev:client
```

Open **http://localhost:5173**

### Demo accounts

| Username | Password | Role |
|----------|----------|------|
| `ldrrmo` | `ldrrmo123` | LDRRMO Officer (full dashboard) |
| `coordinator1` | `coord123` | Evacuation Center Coordinator (San Jose) |
| `campmgr` | `camp123` | Camp Management Personnel (Municipal Gym) |
| `coordinator2` | `coord123` | Evacuation Center Coordinator (Elementary School) |

## Project structure

```
thesis/
├── client/          React front-end (Vite)
├── server/          Express API + MySQL
├── docs/            Thesis-aligned documentation
└── evac-system/     Legacy vanilla JS prototype (reference only)
```

## Documentation

- [Setup guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Modules & scope](docs/MODULES.md)
- [System limitations](docs/LIMITATIONS.md)

## Production build

```bash
npm run build
npm start
```

The API serves the built React app from `client/dist` when deployed.

## Limitations

This system is a **decision-support tool** for LGU-level disaster response. It does not replace ICS procedures or LDRRMO authority. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) for the full list.
