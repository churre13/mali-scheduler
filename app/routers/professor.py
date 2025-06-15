from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from typing import List, Optional
from sqlalchemy import text
from dateutil.relativedelta import relativedelta


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

@router.get("/{professor_id}/schedule")
def get_professor_schedule(professor_id: int, db: Session = Depends(get_db)):
    """Get a professor's complete schedule with course information"""
    professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")
    
    schedule = []
    for course in professor.courses:
        for module in course.modules:
            for session in module.sessions:
                schedule.append({
                    "session_id": session.id,
                    "session_number": session.session_number,
                    "date": session.date,
                    "status": session.status,
                    "extra_note": session.extra_note,
                    "hours": session.hours,
                    "course_name": course.name,
                    "module_name": module.name,
                    "course_id": course.id,
                    "module_id": module.id
                })
    
    # Sort by date
    schedule.sort(key=lambda x: x["date"])
    return schedule

@router.put("/{professor_id}/assign-to-module/{module_id}")
def assign_professor_to_module(
    professor_id: int, 
    module_id: int, 
    db: Session = Depends(get_db)
):
    """Assign a professor to a specific module"""
    professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    module.professor_id = professor_id
    db.commit()
    return {"message": f"Professor {professor.name} assigned to module {module.name}"}

@router.get("/{professor_id}/modules")
def get_professor_modules(professor_id: int, db: Session = Depends(get_db)):
    """Get all modules assigned to a specific professor"""
    professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")
    
    modules = db.query(models.Module).filter(models.Module.professor_id == professor_id).all()
    
    modules_data = []
    for module in modules:
        course = db.query(models.Course).filter(models.Course.id == module.course_id).first()
        modules_data.append({
            "module_id": module.id,
            "module_name": module.name,
            "module_order": module.order,
            "course_id": course.id,
            "course_name": course.name,
            "hours": module.hours,
            "syllabus_status": module.syllabus_status
        })
    
    return {
        "professor_id": professor.id,
        "professor_name": professor.name,
        "modules": modules_data,
        "total_modules": len(modules_data)
    }

@router.delete("/{professor_id}")
def delete_professor(professor_id: int, db: Session = Depends(get_db)):
    """Delete a professor and remove all their assignments"""
    professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")
    
    professor_name = professor.name
    courses_count = len(professor.courses)
    
    # Remove from course assignments
    professor.courses.clear()
    
    # Remove from module assignments
    modules_updated = db.query(models.Module).filter(models.Module.professor_id == professor_id).update(
        {"professor_id": None}
    )
    
    # Delete the professor
    db.delete(professor)
    db.commit()
    
    return {
        "message": f"Professor '{professor_name}' deleted successfully",
        "courses_unassigned": courses_count,
        "modules_unassigned": modules_updated
    }

@router.delete("/{professor_id}/unassign-from-course/{course_id}")
def unassign_professor_from_course(professor_id: int, course_id: int, db: Session = Depends(get_db)):
    """Remove professor assignment from a specific course"""
    professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Remove from course
    if course in professor.courses:
        professor.courses.remove(course)
    
    # Remove from all modules in this course
    modules_updated = db.query(models.Module).filter(
        models.Module.course_id == course_id,
        models.Module.professor_id == professor_id
    ).update({"professor_id": None})
    
    db.commit()
    
    return {
        "message": f"Professor '{professor.name}' unassigned from course '{course.name}'",
        "modules_unassigned": modules_updated
    }

@router.delete("/bulk-delete-professors")
def bulk_delete_professors(professor_ids: List[int], db: Session = Depends(get_db)):
    """Delete multiple professors at once"""
    deleted_professors = []
    total_courses_affected = 0
    total_modules_affected = 0
    
    for professor_id in professor_ids:
        professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
        if not professor:
            continue
            
        courses_count = len(professor.courses)
        modules_count = db.query(models.Module).filter(models.Module.professor_id == professor_id).count()
        
        # Clear assignments
        professor.courses.clear()
        db.query(models.Module).filter(models.Module.professor_id == professor_id).update(
            {"professor_id": None}
        )
        
        # Delete professor
        db.delete(professor)
        
        deleted_professors.append(professor.name)
        total_courses_affected += courses_count
        total_modules_affected += modules_count
    
    db.commit()
    
    return {
        "message": f"Deleted {len(deleted_professors)} professors",
        "deleted_professors": deleted_professors,
        "total_courses_affected": total_courses_affected,
        "total_modules_affected": total_modules_affected
    }

