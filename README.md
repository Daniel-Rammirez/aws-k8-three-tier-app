# Flight Booking App

A three-tier microservices application for practicing Kubernetes. Simple flight search and booking system with four independent services, each with its own database.

## Architecture

```
Browser
  └── Frontend (Next.js :3000)
        ├── user-service (Express :3001) ── user-db (Postgres)
        ├── flight-service (Express :3002) ── flight-db (Postgres)
        └── booking-service (Express :3003) ── booking-db (Postgres)
```

| Service | Responsibility |
|---------|---------------|
| `user-service` | Register, login, JWT issuance |
| `flight-service` | Flight catalog, seat decrement |
| `booking-service` | Create bookings, calls flight-service |
| `frontend` | Next.js UI, stores JWT in localStorage |

## Running locally with Docker Compose

### Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)

### Start everything

```bash
cd flight-app
docker compose up --build
```

The first run builds all images. Subsequent runs are faster.

| URL | Service |
|-----|---------|
| http://localhost:3000 | Frontend |
| http://localhost:3001/health | user-service |
| http://localhost:3002/health | flight-service |
| http://localhost:3003/health | booking-service |

### Stop and clean up

```bash
docker compose down          # keep volumes (DB data persists)
docker compose down -v       # also delete volumes (fresh DB on next start)
```

## Running on Kubernetes

### Prerequisites

- A running Kubernetes cluster (minikube, kind, EKS, GKE, etc.)
- `kubectl` configured to point at your cluster
- nginx ingress controller installed

### 1. Build and push images

Replace `YOUR_DOCKERHUB_USERNAME` with your Docker Hub username:

```bash
docker build -t YOUR_DOCKERHUB_USERNAME/flight-frontend:latest \
  --build-arg NEXT_PUBLIC_USER_SERVICE_URL=http://flight-app.local \
  --build-arg NEXT_PUBLIC_FLIGHT_SERVICE_URL=http://flight-app.local \
  --build-arg NEXT_PUBLIC_BOOKING_SERVICE_URL=http://flight-app.local \
  ./frontend

docker build -t YOUR_DOCKERHUB_USERNAME/flight-user-service:latest ./user-service
docker build -t YOUR_DOCKERHUB_USERNAME/flight-flight-service:latest ./flight-service
docker build -t YOUR_DOCKERHUB_USERNAME/flight-booking-service:latest ./booking-service

docker push YOUR_DOCKERHUB_USERNAME/flight-frontend:latest
docker push YOUR_DOCKERHUB_USERNAME/flight-user-service:latest
docker push YOUR_DOCKERHUB_USERNAME/flight-flight-service:latest
docker push YOUR_DOCKERHUB_USERNAME/flight-booking-service:latest
```

### 2. Update image names

Replace `YOUR_DOCKERHUB_USERNAME` in the four deployment files:

```
k8s/frontend/deployment.yaml
k8s/user-service/deployment.yaml
k8s/flight-service/deployment.yaml
k8s/booking-service/deployment.yaml
```

### 3. Update secrets

The secrets in `k8s/*/secret.yaml` contain base64-encoded placeholder values. Re-encode with your real values before applying:

```bash
echo -n 'your-real-jwt-secret' | base64
```

### 4. Apply manifests

```bash
kubectl create namespace flight-app

# Postgres instances
kubectl apply -f k8s/user-service/postgres/
kubectl apply -f k8s/flight-service/postgres/
kubectl apply -f k8s/booking-service/postgres/

# Application services
kubectl apply -f k8s/user-service/
kubectl apply -f k8s/flight-service/
kubectl apply -f k8s/booking-service/
kubectl apply -f k8s/frontend/

# Ingress
kubectl apply -f k8s/ingress.yaml
```

### 5. Access the app

Add the ingress host to `/etc/hosts` (for local clusters):

```
127.0.0.1 flight-app.local
```

Open http://flight-app.local in your browser.

## CI/CD (GitHub Actions)

The pipeline in `.github/workflows/pipeline.yml` triggers on push to `main`.

### Required GitHub secrets

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `KUBECONFIG` | Base64-encoded kubeconfig: `cat ~/.kube/config \| base64` |

### Required GitHub variables (Actions → Variables)

| Variable | Example |
|----------|---------|
| `USER_SERVICE_URL` | `http://flight-app.example.com` |
| `FLIGHT_SERVICE_URL` | `http://flight-app.example.com` |
| `BOOKING_SERVICE_URL` | `http://flight-app.example.com` |

The pipeline:
1. Runs `npm test` for each service (currently a no-op placeholder)
2. Builds and pushes Docker images tagged with the commit SHA
3. Applies K8s manifests with the new image tags
4. Waits for rollouts to complete

## API reference

### user-service (port 3001)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/users/register` | No | `{name, email, password}` → `{token, user}` |
| POST | `/users/login` | No | `{email, password}` → `{token, user}` |
| GET | `/users/:id` | Bearer | Returns user profile |
| GET | `/health` | No | `{status: "ok"}` |

### flight-service (port 3002)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/flights` | No | All flights |
| GET | `/flights/:id` | No | Single flight |
| PUT | `/flights/:id/seats` | No | Decrement available seats by 1 |
| GET | `/health` | No | `{status: "ok"}` |

### booking-service (port 3003)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/bookings` | Bearer | `{flightId}` → booking record |
| GET | `/bookings/user/:userId` | Bearer | All bookings for a user (with flight details) |
| GET | `/health` | No | `{status: "ok"}` |

## Notes

- **No race condition handling** — seat decrement is a plain UPDATE with no locking. This is intentional; the focus is on infra, not business logic.
- **JWT** — user-service and booking-service share the same `JWT_SECRET`. Tokens expire in 24 hours.
- **Database init** — each Postgres container runs `init.sql` on first start to create the table. The flight-service seeds 12 sample flights on startup if the table is empty.
- **NEXT_PUBLIC_ env vars** — baked into the Next.js bundle at Docker build time. To change service URLs in K8s, rebuild the frontend image with new `--build-arg` values.
