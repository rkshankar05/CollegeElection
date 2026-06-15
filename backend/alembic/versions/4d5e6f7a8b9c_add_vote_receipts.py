"""add vote receipts

Revision ID: 4d5e6f7a8b9c
Revises: 3c4d5e6f7a8b
Create Date: 2026-06-15 00:00:00.000000
"""

from datetime import datetime
import secrets
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4d5e6f7a8b9c"
down_revision: Union[str, Sequence[str], None] = "3c4d5e6f7a8b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {column["name"] for column in inspector.get_columns(table_name)}


def _constraint_exists(table_name: str, constraint_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    constraints = inspector.get_unique_constraints(table_name)
    constraints.extend(inspector.get_foreign_keys(table_name))
    return any(constraint.get("name") == constraint_name for constraint in constraints)


def _index_exists(table_name: str, index_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return any(index.get("name") == index_name for index in inspector.get_indexes(table_name))


def _foreign_keys_for_column(table_name: str, column_name: str) -> list[str]:
    inspector = sa.inspect(op.get_bind())
    return [
        fk["name"]
        for fk in inspector.get_foreign_keys(table_name)
        if column_name in fk.get("constrained_columns", [])
    ]


def upgrade() -> None:
    op.create_table(
        "vote_receipts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("voter_id", sa.Integer(), nullable=False),
        sa.Column("election_id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column("receipt_code", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["voter_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["election_id"], ["elections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["election_id", "post_id"],
            ["posts.election_id", "posts.id"],
            name="fk_vote_receipts_election_post",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("receipt_code", name="uq_vote_receipts_receipt_code"),
        sa.UniqueConstraint("voter_id", "election_id", "post_id", name="one_receipt_per_post"),
    )
    op.create_index(op.f("ix_vote_receipts_id"), "vote_receipts", ["id"])
    op.create_index(op.f("ix_vote_receipts_receipt_code"), "vote_receipts", ["receipt_code"])
    op.create_index("idx_vote_receipts_voter_election", "vote_receipts", ["voter_id", "election_id"])

    vote_columns = _columns("votes")
    if "voter_id" in vote_columns:
        connection = op.get_bind()
        votes = sa.table(
            "votes",
            sa.column("voter_id", sa.Integer),
            sa.column("election_id", sa.Integer),
            sa.column("post_id", sa.Integer),
            sa.column("created_at", sa.DateTime),
        )
        vote_receipts = sa.table(
            "vote_receipts",
            sa.column("voter_id", sa.Integer),
            sa.column("election_id", sa.Integer),
            sa.column("post_id", sa.Integer),
            sa.column("receipt_code", sa.String),
            sa.column("created_at", sa.DateTime),
        )
        rows = connection.execute(
            sa.select(votes.c.voter_id, votes.c.election_id, votes.c.post_id, votes.c.created_at)
            .where(votes.c.voter_id.is_not(None))
        )
        for row in rows:
            connection.execute(
                vote_receipts.insert().values(
                    voter_id=row.voter_id,
                    election_id=row.election_id,
                    post_id=row.post_id,
                    receipt_code=secrets.token_urlsafe(24),
                    created_at=row.created_at or datetime.utcnow(),
                )
            )

        for index_name in ("idx_votes_voter_election", "idx_votes_voter"):
            if _index_exists("votes", index_name):
                op.drop_index(index_name, table_name="votes")

        if _constraint_exists("votes", "one_vote_per_post"):
            op.drop_constraint("one_vote_per_post", "votes", type_="unique")

        for fk_name in _foreign_keys_for_column("votes", "voter_id"):
            op.drop_constraint(fk_name, "votes", type_="foreignkey")

        op.drop_column("votes", "voter_id")

    if "is_nota" in vote_columns:
        op.drop_column("votes", "is_nota")


def downgrade() -> None:
    vote_columns = _columns("votes")
    if "voter_id" not in vote_columns:
        op.add_column("votes", sa.Column("voter_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "votes_voter_id_fkey",
            "votes",
            "users",
            ["voter_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_index("idx_votes_voter", "votes", ["voter_id"])
        op.create_index("idx_votes_voter_election", "votes", ["voter_id", "election_id"])

    if "is_nota" not in vote_columns:
        op.add_column("votes", sa.Column("is_nota", sa.Boolean(), nullable=False, server_default=sa.false()))

    if _index_exists("vote_receipts", "idx_vote_receipts_voter_election"):
        op.drop_index("idx_vote_receipts_voter_election", table_name="vote_receipts")
    op.drop_index(op.f("ix_vote_receipts_receipt_code"), table_name="vote_receipts")
    op.drop_index(op.f("ix_vote_receipts_id"), table_name="vote_receipts")
    op.drop_table("vote_receipts")