@router.post("/", response_model=schemas.ProfessorRead)
def create_professor(professor: schemas.ProfessorCreate, db: Session = Depends(get_db)):
    """Create a new professor"""
    # Check if professor already exists
    existing_professor = db.query(models.Professor).filter(models.Professor.name == professor.name).first()
    if existing_professor:
        raise HTTPException(status_code=400, detail="Professor with this name already exists")
    
    # Create new professor
    db_professor = models.Professor(name=professor.name)
    db.add(db_professor)
    db.commit()
    db.refresh(db_professor)
    
    # Assign to courses if provided
    for course_name in professor.course_names:
        course = db.query(models.Course).filter(models.Course.name == course_name).first()
        if course:
            db_professor.courses.append(course)
    
    db.commit()
    db.refresh(db_professor)
    
    return schemas.ProfessorRead(
        id=db_professor.id,
        name=db_professor.name,
        courses=[course.name for course in db_professor.courses]
    )

@router.get("/available-courses")
def get_available_courses(db: Session = Depends(get_db)):
    """Get all available courses for assignment"""
    courses = db.query(models.Course).all()
    return [{"id": course.id, "name": course.name} for course in courses]

@router.get("/{professor_id}/details", response_model=schemas.ProfessorDetailRead)
def get_professor_details(professor_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a professor"""
    professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")
    
    # Get courses with dates
    courses_data = []
    for course in professor.courses:
        courses_data.append({
            "id": course.id,
            "name": course.name,
            "start_date": course.start_date,
            "end_date": course.start_date + relativedelta(months=course.duration_months) if course.start_date else None,
            "duration_months": course.duration_months,
            "schedule": course.schedule,
            "category": course.category,
            "is_active": course.is_active
        })

    modules = db.query(models.Module).filter(models.Module.professor_id == professor_id).all()
    modules_data = []
    total_hours = 0
    syllabus_stats = {"hay_documento": 0, "no_hay_documento": 0, "pendiente": 0}
    
    for module in modules:
        course = db.query(models.Course).filter(models.Course.id == module.course_id).first()
        module_hours = module.hours or 2
        total_hours += module_hours
        
        # Count syllabus status
        if module.syllabus_status == "hay documento":
            syllabus_stats["hay_documento"] += 1
        elif module.syllabus_status == "no hay documento":
            syllabus_stats["no_hay_documento"] += 1
        else:
            syllabus_stats["pendiente"] += 1
        
        modules_data.append({
            "id": module.id,
            "name": module.name,
            "order": module.order,
            "course_name": course.name if course else "Unknown",
            "course_id": module.course_id,
            "hours": module_hours,
            "syllabus_status": module.syllabus_status,
            "observations": module.observations
        })
    
    return {
        "id": professor.id,
        "name": professor.name,
        "first_name": professor.first_name,
        "last_name": professor.last_name,
        "email": professor.email,
        "phone": professor.phone,
        "bio": professor.bio,
        "specialties": professor.specialties,
        "is_active": professor.is_active,
        "created_at": professor.created_at,
        "courses": courses_data,
        "modules": modules_data,
        "total_hours": total_hours,
        "syllabus_stats": syllabus_stats
    }

@router.put("/{professor_id}/details", response_model=schemas.ProfessorDetailRead)
def update_professor_details(
    professor_id: int, 
    professor_update: schemas.ProfessorUpdate, 
    db: Session = Depends(get_db)
):
    """Update professor details"""
    professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")
    
    # Check for email uniqueness if email is being updated
    update_data = professor_update.dict(exclude_unset=True)
    if "email" in update_data and update_data["email"]:
        existing_email = db.query(models.Professor).filter(
            models.Professor.email == update_data["email"],
            models.Professor.id != professor_id
        ).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already exists")
    
    # Handle course assignments
    course_names = update_data.pop("course_names", None)
    
    # Update basic fields
    for key, value in update_data.items():
        setattr(professor, key, value)
    
    # Update course assignments if provided
    if course_names is not None:
        professor.courses.clear()
        for course_name in course_names:
            course = db.query(models.Course).filter(models.Course.name == course_name).first()
            if course:
                professor.courses.append(course)
    
    db.commit()
    db.refresh(professor)
    
    # Return updated details using the details endpoint
    return get_professor_details(professor_id, db)

@router.put("/{professor_id}/module/{module_id}/syllabus-status")
def update_module_syllabus_status(
    professor_id: int,
    module_id: int,
    status: str,
    observations: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update syllabus status for a specific module"""
    # Verify professor exists and is assigned to this module
    module = db.query(models.Module).filter(
        models.Module.id == module_id,
        models.Module.professor_id == professor_id
    ).first()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found or not assigned to this professor")
    
    valid_statuses = ["hay documento", "no hay documento", "pendiente"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    module.syllabus_status = status
    if observations is not None:
        module.observations = observations
    
    db.commit()
    
    return {"message": "Syllabus status updated successfully", "module_name": module.name, "new_status": status}