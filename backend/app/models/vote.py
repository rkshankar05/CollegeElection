from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, UniqueConstraint

from app.database import Base


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    voter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=True)
    is_nota = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("voter_id", "election_id", "post_id", name="one_vote_per_post"),
        Index("idx_votes_election_post", "election_id", "post_id"),
        Index("idx_votes_candidate", "candidate_id"),
        Index("idx_votes_voter", "voter_id"),
    )
