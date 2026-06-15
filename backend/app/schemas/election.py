from datetime import datetime

from pydantic import BaseModel, model_validator


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
