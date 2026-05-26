from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, model_validator


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


class ActivePostOut(BaseModel):
    election_id: int
    election_title: str
    election_year: int
    post_id: int
    post_name: str
    total_votes: int


class UserProfileOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    roll_number: Optional[str] = None
    college_email: Optional[EmailStr] = None
    has_active_backlog: Optional[bool] = None
    candidate_blocked: Optional[bool] = None
    block_reason: Optional[str] = None
    active_posts: List[ActivePostOut] = []


# ---------------- ELECTION ----------------

class ElectionCreate(BaseModel):
    title: str
    year: int
    application_start: datetime
    application_deadline: datetime
    voting_start: datetime
    voting_end: datetime

    @model_validator(mode="after")
    def validate_election_window(self):
        if self.application_deadline <= self.application_start:
            raise ValueError("Application deadline must be after application start")

        if self.voting_end <= self.voting_start:
            raise ValueError("Voting end must be after voting start")

        if self.voting_start <= self.application_deadline:
            raise ValueError("Voting must start after the application deadline")

        if self.voting_start.date() != self.voting_end.date():
            raise ValueError("Voting start and end must be on the same date")

        return self


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
    applied_at: datetime

    class Config:
        from_attributes = True


# ---------------- STUDENT ADMIN ----------------

class CandidateBlockUpdate(BaseModel):
    candidate_blocked: bool
    block_reason: Optional[str] = None


class StudentUpdate(BaseModel):
    name: str
    roll_number: str
    college_email: EmailStr
    has_active_backlog: bool = False


# ---------------- VOTE ----------------

class SingleVote(BaseModel):
    post_id: int
    candidate_id: Optional[int] = None
    is_nota: bool = False

    @model_validator(mode="after")
    def validate_vote_choice(self):
        if self.is_nota:
            return self

        if self.candidate_id is None:
            raise ValueError("candidate_id is required unless NOTA is selected")

        return self


class VoteSubmit(BaseModel):
    election_id: int
    votes: List[SingleVote]


class ResultOut(BaseModel):
    post_id: int
    candidate_id: int
    candidate_name: str
    total_votes: int
