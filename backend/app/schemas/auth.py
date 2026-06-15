from typing import List, Optional

from pydantic import BaseModel, EmailStr


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
