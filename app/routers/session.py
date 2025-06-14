from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.post("/", response_model=schemas.CourseModuleSessionRead)
def create_session(session: schemas.CourseModuleSessionCreate, db: Session = Depends(get_db)):
    db_session = models.CourseModuleSession(**session.dict())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/by-module/{module_id}", response_model=list[schemas.CourseModuleSessionRead])
def get_sessions_by_module(module_id: int, db: Session = Depends(get_db)):
    return db.query(models.CourseModuleSession).filter_by(course_module_id=module_id).all()

@router.put("/{session_id}", response_model=schemas.CourseModuleSessionRead)
def update_session(session_id: int, updates: schemas.CourseModuleSessionUpdate, db: Session = Depends(get_db)):
    db_session = db.query(models.CourseModuleSession).filter(models.CourseModuleSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    for key, value in updates.dict(exclude_unset=True).items():
        setattr(db_session, key, value)

    db.commit()
    db.refresh(db_session)
    return db_session

@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    db_session = db.query(models.CourseModuleSession).filter(models.CourseModuleSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(db_session)
    db.commit()
    return {"message": "Session deleted successfully"}

@router.get("/", response_model=list[schemas.CourseModuleSessionRead])
def get_all_sessions(db: Session = Depends(get_db)):
    return db.query(models.CourseModuleSession).all()
