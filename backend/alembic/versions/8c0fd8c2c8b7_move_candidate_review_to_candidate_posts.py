"""move candidate review state to candidate posts

Revision ID: 8c0fd8c2c8b7
Revises: bb8c17b6af6d
Create Date: 2026-05-25 14:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8c0fd8c2c8b7"
down_revision: Union[str, Sequence[str], None] = "bb8c17b6af6d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "candidate_posts",
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "candidate_posts",
        sa.Column("rejection_reason", sa.String(), nullable=True),
    )

    op.execute(
        """
        UPDATE candidate_posts AS cp
        SET
            status = COALESCE(c.status, 'pending'),
            reviewed_at = c.reviewed_at,
            rejection_reason = c.rejection_reason
        FROM candidates AS c
        WHERE c.id = cp.candidate_id
        """
    )

    op.alter_column("candidate_posts", "status", nullable=False, server_default="pending")


def downgrade() -> None:
    op.drop_column("candidate_posts", "rejection_reason")
    op.drop_column("candidate_posts", "reviewed_at")
