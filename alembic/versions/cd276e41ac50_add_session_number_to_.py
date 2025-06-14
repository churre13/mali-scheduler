"""Add session_number to CourseModuleSession

Revision ID: cd276e41ac50
Revises: 6df59101a620
Create Date: 2025-06-01 03:31:19.612074

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd276e41ac50'
down_revision: Union[str, None] = '6df59101a620'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'course_module_sessions',
        sa.Column('session_number', sa.Integer(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('course_module_sessions', 'session_number')

