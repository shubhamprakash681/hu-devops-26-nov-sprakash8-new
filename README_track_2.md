
# Track 2: Docker, CI/CD, Kubernetes, and DevSecOps & Cyber Security
# Track 2 Q1 Docker Containerization - Steps

## Question 1: Containerize the Application (Docker)
**Part A: Dockerfiles, Docker Compose and Image Sizes**

This document lists the steps followed for each task. The screenshot for each task is stored in the repository as `t2q1a<task>.png`.

---
## Task 1: Write the Backend (BE) Dockerfile

### Steps

1. Go to the backend folder and create a `.dockerignore` file (exclude `node_modules`, `.git`, `.env`).

2. Create a `Dockerfile` using a small, pinned base image (for example `node:20-alpine`).

3. Use a multi-stage build and install only production dependencies with `npm ci --omit=dev`.

4. Copy `package*.json` before the source code to use the layer cache.

5. Run as a non-root user with `USER node`, add `EXPOSE <backend-port>` and set the start command with `CMD`.
---

## Task 2: Write the Frontend (FE) Dockerfile


### Steps

1. Go to the frontend folder and create a `.dockerignore` file (exclude `node_modules`, `build`, `.git`, `.env`).

2. Create a `Dockerfile` with a multi-stage build. Stage 1 uses `node:20-alpine` to run `npm ci` and `npm run build`.

3. In stage 2, use `nginxinc/nginx-unprivileged:alpine` and copy only the build output into the Nginx web root.

4. Add an `nginx.conf` that proxies `/api` to the backend service, and add `EXPOSE 8080`.

---

## Task 3: Create the `.env` and Docker Compose files

### Steps

1. In the project root, create a `.env` file with `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`. Add `.env` to `.gitignore`.

2. Create `docker-compose.yml` with three services: `db` (`postgres:16-alpine`), `backend` and `frontend`.

3. For `db`, load the credentials from `.env`, mount a named volume `pgdata` and add a `pg_isready` healthcheck.

4. For `backend`, build from `./backend`, set the DB host to `db` and use `depends_on` with `condition: service_healthy`.

5. For `frontend`, build from `./frontend` and map a host port to container port 8080.

6. Name the images (for example `myapp-backend:1.0`, `myapp-frontend:1.0`) and validate the file with `docker compose config`.

---
## Task 4: Build the images and run with PostgreSQL

### Steps

1. Build both images with `docker compose build`.

2. Start all the containers with `docker compose up -d`.

3. Check the status with `docker compose ps`. `db` should be healthy and the other two should be running.

4. If a container fails, check `docker compose logs <service-name>`.

---
## Task 5: Test the application end to end

### Steps

1. Test the backend with `curl http://localhost:<backend-port>/health`.

2. Open `http://localhost:<frontend-port>` in a browser and use the main features (create, view, update, delete).

3. Confirm the data is in PostgreSQL with `docker exec -it <db-container> psql -U <user> -d <db> -c "SELECT * FROM <table_name>;"`.

4. Run `docker compose down`, then `docker compose up -d`. Reload the page and confirm the data is still there.
---

## Task 6: Check and record the size of each image

### Steps

1. Run `docker images` to list all images and their sizes.

2. For a cleaner view, run `docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"`.

3. (Optional) Use `docker history <image>:<tag>` to see which layers take the most space.

4. Record the sizes below.

| Image | Tag | Final Size |
|-------|-----|------------|
| myapp-backend | 1.0 | `<fill in>` |
| myapp-frontend | 1.0 | `<fill in>` |
| postgres | 16-alpine | `<fill in>` |
