# Smaran Backend Setup Guide

Complete guide to set up the FastAPI + Postgres backend with Docker for the Smaran health app.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Docker Compose Setup](#docker-compose-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Stack](#running-the-stack)
6. [Database Migrations](#database-migrations)
7. [API Endpoints](#api-endpoints)
8. [Connecting React Native Frontend](#connecting-react-native-frontend)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Docker** (v20.10+): [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (v2.0+): Usually included with Docker Desktop
- **Git**: For cloning and version control
- **Python 3.11+** (optional, for local development): [python.org](https://www.python.org)

### Verify Installation
```bash
docker --version
docker compose --version
```

---

## Project Structure

Create a new directory for the backend:

```bash
mkdir projectHealth-backend
cd projectHealth-backend
git init
```

### Directory Layout
```
projectHealth-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration & environment
│   ├── database.py             # Database setup
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py             # User, Profile SQLAlchemy models
│   │   ├── reminder.py         # Reminder model
│   │   └── token.py            # RefreshToken model
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py             # Pydantic schemas for requests/responses
│   │   ├── reminder.py
│   │   └── auth.py
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py             # /auth/* endpoints
│   │   ├── profile.py          # /profile endpoints
│   │   └── reminders.py        # /reminders endpoints
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py     # Business logic for auth
│   │   ├── jwt_service.py      # JWT token generation/validation
│   │   └── reminder_service.py # Reminder CRUD logic
│   │
│   └── dependencies.py         # Dependency injection (get_current_user, etc.)
│
├── migrations/                 # Alembic database migrations
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── tests/
│   ├── __init__.py
│   ├── test_auth.py
│   └── test_reminders.py
│
├── docker/
│   ├── Dockerfile             # FastAPI container image
│   └── entrypoint.sh          # Container startup script
│
├── docker-compose.yml         # Orchestrate FastAPI + Postgres
├── .env.example               # Example environment variables
├── .env                       # Local environment (git ignored)
├── .gitignore
├── requirements.txt           # Python dependencies
├── alembic.ini               # Database migration config
└── README.md
```

---

## Docker Compose Setup

### Step 1: Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: smaran-db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      # Mount local directory for persistent storage
      - smaran_db_volume:/var/lib/postgresql/data
      # Optional: Initialize database with SQL script
      # - ./docker/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - smaran-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FastAPI Application
  fastapi:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: smaran-api
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      SECRET_KEY: ${SECRET_KEY}
      ALGORITHM: ${ALGORITHM}
      ACCESS_TOKEN_EXPIRE_HOURS: ${ACCESS_TOKEN_EXPIRE_HOURS}
      REFRESH_TOKEN_EXPIRE_DAYS: ${REFRESH_TOKEN_EXPIRE_DAYS}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      # Mount app directory for hot reload during development
      - ./app:/app/app
    networks:
      - smaran-network
    command: >
      sh -c "alembic upgrade head && 
             uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

volumes:
  smaran_db_volume:
    driver: local

networks:
  smaran-network:
    driver: bridge
```

### Step 2: Create `docker/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app
COPY alembic.ini .
COPY migrations ./migrations

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### Step 3: Create `docker/entrypoint.sh` (Optional)

```bash
#!/bin/bash
set -e

echo "Waiting for postgres..."
while ! nc -z postgres 5432; do
  sleep 0.1
done
echo "Postgres started"

# Run migrations
alembic upgrade head

# Start FastAPI
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Make executable:
```bash
chmod +x docker/entrypoint.sh
```

---

## Environment Configuration

### Step 1: Create `.env.example`

```bash
# Database Configuration
DB_USER=smaran
DB_PASSWORD=smaran_dev_password
DB_NAME=smaran_db
DB_HOST=postgres
DB_PORT=5432

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production-use-32-chars-minimum
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=1
REFRESH_TOKEN_EXPIRE_DAYS=7

# FastAPI Configuration
DEBUG=True
LOG_LEVEL=info

# CORS (React Native)
CORS_ORIGINS=["http://localhost:3000", "http://10.0.2.2:8000"]
```

### Step 2: Create `.env` (Local Development)

```bash
cp .env.example .env
```

Then edit `.env` with your values:
```bash
DB_USER=smaran
DB_PASSWORD=smaran_dev_password
DB_NAME=smaran_db
DB_HOST=postgres
DB_PORT=5432
SECRET_KEY=my-super-secret-jwt-key-change-in-production-please-use-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=1
REFRESH_TOKEN_EXPIRE_DAYS=7
DEBUG=True
LOG_LEVEL=info
CORS_ORIGINS=["http://localhost:3000", "http://10.0.2.2:8000"]
```

### Step 3: Add `.gitignore`

```bash
# Environment
.env
.env.local
.env.*.local

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
*.egg-info/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.sqlite

# Docker
.dockerignore
```

---

## Running the Stack

### Step 1: Build and Start Services

```bash
# Build Docker images and start containers
docker compose up --build

# Or run in background
docker compose up -d --build

# View logs
docker compose logs -f fastapi
docker compose logs -f postgres
```

### Step 2: Verify Services Are Running

```bash
# Check container status
docker compose ps

# Test FastAPI health endpoint
curl http://localhost:8000/health

# Test Postgres connection
docker compose exec postgres psql -U smaran -d smaran_db -c "SELECT version();"
```

### Step 3: Stop Services

```bash
# Stop running containers
docker compose down

# Stop and remove volumes (WARNING: deletes database!)
docker compose down -v
```

---

## Database Migrations

### Step 1: Initialize Alembic

```bash
# If starting fresh (usually already initialized)
docker compose exec fastapi alembic init migrations
```

### Step 2: Create Migration Files

After defining SQLAlchemy models, create a migration:

```bash
docker compose exec fastapi alembic revision --autogenerate -m "Create users table"
```

This generates a file in `migrations/versions/`.

### Step 3: Apply Migrations

```bash
# Apply all pending migrations
docker compose exec fastapi alembic upgrade head

# Rollback one version
docker compose exec fastapi alembic downgrade -1
```

---

## API Endpoints

Once the backend is running, the following endpoints are available:

### Authentication
```
POST /auth/register
  Body: { email, password, caregiver_name, patient_name, patient_dob, patient_age }
  Response: { access_token, refresh_token, user }

POST /auth/login
  Body: { identifier (email/phone), password }
  Response: { access_token, refresh_token, user }

POST /auth/refresh
  Body: { refresh_token }
  Response: { access_token }

POST /auth/logout
  Headers: Authorization: Bearer <token>
  Response: { success: true }
```

### Profile
```
GET /profile
  Headers: Authorization: Bearer <token>
  Response: { user, profile, reminders }

PUT /profile
  Headers: Authorization: Bearer <token>
  Body: { caregiver_name, patient_name, patient_dob, patient_age }
  Response: { profile }
```

### Reminders
```
GET /reminders
  Headers: Authorization: Bearer <token>
  Response: [{ id, title, time, detail, done, ... }]

POST /reminders
  Headers: Authorization: Bearer <token>
  Body: { title, time, detail, icon }
  Response: { reminder }

PUT /reminders/{id}
  Headers: Authorization: Bearer <token>
  Body: { title, time, detail, done }
  Response: { reminder }

DELETE /reminders/{id}
  Headers: Authorization: Bearer <token>
  Response: { success: true }
```

### Health
```
GET /health
  Response: { status: "ok" }
```

---

## Connecting React Native Frontend

### Step 1: Update Android Emulator API Base

In your React Native app, replace hardcoded demo credentials with API calls:

**Create a config file:** `src/config/api.js`
```javascript
const API_BASE = __DEV__
  ? 'http://10.0.2.2:8000'  // Android Emulator alias for host machine
  : 'https://api.smaran.app'; // Production domain

export default API_BASE;
```

### Step 2: Update LoginScreen.js

Replace the demo auth logic:

```javascript
import API_BASE from '../config/api';

const submit = async () => {
  if (lockedUntil > Date.now() || loading) {
    return;
  }

  if (!validate()) {
    return;
  }

  Keyboard.dismiss();
  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password: password
      })
    });

    if (!response.ok) {
      const error = await response.json();
      setServerError(error.detail || 'Invalid username or password.');
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);

      if (attempts >= 5) {
        const until = Date.now() + 30000;
        setLockedUntil(until);
        setSecondsLeft(30);
        setServerError('Too many unsuccessful attempts. Please try again in 30 seconds.');
      }
      return;
    }

    const data = await response.json();
    
    // Store tokens securely
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync('access_token', data.access_token);
    await SecureStore.setItemAsync('refresh_token', data.refresh_token);

    // Clear errors and proceed
    setLoading(false);
    setFailedAttempts(0);
    setErrors({});
    setServerError('');

    onLogin(data.user.profile?.caregiver_name || 'Caregiver');
  } catch (error) {
    console.error('Login error:', error);
    setServerError('Network error: ' + error.message);
    setLoading(false);
  }
};
```

### Step 3: Install SecureStore (if not already installed)

```bash
cd projectHealth
npm install expo-secure-store
# or
yarn add expo-secure-store
```

### Step 4: Create Token Service

Create `src/services/tokenService.js`:

```javascript
import * as SecureStore from 'expo-secure-store';
import API_BASE from '../config/api';

