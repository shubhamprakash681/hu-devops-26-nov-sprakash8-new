# HU Inventory App

Small two-tier app used for the HU DevOps assignments.

| Component | Stack | Port | Path |
|---|---|---|---|
| FE | React 18 + Vite (static build) | 3000 (dev) | [fe/](./fe) |
| BE | Node.js 18+ / Express REST API | 8080 | [be/](./be) |
| DB | PostgreSQL 14+ (**you provision it**) | 5432 | - |

> This app is a training target. **Never expose it to the public internet.**

There is intentionally **no Dockerfile, Compose file, CI workflow, nginx config, Kubernetes manifest or Helm chart**. Creating them is part of the assignments.

## Backend

### Environment variables

All variables are required and have no defaults. The BE fails fast if one is missing. Copy `be/.env.example` to `be/.env` for local runs.

| Variable | Description |
|---|---|
| `PORT` | HTTP port |
| `DB_HOST` | Postgres host |
| `DB_PORT` | Postgres port |
| `DB_USER` | Postgres user |
| `DB_PASSWORD` | Postgres password |
| `DB_NAME` | Database name (must already exist) |
| `JWT_SECRET` | Token signing secret |
| `DB_CONNECT_RETRIES` | Attempts to reach the DB at startup |
| `DB_CONNECT_DELAY_MS` | Delay between attempts |
| `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` | Admin login created at startup |
| `SEED_TRAINEE_USERNAME` / `SEED_TRAINEE_PASSWORD` | Non-admin login created at startup |

On startup the BE waits for the database, then creates the `users` and `items` tables and seeds sample data (idempotent). The database itself and its user must exist beforehand.

### API

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | - | Liveness |
| GET | `/health/db` | - | Readiness (200 if DB reachable, else 503). Also served at `/api/health/db` for the FE |
| POST | `/api/auth/login` | - | `{username, password}` -> `{token, user}` |
| GET | `/api/items?search=` | - | List / search items |
| GET | `/api/items/:id` | - | Get one item |
| POST | `/api/items` | Bearer | Create item |
| DELETE | `/api/items/:id` | Bearer | Delete item |
| GET | `/api/greet?name=` | - | HTML greeting |
| GET | `/api/files?name=` | - | Read a text file from `be/files` |
| GET | `/api/diagnostics/ping?host=` | - | Network ping helper (needs `ping` in the image) |
| GET | `/api/calc?expr=` | - | Expression calculator |
| GET | `/api/redirect?url=` | - | Redirect helper |
| GET | `/api/fetch?url=` | - | Fetch a URL and return the body |

Log in with the `SEED_*` credentials you configured.

### Run and test

```bash
cd be
npm ci
npm test
npm run start:local   # reads be/.env; in containers, inject the variables and use npm start
```

## Frontend

The FE calls the BE using **same-origin `/api/...` paths**:
- Dev (`npm run dev`): Vite proxies `/api` to `VITE_BE_URL` (set it in `fe/.env`, see `fe/.env.example`).
- Built output (`dist/`) is static files only. Whatever serves it (web server / ingress) must route `/api` to the BE, or set `apiUrl` in `public/config.js` (this file is loaded at runtime, so it can be replaced without rebuilding).

```bash
cd fe
npm ci
npm run dev      # http://localhost:3000
npm run build    # outputs dist/
```
