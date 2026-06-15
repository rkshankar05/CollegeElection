"""harden vote integrity

Revision ID: 3c4d5e6f7a8b
Revises: 2b3c4d5e6f7a
Create Date: 2026-06-15 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3c4d5e6f7a8b"
down_revision: Union[str, Sequence[str], None] = "2b3c4d5e6f7a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _constraint_exists(table_name: str, constraint_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    constraints = inspector.get_unique_constraints(table_name)
    constraints.extend(inspector.get_foreign_keys(table_name))
    return any(constraint.get("name") == constraint_name for constraint in constraints)


def _index_exists(table_name: str, index_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return any(index.get("name") == index_name for index in inspector.get_indexes(table_name))


def upgrade() -> None:
    if not _constraint_exists("posts", "uq_posts_election_id_id"):
        op.create_unique_constraint("uq_posts_election_id_id", "posts", ["election_id", "id"])

    if not _constraint_exists("candidates", "uq_candidates_election_id_id"):
        op.create_unique_constraint("uq_candidates_election_id_id", "candidates", ["election_id", "id"])

    if not _constraint_exists("votes", "one_vote_per_post"):
        op.create_unique_constraint("one_vote_per_post", "votes", ["voter_id", "election_id", "post_id"])

    if not _constraint_exists("votes", "fk_votes_election_post"):
        op.create_foreign_key(
            "fk_votes_election_post",
            "votes",
            "posts",
            ["election_id", "post_id"],
            ["election_id", "id"],
            ondelete="CASCADE",
        )

    if not _constraint_exists("votes", "fk_votes_election_candidate"):
        op.create_foreign_key(
            "fk_votes_election_candidate",
            "votes",
            "candidates",
            ["election_id", "candidate_id"],
            ["election_id", "id"],
            ondelete="CASCADE",
        )

    if not _constraint_exists("votes", "fk_votes_candidate_post"):
        op.create_foreign_key(
            "fk_votes_candidate_post",
            "votes",
            "candidate_posts",
            ["candidate_id", "post_id"],
            ["candidate_id", "post_id"],
            ondelete="CASCADE",
        )

    if not _index_exists("votes", "idx_votes_election_post"):
        op.create_index("idx_votes_election_post", "votes", ["election_id", "post_id"])

    if not _index_exists("votes", "idx_votes_candidate"):
        op.create_index("idx_votes_candidate", "votes", ["candidate_id"])

    if not _index_exists("votes", "idx_votes_voter"):
        op.create_index("idx_votes_voter", "votes", ["voter_id"])

    if not _index_exists("votes", "idx_votes_voter_election"):
        op.create_index("idx_votes_voter_election", "votes", ["voter_id", "election_id"])


def downgrade() -> None:
    if _index_exists("votes", "idx_votes_voter_election"):
        op.drop_index("idx_votes_voter_election", table_name="votes")

    for constraint_name in (
        "fk_votes_candidate_post",
        "fk_votes_election_candidate",
        "fk_votes_election_post",
    ):
        if _constraint_exists("votes", constraint_name):
            op.drop_constraint(constraint_name, "votes", type_="foreignkey")

    if _constraint_exists("votes", "one_vote_per_post"):
        op.drop_constraint("one_vote_per_post", "votes", type_="unique")

    if _constraint_exists("candidates", "uq_candidates_election_id_id"):
        op.drop_constraint("uq_candidates_election_id_id", "candidates", type_="unique")

    if _constraint_exists("posts", "uq_posts_election_id_id"):
        op.drop_constraint("uq_posts_election_id_id", "posts", type_="unique")
