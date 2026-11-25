from app.api.routes import auth
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import expenses
from app.api.routes import savings
from app.api.routes import investments
app = FastAPI(
    title="MicroVest AI API",
    description="AI-powered personal financial companion",
    version="1.0.0"
)
app.include_router(expenses.router)
app.include_router(savings.router)
app.include_router(investments.router)
app.include_router(auth.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Welcome to MicroVest AI!",
        "status": "Backend is running"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "MicroVest AI"
    }