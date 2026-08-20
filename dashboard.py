#!/usr/bin/env python3
"""
NewsFlow Dashboard Server — Entry Point

Launches the FastAPI backend web server serving both REST API endpoints
and the modern Single-Page Application (SPA) frontend dashboard.

Usage:
    python dashboard.py                 # Starts server on http://localhost:8000
    python dashboard.py --port 3000     # Runs on custom port
"""

import os
import sys
import argparse
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

load_dotenv()

from src.db.models import init_db
from src.api.routes import router as api_router

# Initialize Database
init_db()

app = FastAPI(
    title="NewsFlow Dashboard API",
    description="Professional management console for news scraping, Gemini rewriting, image generation, and multi-platform publishing pipeline.",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API router
app.include_router(api_router)

# Mount static frontend directory
DASHBOARD_DIR = os.path.join(PROJECT_ROOT, "dashboard")
if not os.path.exists(DASHBOARD_DIR):
    os.makedirs(DASHBOARD_DIR, exist_ok=True)

app.mount("/", StaticFiles(directory=DASHBOARD_DIR, html=True), name="static")


def parse_args():
    parser = argparse.ArgumentParser(description="NewsFlow Web Dashboard Server")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host address to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on (default: 8000)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    print("=" * 60)
    print(" 🚀 NEWSFLOW DASHBOARD SERVER STARTED")
    print(f" 🌐 Dashboard Web UI: http://{args.host}:{args.port}")
    print(f" 📚 API Documentation: http://{args.host}:{args.port}/docs")
    print("=" * 60)
    uvicorn.run("dashboard:app", host=args.host, port=args.port, reload=args.reload)
