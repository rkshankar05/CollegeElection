# College Voting System

A full-stack web app for running college elections. It gives students a simple place to register, apply as candidates, vote, and view results, while admins can manage students, elections, applications, candidate publishing, and result visibility.

The project is split into a FastAPI backend and a React/Vite frontend. PostgreSQL is used for storage, with Alembic migrations included for the database schema.

## What It Does

- Student registration and login with JWT-based authentication
- Role-based dashboards for students and admins
- Election setup with application and voting windows
- Candidate applications for available posts
- Admin review and publishing flow for candidates
- One-vote-per-post receipts and vote integrity checks
- Result publishing controls

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- Frontend: React, Vite, React Router, Axios
- Auth: JWT tokens with role-based access

## Project Structure

```text
backend/
  app/
    api/v1/routers/    API routes
    models/            SQLAlchemy models
    schemas/           Request and response schemas
    services/          Business logic
    core/              Settings, security, permissions
  alembic/             Database migrations

frontend/
  src/
    app/               App shell and routes
    features/          Auth, admin, elections, candidates, voting
    components/        Shared UI components
```

## Getting Started

### 1. Backend

Create a virtual environment and install the backend dependencies:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` with values like:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/college_election
SECRET_KEY=change-this-before-sharing
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:5173
```

Run the migrations:

```bash
alembic upgrade head
```

Start the API:

```bash
uvicorn app.main:app --reload
```

By default, the API runs at `http://127.0.0.1:8000`.

### 2. Frontend

Install dependencies and start Vite:

```bash
cd frontend
npm install
npm run dev
```

The frontend usually runs at `http://localhost:5173`.

If the API is running somewhere else, set:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Development Notes

Keep the backend and frontend running in separate terminals during development. The frontend stores the auth token in local storage and sends it with API requests through the shared Axios client.

Database changes should go through Alembic migrations so local and deployed schemas stay in sync.

## Status

This is a college election management project with the main voting, candidate, admin, and result workflows already laid out. It is a good base for adding polish such as seeded demo data, richer audit views, and deployment configuration.