export async function getValidAccessToken() {
  try {
    let token = await SecureStore.getItemAsync('access_token');
    
    if (!token) {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (refreshToken) {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (response.ok) {
          const data = await response.json();
          await SecureStore.setItemAsync('access_token', data.access_token);
          token = data.access_token;
        }
      }
    }

    return token;
  } catch (error) {
    console.error('Token retrieval error:', error);
    return null;
  }
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
}
```

### Step 5: Update API Calls in Screens

**In RemindersScreen.js:**

```javascript
import { getValidAccessToken } from '../services/tokenService';
import API_BASE from '../config/api';

export default function RemindersScreen({ onBack, reminders = [], onRemindersChange, patientName }) {
  // ... existing code ...

  const loadReminders = async () => {
    try {
      const token = await getValidAccessToken();
      const response = await fetch(`${API_BASE}/reminders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        onRemindersChange(data);
      }
    } catch (error) {
      console.error('Load reminders error:', error);
    }
  };

  const saveReminder = async (reminder) => {
    try {
      const token = await getValidAccessToken();
      const response = await fetch(`${API_BASE}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reminder)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Save reminder error:', error);
    }
  };

  // ... rest of component ...
}
```

---

## Testing

### Step 1: Test API with Curl

```bash
# Health check
curl http://localhost:8000/health

