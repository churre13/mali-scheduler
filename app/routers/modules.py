from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

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
