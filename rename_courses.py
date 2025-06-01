import requests
import json

BASE_URL = "http://127.0.0.1:8000"

with open("rename_courses.json", "r", encoding="utf-8") as f:
    updates = json.load(f)

for entry in updates:
    old_name = entry["old"]
    new_name = entry["new"]

    # 1. Buscar curso por nombre
    res = requests.get(f"{BASE_URL}/courses/")
    courses = res.json()

    course = next((c for c in courses if c["name"] == old_name), None)

    if not course:
        print(f"❌ Curso '{old_name}' no encontrado.")
        continue

    course_id = course["id"]
    course["name"] = new_name

    # 2. Enviar PUT para actualizar
    put_res = requests.put(f"{BASE_URL}/courses/{course_id}", json=course)
    if put_res.status_code == 200:
        print(f"✅ Renombrado: '{old_name}' → '{new_name}'")
    else:
        print(f"❌ Error al renombrar '{old_name}': {put_res.status_code}")
        print(put_res.text)