# Register new user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "caregiver@smaran.app",
    "password": "Smaran123",
    "caregiver_name": "Asha",
    "patient_name": "John",
    "patient_dob": "1960-01-15",
    "patient_age": "64"
  }'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "caregiver@smaran.app",
    "password": "Smaran123"
  }'

# Get profile (replace TOKEN with actual access_token)
curl http://localhost:8000/profile \
  -H "Authorization: Bearer TOKEN"

# Get reminders
curl http://localhost:8000/reminders \
  -H "Authorization: Bearer TOKEN"
```

### Step 2: Use Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Create a new request to `http://localhost:8000/auth/login`
3. Select `POST` method
4. Add JSON body with login credentials
5. Copy the returned `access_token`
6. Use it in the `Authorization` header for protected endpoints

### Step 3: Run Unit Tests

```bash
# Inside container
docker compose exec fastapi pytest tests/

# Or locally (if Python installed)
pytest tests/
```

---

## Troubleshooting

### Docker Containers Won't Start

```bash
# Check logs
docker compose logs postgres
docker compose logs fastapi

# Ensure ports are not in use
lsof -i :5432  # Postgres
lsof -i :8000  # FastAPI

# Kill process using port (macOS/Linux)
kill -9 <PID>

# On Windows, use Task Manager or:
netstat -ano | findstr :5432
taskkill /PID <PID> /F
```

### Database Connection Failed

```bash
# Verify Postgres is healthy
docker compose ps

# Check if database exists
docker compose exec postgres psql -U smaran -d smaran_db -c "\l"

# Recreate database
docker compose down -v
docker compose up --build
```

### Alembic Migration Errors

```bash
# Clear failed migrations
docker compose exec fastapi alembic stamp head

# Start fresh
docker compose down -v
docker compose up --build
```

### React Native Can't Connect to FastAPI

- Ensure FastAPI container is running: `docker compose ps`
- Use `10.0.2.2:8000` (not `localhost:8000`) in Android Emulator
- Check firewall isn't blocking port 8000
- Verify `.env` database URL is correct

### Volume Permissions Issues

```bash
# Fix volume permissions (Linux/macOS)
sudo chown -R 999:999 smaran_db_volume

# Or recreate volume
docker compose down -v
docker volume rm projecthealth-backend_smaran_db_volume
docker compose up --build
```

---

## Next Steps

1. **Build out models & schemas** in `app/models/` and `app/schemas/`
2. **Implement auth routes** in `app/routes/auth.py`
3. **Create database migrations** with Alembic
4. **Implement profile & reminder routes** in `app/routes/profile.py` and `app/routes/reminders.py`
5. **Wire React Native frontend** to call the backend endpoints
6. **Add authentication checks** to protected endpoints
7. **Deploy to production** (Railway, AWS, DigitalOcean, etc.)

---

## Production Deployment

### Railway.app (Recommended)

1. Push repo to GitHub
2. Connect Railway to GitHub repo
3. Railway auto-detects `requirements.txt` and provisions services
4. Set environment variables in Railway dashboard
5. Get production API URL from Railway
6. Update React Native to point to production API

### Self-Hosted (AWS/DigitalOcean)

```bash
# SSH into server
ssh root@your_server_ip

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone backend repo
git clone https://github.com/Sdeygit13/projectHealth-backend.git
cd projectHealth-backend

# Set production .env
nano .env  # Update with production values

# Start services
docker compose up -d

# Set up Nginx reverse proxy for HTTPS
# (See separate Nginx setup guide)
```

---

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Migrations](https://alembic.sqlalchemy.org/)
- [JWT with Python-Jose](https://python-jose.readthedocs.io/)
- [Pydantic Validation](https://docs.pydantic.dev/)

---

**Happy coding!** 🚀

For questions or issues, refer to the troubleshooting section or open a GitHub issue.
