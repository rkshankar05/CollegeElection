"""normalize election states

Revision ID: 2b3c4d5e6f7a
Revises: 1a2b3c4d5e6f
Create Date: 2026-06-15 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "2b3c4d5e6f7a"
down_revision: Union[str, Sequence[str], None] = "1a2b3c4d5e6f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE elections SET status = 'DRAFT' WHERE status IS NULL OR status = 'draft'")
    op.execute("UPDATE elections SET status = 'VOTING_OPEN' WHERE status = 'active'")
    op.execute("UPDATE elections SET status = 'VOTING_CLOSED' WHERE status = 'ended'")


def downgrade() -> None:
    op.execute("UPDATE elections SET status = 'draft' WHERE status = 'DRAFT'")
    op.execute("UPDATE elections SET status = 'active' WHERE status = 'VOTING_OPEN'")
    op.execute("UPDATE elections SET status = 'ended' WHERE status = 'VOTING_CLOSED'")
