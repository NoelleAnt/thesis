# Setup Guide

This guide walks through installing and running **Asap-Agap** on a development machine.

## Requirements

- **Node.js** 18 or newer
- **MySQL** 8 or newer
- Internet connectivity (required for access and updates per system limitations)

## Step 1 — Clone or open the project

```bash
cd thesis
```

## Step 2 — Install packages

From the project root:

```bash
npm run install:all
```

This installs dependencies for both `server/` and `client/`.

## Step 3 — Configure MySQL

1. Ensure MySQL is running.
2. Copy the example environment file:

   **Windows (PowerShell):**
   ```powershell
   Copy-Item server\.env.example server\.env
   ```

   **macOS / Linux:**
   ```bash
   cp server/.env.example server/.env
   ```

3. Edit `server/.env`:

   ```env
   PORT=5000
   CLIENT_ORIGIN=http://localhost:5173

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=asap_agap

   JWT_SECRET=use-a-long-random-string-here
   ```

## Step 4 — Create schema and seed demo data

```bash
npm run db:init
npm run db:seed
```

- `db:init` creates the `asap_agap` database and all tables.
- `db:seed` loads demo evacuation centers, users, requests, and activity logs.

To reset demo data later:

```bash
npm run db:seed
```

Or use **Reset Demo Data** in the LDRRMO user menu while logged in.

## Step 5 — Start development servers

**Terminal 1 — API (port 5000):**

```bash
npm run dev:server
```

**Terminal 2 — React (port 5173):**

```bash
npm run dev:client
```

Open **http://localhost:5173** in your browser.

The Vite dev server proxies `/api` requests to the Express server.

## Step 6 — Sign in

Use a demo account from the login screen, for example:

- **LDRRMO:** `ldrrmo` / `ldrrmo123`
- **Coordinator:** `coordinator1` / `coord123`

## Production deployment (optional)

1. Build the React app:
   ```bash
   npm run build
   ```
2. Set `CLIENT_ORIGIN` to your production front-end URL.
3. Start the server:
   ```bash
   npm start
   ```
4. The API serves static files from `client/dist` and handles all `/api` routes.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` to MySQL | Start MySQL and verify credentials in `server/.env` |
| `Access denied for user` | Check `DB_USER` and `DB_PASSWORD` |
| Blank page after login | Ensure the API server is running on port 5000 |
| 401 on API calls | Log out and sign in again; token may have expired |

## Legacy prototype

The folder `evac-system/` contains the original browser-only prototype (localStorage, no MySQL). It is kept for reference only. The thesis implementation uses `client/` + `server/`.
