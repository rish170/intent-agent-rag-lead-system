from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router
from app.db.session import engine, Base

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Intent-Aware Agentic Conversational System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
