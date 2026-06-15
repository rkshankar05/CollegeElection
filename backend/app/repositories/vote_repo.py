from sqlalchemy.orm import Session

from app import models


class VoteRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_election(self, election_id: int):
        return self.db.query(models.Election).filter(models.Election.id == election_id).first()

    def get_post(self, election_id: int, post_id: int):
        return (
            self.db.query(models.Post)
            .filter(models.Post.id == post_id, models.Post.election_id == election_id)
            .first()
        )

    def add(self, vote: models.Vote):
        self.db.add(vote)
        return vote
