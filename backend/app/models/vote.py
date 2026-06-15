from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, ForeignKeyConstraint, Index, Integer, String, UniqueConstraint

from app.database import Base


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        ForeignKeyConstraint(
            ["election_id", "post_id"],
            ["posts.election_id", "posts.id"],
            name="fk_votes_election_post",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["election_id", "candidate_id"],
            ["candidates.election_id", "candidates.id"],
            name="fk_votes_election_candidate",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["candidate_id", "post_id"],
            ["candidate_posts.candidate_id", "candidate_posts.post_id"],
            name="fk_votes_candidate_post",
            ondelete="CASCADE",
        ),
        Index("idx_votes_election_post", "election_id", "post_id"),
        Index("idx_votes_candidate", "candidate_id"),
    )


class VoteReceipt(Base):
    __tablename__ = "vote_receipts"

    id = Column(Integer, primary_key=True, index=True)
    voter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    receipt_code = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("receipt_code", name="uq_vote_receipts_receipt_code"),
        UniqueConstraint("voter_id", "election_id", "post_id", name="one_receipt_per_post"),
        ForeignKeyConstraint(
            ["election_id", "post_id"],
            ["posts.election_id", "posts.id"],
            name="fk_vote_receipts_election_post",
            ondelete="CASCADE",
        ),
        Index("idx_vote_receipts_voter_election", "voter_id", "election_id"),
    )
