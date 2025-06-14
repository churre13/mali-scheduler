from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from dateutil.relativedelta import relativedelta
from app import models, schemas
import holidays
import pytz

peru_tz = pytz.timezone("America/Lima")
peru_holidays = holidays.country_holidays("PE")

def expand_course_schedule(course):
    events = []
    start = peru_tz.localize(datetime.combine(course.start_date, datetime.min.time()))
    end = start + relativedelta(months=course.duration_months)
    days = parse_schedule_days(course.schedule)

    current = start
    while current <= end:
        current_date = current.date()
        if current.weekday() in days and current_date not in peru_holidays:
            events.append({
    "title": course.name,
    "date": current.date().strftime("%Y-%m-%d"),  # 👈🏼 evita todo el drama de timezone
    "category": course.category,
    "id": course.id
})
        elif current.weekday() in days and current_date in peru_holidays:
            end += timedelta(days=1)
        current += timedelta(days=1)

    return events


# ---------- CURSOS ----------

def create_course(db: Session, course: schemas.CourseCreate):
    db_course = models.Course(
        name=course.name,
        duration_months=course.duration_months,
        start_date=course.start_date,
        schedule=course.schedule,
        is_active=course.is_active,
        category=course.category
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)

    # Si vienen módulos, los creamos y los asociamos
    for module_data in course.modules:
        db_module = models.Module(
            name=module_data.name,
            order=module_data.order,
            course_id=db_course.id
        )
        db.add(db_module)

    db.commit()
    db.refresh(db_course)
    return db_course


def get_courses(db: Session, skip: int = 0, limit: int = 100):
    courses = db.query(models.Course).offset(skip).limit(limit).all()
    print("Cargando cursos desde DB:", courses)
    return courses



def get_course(db: Session, course_id: int):
    return db.query(models.Course).filter(models.Course.id == course_id).first()

def generar_sesiones_para_curso(db: Session, course: models.Course):
    if not course.start_date or not course.schedule:
        return

    dias_semana = {
        "Lunes": 0,
        "Martes": 1,
        "Miércoles": 2,
        "Jueves": 3,
        "Viernes": 4,
        "Sábado": 5,
        "Domingo": 6,
    }

    dias = [dias_semana[d] for d in dias_semana if d in course.schedule]
    fecha_actual = course.start_date
    fecha_fin = fecha_actual + relativedelta(months=course.duration_months)
    session_number = 1

    for module in course.modules:
        fecha_actual = course.start_date  # Reiniciamos para cada módulo
        while fecha_actual <= fecha_fin:
            if fecha_actual.weekday() in dias and fecha_actual not in peru_holidays:
                session = models.CourseModuleSession(
                    session_number=session_number,
                    date=fecha_actual,
                    status="Programada",
                    module_id=module.id
                )
                db.add(session)
                session_number += 1
            fecha_actual += timedelta(days=1)

    db.commit()
