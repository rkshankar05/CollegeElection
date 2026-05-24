from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

from app.routers import (
    auth,
    admin,
    elections,
    candidates,
    votes,
)


app = FastAPI(
    title="College Voting System"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(elections.router)
app.include_router(candidates.router)
app.include_router(votes.router)