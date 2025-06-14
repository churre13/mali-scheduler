from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from typing import List
from sqlalchemy import text


router = APIRouter(prefix="/professors", tags=["professors"])


@router.post("/bulk-load/")
def bulk_load_professors(
    data: List[schemas.ProfessorCreate] = Body(...),
    db: Session = Depends(get_db)
):
    for entry in data:
        existing_prof = db.query(models.Professor).filter_by(name=entry.name).first()
        if existing_prof:
            continue
        new_prof = models.Professor(name=entry.name)
        for course_name in entry.course_names:
            course = db.query(models.Course).filter_by(name=course_name).first()
            if course:
                new_prof.courses.append(course)
        db.add(new_prof)
    db.commit()
    return {"message": "Profes cargados"}

@router.get("/", response_model=list[schemas.ProfessorRead])
def read_professors(db: Session = Depends(get_db)):
    profs = db.query(models.Professor).all()
    return [
        schemas.ProfessorRead(id=prof.id, name=prof.name, courses=[c.name for c in prof.courses])
        for prof in profs
    ]


@router.get("/{professor_id}/sessions", response_model=list[schemas.CourseModuleSessionRead])
def get_sessions_by_professor(professor_id: int, db: Session = Depends(get_db)):
    prof = db.query(models.Professor).filter_by(id=professor_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Profesor no encontrado")

    sessions = []
    for course in prof.courses:
        for module in course.modules:
            sessions += module.sessions

    return sessions

@router.delete("/{professor_id}", response_model=schemas.ProfessorRead)
def delete_professor(professor_id: int, db: Session = Depends(get_db)):
    prof = db.query(models.Professor).filter_by(id=professor_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Profesor no encontrado")
    prof.courses.clear()  # Eliminar relaciones many-to-many
    db.delete(prof)
    db.commit()
    return prof


@router.delete("/delete-all/")
def delete_all_professors(db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM professor_courses"))  # Rompe relaciones M2M
    num_deleted = db.query(models.Professor).delete()
    db.commit()
    return {"message": f"{num_deleted} profesores eliminados"}