from sqlalchemy import Table, Column, Integer, String, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from typing import Optional


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
