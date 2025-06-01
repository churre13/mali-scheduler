from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/coursemodules", tags=["CourseModuleSessions"])

@router.get("/academic-view", response_model=list[schemas.AcademicModuleView])
def get_academic_view(db: Session = Depends(get_db)):
    sessions = db.query(models.CourseModuleSession).all()
    result = []
    for s in sessions:
        result.append(schemas.AcademicModuleView(
            id=s.id,
            course_name=s.module.course.name,
            module_name=s.module.name,
            professor_name=s.professor.name if s.professor else None,
            syllabus_status=s.syllabus_status,
            observations=s.observations,
            hours=s.hours
        ))
    return result
