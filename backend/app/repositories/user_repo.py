from sqlalchemy.orm import Session

from app import models


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int):
        return self.db.query(models.User).filter(models.User.id == user_id).first()

    def get_by_email(self, email: str):
        return self.db.query(models.User).filter(models.User.email == email).first()

    def get_student_by_roll_and_email(self, roll_number: str, college_email: str):
        return (
            self.db.query(models.Student)
            .filter(
                models.Student.roll_number == roll_number,
                models.Student.college_email == college_email,
            )
            .first()
        )

    def add(self, user: models.User):
        self.db.add(user)
        return user
