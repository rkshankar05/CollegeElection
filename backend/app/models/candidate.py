from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"))
    status = Column(String, default="pending")
    applied_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)
    display_order = Column(Integer, default=0)

    user = relationship("User")
    election = relationship("Election")

    __table_args__ = (
        UniqueConstraint("user_id", "election_id", name="one_candidate_application_per_election"),
    )


class CandidatePost(Base):
    __tablename__ = "candidate_posts"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
    status = Column(String, default="pending", nullable=False)
    applied_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)

    candidate = relationship("Candidate")
    post = relationship("Post")

    __table_args__ = (
        UniqueConstraint("candidate_id", "post_id", name="unique_candidate_post"),
    )
