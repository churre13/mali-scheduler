from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import course


app = FastAPI(title="MALI Scheduler API")

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
