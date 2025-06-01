from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from dateutil import parser as date_parser
from holidays import CountryHoliday
from dateutil.rrule import rrule, WEEKLY
from datetime import datetime
import unicodedata
import re

router = APIRouter(prefix="/courses", tags=["CourseSchedulePreview"])
hd = CountryHoliday("PE")

# Lógica para convertir string tipo "Lunes y Miércoles" a días numéricos
days_map = {
    "lunes": 0,
    "martes": 1,
    "miércoles": 2,
    "miercoles": 2,
    "jueves": 3,
    "viernes": 4,
    "sábado": 5,
    "sabado": 5,
    "domingo": 6
}

def parse_days(schedule_str: str):
    if not schedule_str:
        return []
    normalized = unicodedata.normalize("NFKD", schedule_str.lower()).encode("ASCII", "ignore").decode("utf-8")
    words = re.findall(r'\b[a-z]+', normalized)  # extrae solo palabras como "lunes", "sabado", etc.
    return [days_map[day] for day in days_map if day in words]

@router.get("/schedule-preview", response_model=list[schemas.CourseSchedulePreview])
def get_schedule_preview(db: Session = Depends(get_db)):
    courses = db.query(models.Course).all()
    previews = []

    for course in courses:
        if not course.start_date or not course.schedule:
            continue

        start = course.start_date
        end = start + relativedelta(months=course.duration_months)
        weekdays = parse_days(course.schedule)
        sessions = []

        for dt in rrule(WEEKLY, byweekday=weekdays, dtstart=start, until=end):
            if dt.date() not in hd:
                sessions.append(dt.date().isoformat())

        previews.append(schemas.CourseSchedulePreview(
            course_name=course.name,
            start_date=course.start_date,
            schedule=course.schedule,
            professors=[p.name for p in course.professors],
            sessions=sessions
        ))

    return previews
