from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import pandas as pd

# Backend klasörünü Python path'ine ekle
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Ana FastAPI uygulamasını import et
from main import app as main_app

app = FastAPI()

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ebced2-8gt3.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api")
async def root():
    return {
        "message": "Ebced API is running",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/api/health")
async def health_check():
    try:
        # Test database connection or any other critical services here
        return {
            "status": "healthy",
            "timestamp": str(pd.Timestamp.now()),
            "environment": os.environ.get("VERCEL_ENV", "development")
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Ana uygulamanın tüm route'larını bu uygulamaya ekle
app.include_router(main_app.router, prefix="/api") 