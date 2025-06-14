from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import SessionLocal, get_db
from app import crud, schemas, models
from sqlalchemy import text


router = APIRouter(prefix="/courses", tags=["Courses"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Course)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    return crud.create_course(db=db, course=course)

@router.get("/", response_model=List[schemas.Course])
def read_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    courses = crud.get_courses(db=db, skip=skip, limit=limit)

    # Transforma manualmente sin usar Pydantic como modelo base
    result = []
    for course in courses:
        result.append({
            "id": course.id,
            "name": course.name,
            "duration_months": course.duration_months,
            "start_date": course.start_date,
            "schedule": course.schedule,
            "is_active": course.is_active,
            "category": course.category,
            "modules": [{"id": m.id, "name": m.name, "order": m.order, "course_id": m.course_id} for m in course.modules],
            "professors": [
                {
                    "id": p.id,
                    "name": p.name,
                    "courses": [c.name for c in p.courses]
                }
                for p in course.professors
            ],
        })
    return result


@router.get("/{course_id}", response_model=schemas.Course)
def read_course(course_id: int, db: Session = Depends(get_db)):
    db_course = crud.get_course(db, course_id=course_id)
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return db_course

@router.delete("/{course_id}", response_model=schemas.Course)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(db_course)
    db.commit()
    return db_course

@router.put("/{course_id}", response_model=schemas.Course)
def update_course(course_id: int, updated_course: schemas.CourseUpdate, db: Session = Depends(get_db)):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    updated_data = updated_course.dict(exclude_unset=True)

    if "modules" in updated_data:
        db_course.modules = [models.Module(**mod) for mod in updated_data.pop("modules")]

    for key, value in updated_data.items():
        setattr(db_course, key, value)

    db.commit()
    db.refresh(db_course)
    return db_course


@router.post("/bulk-load/")
def bulk_create_courses(data: list[schemas.CourseBulkCreate], db: Session = Depends(get_db)):
    created = []
    for entry in data:
        if db.query(models.Course).filter_by(name=entry.name).first():
            continue
        try:
            start_date = (
                datetime.strptime(entry.start_date, "%Y-%m-%d").date()
                if entry.start_date and entry.start_date.lower() != "próximamente"
                else None
            )
        except ValueError:
            start_date = None

        new_course = models.Course(
            name=entry.name,
            duration_months=entry.duration_months,
            start_date=start_date,
            schedule=entry.schedule,
            category=entry.category,
        )
        db.add(new_course)
        created.append(entry.name)
    db.commit()
    return {"created_courses": created}

@router.delete("/bulk-delete/")
def bulk_delete_courses(
    course_ids: List[int] = Query(...),
    db: Session = Depends(get_db)
):
    deleted = []
    for course_id in course_ids:
        course = db.query(models.Course).filter_by(id=course_id).first()
        if course:
            # Eliminar módulos relacionados primero
            db.query(models.Module).filter_by(course_id=course.id).delete()
            db.delete(course)
            deleted.append(course.name)
    db.commit()
    return {"deleted_courses": deleted}



@router.delete("/delete-all/")
def delete_all_courses(db: Session = Depends(get_db)):
    # 1. Eliminar relaciones de profesores con cursos
    db.execute(text("DELETE FROM professor_courses"))

    # 2. Eliminar módulos
    db.query(models.Module).delete()

    # 3. Eliminar cursos
    num_deleted = db.query(models.Course).delete()

    db.commit()
    return {"message": f"{num_deleted} courses, all modules, and professor relations deleted"}

@router.post("/{course_id}/generate-sessions")
def generate_sessions(course_id: int, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    db.refresh(course)  # Asegura que course.modules esté cargado
    crud.generar_sesiones_para_curso(db, course)
    return {"message": "Sesiones generadas exitosamente"}


