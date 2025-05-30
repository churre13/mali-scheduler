from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app import models, schemas
from enum import Enum


# ---------- MODULE ----------

class ModuleBase(BaseModel):
    name: str
    order: Optional[int] = None


class ModuleCreate(ModuleBase):
    pass


class Module(ModuleBase):
    id: int
    course_id: Optional[int]

    class Config:
        from_attributes = True


# ---------- COURSE ----------

class CourseBase(BaseModel):
    name: str
    duration_months: int
    start_date: Optional[date]
    schedule: Optional[str]
    is_active: Optional[bool] = True
    category: Optional[str] = None



class CourseCreate(CourseBase):
    modules: Optional[List[ModuleCreate]] = []



class Course(CourseBase):
    id: int
    modules: List[Module] = []

    class Config:
        from_attributes = True

# ---------- MODULE SESSION ----------

class SessionStatusEnum(str, Enum):
    PROGRAMADA = "Programada"
    CANCELADA = "Cancelada"
    RECUPERACION = "Recuperación"
    CONFIRMADA = "Confirmada"
    FALTA_PROFE = "Falta profe"
    PENDIENTE = "Pendiente"

class CourseModuleSessionBase(BaseModel):
    session_number: int
    date: date
    status: SessionStatusEnum
    extra_note: Optional[str] = None
    module_id: int

class CourseModuleSessionCreate(CourseModuleSessionBase):
    pass

class CourseModuleSessionUpdate(BaseModel):
    date: Optional[date]
    status: Optional[SessionStatusEnum]
    extra_note: Optional[str]

class CourseModuleSessionRead(CourseModuleSessionBase):
    id: int

    class Config:
        from_attributes = True

# ---------- PROFESSORS ----------

class ProfessorBase(BaseModel):
    name: str

class ProfessorCreate(ProfessorBase):
    course_names: list[str]  # nombres de cursos

class ProfessorRead(ProfessorBase):
    id: int
    courses: list[str]

    class Config:
        orm_mode = True


# ---------- UPLOAD BULK COURSES ----------

class CourseBulkCreate(BaseModel):
    name: str
    duration_months: int = 1
    start_date: Optional[str] = None
    schedule: str = ""
    category: str
