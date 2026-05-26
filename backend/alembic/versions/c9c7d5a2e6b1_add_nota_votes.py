"""add nota support to votes

Revision ID: c9c7d5a2e6b1
Revises: 4f5db9131d2a
Create Date: 2026-05-26 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c9c7d5a2e6b1"
down_revision: Union[str, Sequence[str], None] = "4f5db9131d2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("votes") as batch_op:
        batch_op.add_column(
            sa.Column("is_nota", sa.Boolean(), nullable=False, server_default=sa.false())
        )
        batch_op.alter_column("candidate_id", existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("votes") as batch_op:
        batch_op.alter_column("candidate_id", existing_type=sa.Integer(), nullable=False)
        batch_op.drop_column("is_nota")
