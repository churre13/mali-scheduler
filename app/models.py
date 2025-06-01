from sqlalchemy import Table, Column, Integer, String, Boolean, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from typing import Optional
from enum import Enum as PyEnum
from app.schemas import SessionStatusEnum


class SessionStatusEnum(PyEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    COMPLETED = "completed"

# Tabla intermedia
professor_courses = Table(
    "professor_courses",
    Base.metadata,
    Column("professor_id", Integer, ForeignKey("professors.id")),
    Column("course_id", Integer, ForeignKey("courses.id")),
)

class Professor(Base):
    __tablename__ = "professors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    courses = relationship("Course", secondary=professor_courses, back_populates="professors")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    duration_months = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=True)
    schedule = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    category = Column(String, nullable=True)
    professors = relationship("Professor", secondary=professor_courses, back_populates="courses")

    modules = relationship("Module", back_populates="course", cascade="all, delete")


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    order = Column(Integer, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"))

    course = relationship("Course", back_populates="modules")
    sessions = relationship("CourseModuleSession", back_populates="module")

class CourseModuleSession(Base):
    __tablename__ = "course_module_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_number = Column(Integer)
    date = Column(Date)
    status = Column(Enum(SessionStatusEnum), default=SessionStatusEnum.ACTIVE)
    extra_note = Column(String, nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"))

    module = relationship("Module", back_populates="sessions")

