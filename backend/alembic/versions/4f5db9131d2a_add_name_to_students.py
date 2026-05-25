"""add name to students

Revision ID: 4f5db9131d2a
Revises: 8c0fd8c2c8b7
Create Date: 2026-05-25 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4f5db9131d2a"
down_revision: Union[str, Sequence[str], None] = "8c0fd8c2c8b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("students", sa.Column("name", sa.String(), nullable=True))

    op.execute(
        """
        UPDATE students AS s
        SET name = u.name
        FROM users AS u
        WHERE s.user_id = u.id AND s.name IS NULL
        """
    )


def downgrade() -> None:
    op.drop_column("students", "name")

