from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime,ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="student")  # admin/student
    is_verified = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    name = Column(String, nullable=True)
    roll_number = Column(String, unique=True, index=True, nullable=False)
    college_email = Column(String, unique=True, index=True, nullable=False)

    has_active_backlog = Column(Boolean, default=False)

    # Admin-controlled block
    candidate_blocked = Column(Boolean, default=False)
    block_reason = Column(String, nullable=True)

    user = relationship("User")


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

    status = Column(String, default="draft")  # draft/active/ended

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
    )


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"))

    # Legacy review fields kept for backward-compatible storage; approval logic now uses CandidatePost.
    status = Column(String, default="pending")  # pending/approved/rejected
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

    status = Column(String, default="pending", nullable=False)  # pending/approved/rejected
    applied_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)

    candidate = relationship("Candidate")
    post = relationship("Post")

    __table_args__ = (
        UniqueConstraint("candidate_id", "post_id", name="unique_candidate_post"),
    )


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)

    voter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("voter_id", "election_id", "post_id", name="one_vote_per_post"),
        Index("idx_votes_election_post", "election_id", "post_id"),
        Index("idx_votes_candidate", "candidate_id"),
        Index("idx_votes_voter", "voter_id"),
    )
