from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
    allow_origins=["*"],  # Vercel'de yeni domain'i otomatik algıla
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static dosyaları servis et
static_path = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_path):
    app.mount("/", StaticFiles(directory=static_path, html=True), name="static")
    print(f"Static files mounted from: {static_path}")
else:
    print(f"Warning: Static directory not found at {static_path}")

@app.get("/api")
async def root():
    return {
        "message": "Ebced API is running",
        "version": "1.0.0",
        "status": "active",
        "static_path": static_path,
        "static_exists": os.path.exists(static_path),
        "files": os.listdir(static_path) if os.path.exists(static_path) else []
    }

@app.get("/api/health")
async def health_check():
    try:
        return {
            "status": "healthy",
            "timestamp": str(pd.Timestamp.now()),
            "environment": os.environ.get("VERCEL_ENV", "development"),
            "static_path": static_path,
            "static_exists": os.path.exists(static_path)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Ana uygulamanın tüm route'larını bu uygulamaya ekle
app.include_router(main_app.router, prefix="/api")

# Tüm diğer route'ları index.html'e yönlendir
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    index_path = os.path.join(static_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "error": "Frontend not found",
        "path": full_path,
        "static_path": static_path,
        "index_path": index_path,
        "exists": os.path.exists(index_path)
    } 