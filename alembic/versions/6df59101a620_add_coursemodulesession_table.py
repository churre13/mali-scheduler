"""Add CourseModuleSession table

Revision ID: 6df59101a620
Revises: 
Create Date: 2025-05-31 01:46:08.635809
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6df59101a620'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'course_module_sessions',
        sa.Column('session_number', sa.Integer(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('course_module_sessions', 'session_number')

