from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, model_validator


class SingleVote(BaseModel):
    post_id: int
    candidate_id: Optional[int] = None
    is_nota: bool = False

    @model_validator(mode="after")
    def validate_vote_choice(self):
        if self.is_nota:
            if self.candidate_id is not None:
                raise ValueError("candidate_id must not be provided when NOTA is selected")
            return self
        if self.candidate_id is None:
            raise ValueError("candidate_id is required unless NOTA is selected")
        return self


class VoteSubmit(BaseModel):
    election_id: int
    votes: List[SingleVote]


class VoteReceiptOut(BaseModel):
    election_id: int
    post_id: int
    receipt_code: str
    created_at: datetime

    class Config:
        from_attributes = True


class VoteSubmitOut(BaseModel):
    message: str
    receipts: List[VoteReceiptOut]


class ResultOut(BaseModel):
    post_id: int
    candidate_id: int
    candidate_name: str
    total_votes: int
