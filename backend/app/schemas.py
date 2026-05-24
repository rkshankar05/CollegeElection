from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


# ---------------- AUTH ----------------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    roll_number: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_verified: bool

    class Config:
        from_attributes = True


# ---------------- ELECTION ----------------

class ElectionCreate(BaseModel):
    title: str
    year: int
    application_start: datetime
    application_deadline: datetime
    voting_start: datetime
    voting_end: datetime


class ElectionOut(BaseModel):
    id: int
    title: str
    year: int
    application_start: datetime
    application_deadline: datetime
    voting_start: datetime
    voting_end: datetime
    candidates_visible: bool
    result_visible: bool
    status: str

    class Config:
        from_attributes = True


# ---------------- POST ----------------

class PostCreate(BaseModel):
    election_id: int
    name: str
    display_order: int = 0


class PostOut(BaseModel):
    id: int
    election_id: int
    name: str
    display_order: int

    class Config:
        from_attributes = True


# ---------------- CANDIDATE ----------------

class CandidateApply(BaseModel):
    election_id: int
    post_ids: List[int]


class CandidateReview(BaseModel):
    status: str
    rejection_reason: Optional[str] = None


class CandidateOut(BaseModel):
    id: int
    user_id: int
    election_id: int
    status: str
    applied_at: datetime
    rejection_reason: Optional[str]

    class Config:
        from_attributes = True


# ---------------- STUDENT ADMIN ----------------

class CandidateBlockUpdate(BaseModel):
    candidate_blocked: bool
    block_reason: Optional[str] = None


# ---------------- VOTE ----------------

class SingleVote(BaseModel):
    post_id: int
    candidate_id: int


class VoteSubmit(BaseModel):
    election_id: int
    votes: List[SingleVote]


class ResultOut(BaseModel):
    post_id: int
    candidate_id: int
    candidate_name: str
    total_votes: int