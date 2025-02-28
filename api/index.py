from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Backend klasörünü Python path'ine ekle
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Ana FastAPI uygulamasını import et
from main import app as main_app

app = FastAPI()

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ebced2.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ana uygulamanın tüm route'larını bu uygulamaya ekle
app.include_router(main_app.router)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"} 