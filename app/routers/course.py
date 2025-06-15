from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from app.database import SessionLocal, get_db
from app import crud, schemas, models
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional


class CourseUpdateWithProfessors(BaseModel):
    name: Optional[str] = None
    duration_months: Optional[int] = None
    start_date: Optional[date] = None
    schedule: Optional[str] = None
    category: Optional[str] = None
    professor_ids: Optional[List[int]] = []

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
def update_course(
    course_id: int, 
    updated_course: CourseUpdateWithProfessors, 
    db: Session = Depends(get_db)
):
    """Update course including professor assignments"""
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    # Get the data as dict and remove professor_ids for separate processing
    updated_data = updated_course.dict(exclude_unset=True)
    professor_ids = updated_data.pop("professor_ids", [])

    # Update basic course fields
    for key, value in updated_data.items():
        if key != "professor_ids":  # Skip professor_ids as we handle it separately
            setattr(db_course, key, value)

    # Handle professor assignments if provided
    if "professor_ids" in updated_course.dict(exclude_unset=False):
        # Clear existing professor assignments
        db_course.professors.clear()
        
        # Add new professor assignments
        for prof_id in professor_ids:
            professor = db.query(models.Professor).filter(models.Professor.id == prof_id).first()
            if professor:
                db_course.professors.append(professor)

    db.commit()
    db.refresh(db_course)
    
    # Return the course with properly formatted response
    return {
        "id": db_course.id,
        "name": db_course.name,
        "duration_months": db_course.duration_months,
        "start_date": db_course.start_date,
        "schedule": db_course.schedule,
        "is_active": db_course.is_active,
        "category": db_course.category,
        "modules": [{"id": m.id, "name": m.name, "order": m.order, "course_id": m.course_id} for m in db_course.modules],
        "professors": [
            {
                "id": p.id,
                "name": p.name,
                "courses": [c.name for c in p.courses]
            }
            for p in db_course.professors
        ],
    }


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


@router.put("/{course_id}/professors")
def update_course_professors(
    course_id: int, 
    professor_ids: List[int], 
    db: Session = Depends(get_db)
):
    """Update the professors assigned to a course"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Clear existing professor assignments
    course.professors.clear()
    
    # Add new professor assignments
    for prof_id in professor_ids:
        professor = db.query(models.Professor).filter(models.Professor.id == prof_id).first()
        if professor:
            course.professors.append(professor)
    
    db.commit()
    db.refresh(course)
    return {"message": "Professors updated successfully"}

@router.get("/{course_id}/sessions", response_model=List[schemas.CourseModuleSessionRead])
def get_course_sessions(course_id: int, db: Session = Depends(get_db)):
    """Get all sessions for a course"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    sessions = []
    for module in course.modules:
        sessions.extend(module.sessions)
    
    return sessions

@router.get("/{course_id}/debug")
def debug_course(course_id: int, db: Session = Depends(get_db)):
    """Debug endpoint to see course data"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return {
        "id": course.id,
        "name": course.name,
        "category": course.category,
        "schedule": course.schedule,
        "start_date": course.start_date,
        "professors": [{"id": p.id, "name": p.name} for p in course.professors],
        "professors_count": len(course.professors)
    }

@router.get("/{course_id}/modules-with-professors")
def get_course_modules_with_professors(course_id: int, db: Session = Depends(get_db)):
    """Get all modules for a course with their professor assignments"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    modules_data = []
    for module in course.modules:
        professor_info = None
        if module.professor_id:
            professor = db.query(models.Professor).filter(models.Professor.id == module.professor_id).first()
            if professor:
                professor_info = {"id": professor.id, "name": professor.name}
        
        modules_data.append({
            "id": module.id,
            "name": module.name,
            "order": module.order,
            "professor": professor_info,
            "syllabus_status": module.syllabus_status,
            "observations": module.observations,
            "hours": module.hours
        })
    
    return {
        "course_id": course.id,
        "course_name": course.name,
        "modules": modules_data
    }

@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """Delete a course and all its related data"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course_name = course.name
    modules_count = len(course.modules)
    professors_count = len(course.professors)
    
    # Delete related sessions first
    for module in course.modules:
        db.query(models.CourseModuleSession).filter(models.CourseModuleSession.module_id == module.id).delete()
    
    # Clear professor relationships
    course.professors.clear()
    
    # Delete modules (cascade should handle this, but being explicit)
    db.query(models.Module).filter(models.Module.course_id == course.id).delete()
    
    # Delete the course
    db.delete(course)
    db.commit()
    
    return {
        "message": f"Course '{course_name}' deleted successfully",
        "deleted_modules": modules_count,
        "removed_professor_assignments": professors_count
    }

@router.delete("/{course_id}/modules/{module_id}")
def delete_course_module(course_id: int, module_id: int, db: Session = Depends(get_db)):
    """Delete a specific module from a course"""
    module = db.query(models.Module).filter(
        models.Module.id == module_id,
        models.Module.course_id == course_id
    ).first()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found in this course")
    
    module_name = module.name
    
    # Delete related sessions
    sessions_deleted = db.query(models.CourseModuleSession).filter(
        models.CourseModuleSession.module_id == module.id
    ).delete()
    
    # Delete the module
    db.delete(module)
    db.commit()
    
    return {
        "message": f"Module '{module_name}' deleted successfully",
        "sessions_deleted": sessions_deleted
    }

@router.delete("/bulk-delete-courses")
def bulk_delete_courses(course_ids: List[int], db: Session = Depends(get_db)):
    """Delete multiple courses at once"""
    deleted_courses = []
    total_modules = 0
    total_sessions = 0
    
    for course_id in course_ids:
        course = db.query(models.Course).filter(models.Course.id == course_id).first()
        if not course:
            continue
            
        # Count what we're deleting
        modules_count = len(course.modules)
        sessions_count = sum(len(module.sessions) for module in course.modules)
        
        # Delete sessions
        for module in course.modules:
            db.query(models.CourseModuleSession).filter(
                models.CourseModuleSession.module_id == module.id
            ).delete()
        
        # Clear relationships and delete
        course.professors.clear()
        db.query(models.Module).filter(models.Module.course_id == course.id).delete()
        db.delete(course)
        
        deleted_courses.append(course.name)
        total_modules += modules_count
        total_sessions += sessions_count
    
    db.commit()
    
    return {
        "message": f"Deleted {len(deleted_courses)} courses",
        "deleted_courses": deleted_courses,
        "total_modules_deleted": total_modules,
        "total_sessions_deleted": total_sessions
    }