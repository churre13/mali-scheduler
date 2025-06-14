from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import course
from app.routers import coursemodules
from app.routers import session
from app.routers import professor
from app.routers import schedule
from app.routers import modules




app = FastAPI(title="MALI Scheduler API")
app.include_router(session.router)
app.include_router(professor.router)
app.include_router(coursemodules.router)
app.include_router(schedule.router)
app.include_router(modules.router)


Base.metadata.create_all(bind=engine)

# Conectar routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(course.router)

@app.get("/")
def read_root():
    return {"message": "¡MALI Scheduler activo y listo!"}
