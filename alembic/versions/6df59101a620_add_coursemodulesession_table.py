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
    """Upgrade schema."""
    op.create_table(
        'course_module_sessions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('module_id', sa.Integer(), sa.ForeignKey('modules.id')),
        sa.Column('professor_id', sa.Integer(), sa.ForeignKey('professors.id')),
        sa.Column('syllabus_status', sa.String(), nullable=True),
        sa.Column('observations', sa.String(), nullable=True),
        sa.Column('hours', sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('course_module_sessions')
