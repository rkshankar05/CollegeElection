from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Election(Base):
    __tablename__ = "elections"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    year = Column(Integer, unique=True, nullable=False)
    application_start = Column(DateTime, nullable=False)
    application_deadline = Column(DateTime, nullable=False)
    voting_start = Column(DateTime, nullable=False)
    voting_end = Column(DateTime, nullable=False)
    candidates_visible = Column(Boolean, default=False)
    result_visible = Column(Boolean, default=False)
    result_locked = Column(Boolean, default=False)
    status = Column(String, default="DRAFT")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    display_order = Column(Integer, default=0)

    election = relationship("Election")

    __table_args__ = (
        UniqueConstraint("election_id", "name", name="unique_post_per_election"),
        UniqueConstraint("election_id", "id", name="uq_posts_election_id_id"),
        Index("idx_posts_name", "name"),
        Index("idx_posts_election_order", "election_id", "display_order"),
    )
