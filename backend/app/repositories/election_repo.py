from sqlalchemy.orm import Session

from app import models


class ElectionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, election_id: int):
        return self.db.query(models.Election).filter(models.Election.id == election_id).first()

    def get_by_year(self, year: int):
        return self.db.query(models.Election).filter(models.Election.year == year).first()

    def list_all(self):
        return self.db.query(models.Election).order_by(models.Election.year.desc()).all()

    def list_posts(self, election_id: int):
        return (
            self.db.query(models.Post)
            .filter(models.Post.election_id == election_id)
            .order_by(models.Post.display_order.asc())
            .all()
        )

    def add(self, election: models.Election):
        self.db.add(election)
        return election
