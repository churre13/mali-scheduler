from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app import models, schemas


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
        orm_mode = True


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
        orm_mode = True
