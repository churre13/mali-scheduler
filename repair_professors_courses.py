from app.database import SessionLocal
from app import models

db = SessionLocal()

# Recorre todos los profesores y asegura su vínculo con los cursos
professors = db.query(models.Professor).all()
missing_links = 0

for prof in professors:
    for course_name in [c.name for c in prof.courses]:
        course = db.query(models.Course).filter_by(name=course_name).first()
        if course and course not in prof.courses:
            prof.courses.append(course)
            print(f"✔ Vinculado: {prof.name} ↔ {course.name}")
            missing_links += 1

if missing_links == 0:
    print("✅ Todas las relaciones ya estaban correctamente asignadas.")
else:
    db.commit()
    print(f"✅ Reparadas {missing_links} relaciones faltantes.")

db.close()
