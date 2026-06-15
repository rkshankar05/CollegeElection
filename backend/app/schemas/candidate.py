from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr


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


class CandidateBlockUpdate(BaseModel):
    candidate_blocked: bool
    block_reason: Optional[str] = None


class StudentUpdate(BaseModel):
    name: str
    roll_number: str
    college_email: EmailStr
    has_active_backlog: bool = False
