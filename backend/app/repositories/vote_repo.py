from sqlalchemy.orm import Session

from app import models


class VoteRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_election(self, election_id: int):
        return self.db.query(models.Election).filter(models.Election.id == election_id).first()

    def get_post_for_election(self, election_id: int, post_id: int):
        return (
            self.db.query(models.Post)
            .filter(models.Post.id == post_id, models.Post.election_id == election_id)
            .first()
        )

    def get_post(self, election_id: int, post_id: int):
        return self.get_post_for_election(election_id, post_id)

    def has_existing_vote(self, voter_id: int, election_id: int, post_id: int):
        return (
            self.db.query(models.VoteReceipt.id)
            .filter(
                models.VoteReceipt.voter_id == voter_id,
                models.VoteReceipt.election_id == election_id,
                models.VoteReceipt.post_id == post_id,
            )
            .first()
            is not None
        )

    def get_receipt_by_code(self, receipt_code: str):
        return (
            self.db.query(models.VoteReceipt)
            .filter(models.VoteReceipt.receipt_code == receipt_code)
            .first()
        )

    def get_approved_candidate_for_vote(self, election_id: int, post_id: int, candidate_id: int):
        return (
            self.db.query(models.Candidate)
            .join(models.CandidatePost, models.CandidatePost.candidate_id == models.Candidate.id)
            .filter(
                models.Candidate.id == candidate_id,
                models.Candidate.election_id == election_id,
                models.CandidatePost.post_id == post_id,
                models.CandidatePost.status == "approved",
            )
            .first()
        )

    def add(self, vote: models.Vote):
        self.db.add(vote)
        return vote

    def add_receipt(self, receipt: models.VoteReceipt):
        self.db.add(receipt)
        return receipt
