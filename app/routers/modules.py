from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from typing import Dict, Any


router = APIRouter(prefix="/modules", tags=["Modules"])

@router.post("/bulk-load/")
def bulk_load_modules(data: list[schemas.BulkModuleEntry], db: Session = Depends(get_db)):
    created = []
    for entry in data:
        course = db.query(models.Course).filter_by(name=entry.course_name).first()
        if not course:
            continue

        for mod_data in entry.modules:
            existing = db.query(models.Module).filter_by(name=mod_data.name, course_id=course.id).first()
            if not existing:
                new_mod = models.Module(name=mod_data.name, order=mod_data.order, course_id=course.id)
                db.add(new_mod)
                created.append(f"{course.name} - {mod_data.name}")
    db.commit()
    return {"created_modules": created}

@router.get("/", response_model=list[schemas.Module])
def read_modules(db: Session = Depends(get_db)):
    return db.query(models.Module).all()

@router.get("/by-course/{course_id}", response_model=list[schemas.Module])
def get_modules_by_course(course_id: int, db: Session = Depends(get_db)):
    """Get all modules for a specific course with professor assignments"""
    modules = db.query(models.Module).filter(models.Module.course_id == course_id).order_by(models.Module.order).all()
    return modules

@router.put("/{module_id}/assign-professor")
def assign_professor_to_module(
    module_id: int,
    professor_id: int = None,  # None to unassign
    db: Session = Depends(get_db)
):
    """Assign or unassign a professor to a specific module"""
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    if professor_id:
        professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
        if not professor:
            raise HTTPException(status_code=404, detail="Professor not found")
        module.professor_id = professor_id
    else:
        module.professor_id = None
    
    db.commit()
    db.refresh(module)
    
    return {
        "message": "Module assignment updated",
        "module_id": module.id,
        "module_name": module.name,
        "professor_id": module.professor_id,
        "professor_name": professor.name if professor_id else None
    }

@router.post("/bulk-assign")
def bulk_assign_modules(
    assignments: list[Dict[str, Any]],  # [{"module_id": 1, "professor_id": 2}, ...]
    db: Session = Depends(get_db)
):
    """Bulk assign multiple modules to professors"""
    results = []
    
    for assignment in assignments:
        module_id = assignment.get("module_id")
        professor_id = assignment.get("professor_id")
        
        module = db.query(models.Module).filter(models.Module.id == module_id).first()
        if not module:
            continue
            
        module.professor_id = professor_id
        results.append({
            "module_id": module_id,
            "module_name": module.name,
            "professor_id": professor_id
        })
    
    db.commit()
    return {"message": f"Updated {len(results)} module assignments", "results": results}

@router.delete("/{module_id}")
def delete_module(module_id: int, db: Session = Depends(get_db)):
    """Delete a module and all its sessions"""
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    module_name = module.name
    course_name = module.course.name if module.course else "Unknown"
    
    # Delete related sessions
    sessions_deleted = db.query(models.CourseModuleSession).filter(
        models.CourseModuleSession.module_id == module.id
    ).delete()
    
    # Delete the module
    db.delete(module)
    db.commit()
    
    return {
        "message": f"Module '{module_name}' from course '{course_name}' deleted successfully",
        "sessions_deleted": sessions_deleted
    }

@router.delete("/{module_id}/unassign-professor")
def unassign_professor_from_module(module_id: int, db: Session = Depends(get_db)):
    """Remove professor assignment from a module"""
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    professor_name = "No one" if not module.professor_id else "Unknown"
    if module.professor_id:
        professor = db.query(models.Professor).filter(models.Professor.id == module.professor_id).first()
        if professor:
            professor_name = professor.name
    
    module.professor_id = None
    db.commit()
    
    return {
        "message": f"Professor '{professor_name}' unassigned from module '{module.name}'"
    }