"""sync shared election posts

Revision ID: 5e6f7a8b9c0d
Revises: 4d5e6f7a8b9c
Create Date: 2026-06-15 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5e6f7a8b9c0d"
down_revision: Union[str, Sequence[str], None] = "4d5e6f7a8b9c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _index_exists(table_name: str, index_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return any(index.get("name") == index_name for index in inspector.get_indexes(table_name))


def upgrade() -> None:
    connection = op.get_bind()
    posts = sa.table(
        "posts",
        sa.column("election_id", sa.Integer),
        sa.column("name", sa.String),
        sa.column("display_order", sa.Integer),
    )
    elections = sa.table("elections", sa.column("id", sa.Integer))

    all_elections = [row.id for row in connection.execute(sa.select(elections.c.id))]
    existing_posts = list(
        connection.execute(
            sa.select(posts.c.election_id, posts.c.name, posts.c.display_order)
            .order_by(posts.c.display_order.asc(), posts.c.name.asc())
        )
    )
    post_templates: dict[str, tuple[str, int]] = {}
    for row in existing_posts:
        key = " ".join((row.name or "").strip().lower().split())
        if not key:
            continue
        post_templates.setdefault(key, (row.name, row.display_order or 0))

    for election_id in all_elections:
        existing_names = {
            " ".join((row.name or "").strip().lower().split())
            for row in existing_posts
            if row.election_id == election_id
        }
        for key, (name, display_order) in post_templates.items():
            if key in existing_names:
                continue
            connection.execute(
                posts.insert().values(
                    election_id=election_id,
                    name=name,
                    display_order=display_order,
                )
            )

    if not _index_exists("posts", "idx_posts_name"):
        op.create_index("idx_posts_name", "posts", ["name"])
    if not _index_exists("posts", "idx_posts_election_order"):
        op.create_index("idx_posts_election_order", "posts", ["election_id", "display_order"])


def downgrade() -> None:
    if _index_exists("posts", "idx_posts_election_order"):
        op.drop_index("idx_posts_election_order", table_name="posts")
    if _index_exists("posts", "idx_posts_name"):
        op.drop_index("idx_posts_name", table_name="posts")
