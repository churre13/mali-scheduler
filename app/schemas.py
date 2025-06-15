from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date
from app import models, schemas
from enum import Enum

# ---------- MODULES ----------
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

# ---------- PROFESSORS ----------

class ProfessorBase(BaseModel):
    name: str

class ProfessorCreate(ProfessorBase):
    course_names: list[str]  # nombres de cursos

class ProfessorRead(ProfessorBase):
    id: int
    courses: list[str]

    @classmethod
    def from_orm_with_courses(cls, professor):
        return cls(
            id=professor.id,
            name=professor.name,
            courses=[course.name for course in professor.courses],
        )

    class Config:
        from_attributes = True  # Para Pydantic v2

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
    professors: List[ProfessorRead] = []

    class Config:
        from_attributes = True

class CourseUpdate(BaseModel):
    name: Optional[str]
    duration_months: Optional[int]
    start_date: Optional[date]
    schedule: Optional[str]
    category: Optional[str]
    modules: Optional[List[ModuleCreate]]
    class Config:
        from_attributes = True

# ---------- BULK ----------

class CourseBulkCreate(BaseModel):
    name: str
    duration_months: int = 1
    start_date: Optional[str] = None
    schedule: str = ""
    category: str

class BulkModuleEntry(BaseModel):
    course_name: str
    modules: List[ModuleCreate]

# ---------- SCHEDULE PREVIEW ----------

class CourseSchedulePreview(BaseModel):
    course_name: str
    start_date: Optional[date]
    schedule: Optional[str]
    professors: List[str]
    sessions: List[str]

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

# ---------- MODULE TABLE VIEW ----------

class AcademicModuleView(BaseModel):
    id: int
    course_name: str
    module_name: str
    professor_name: Optional[str]
    syllabus_status: Optional[str]
    observations: Optional[str]
    hours: Optional[int]

    class Config:
        from_attributes = True

class ProfessorScheduleItem(BaseModel):
    session_id: int
    session_number: int
    date: date
    status: SessionStatusEnum
    extra_note: Optional[str]
    hours: Optional[int]
    course_name: str
    module_name: str
    course_id: int
    module_id: int

    class Config:
        from_attributes = True

class CourseUpdateWithProfessors(BaseModel):
    name: Optional[str]
    duration_months: Optional[int]
    start_date: Optional[date]
    schedule: Optional[str]
    category: Optional[str]
    professor_ids: Optional[List[int]] = []
    
    class Config:
        from_attributes = True

class ModuleWithProfessor(BaseModel):
    id: int
    name: str
    order: Optional[int]
    professor: Optional[dict[str, Any]]  # {"id": 1, "name": "Professor Name"}
    syllabus_status: Optional[str]
    observations: Optional[str]
    hours: Optional[int]
    
    class Config:
        from_attributes = True

class CourseModulesResponse(BaseModel):
    course_id: int
    course_name: str
    modules: List[ModuleWithProfessor]

class ProfessorModulesResponse(BaseModel):
    professor_id: int
    professor_name: str
    modules: List[dict[str, Any]]
    total_modules: int

class ModuleAssignment(BaseModel):
    module_id: int
    professor_id: Optional[int]  # None to unassign