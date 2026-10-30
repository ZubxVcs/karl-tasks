import os
import sqlite3
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB_PATH = os.path.expanduser("~/homelab/karl_tasks/tasks.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT DEFAULT 'Umum',
            priority TEXT DEFAULT 'Sedang',
            deadline TEXT DEFAULT '',
            completed BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

app = FastAPI(title="Karl's Task Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskCreate(BaseModel):
    title: str
    category: Optional[str] = "Umum"
    priority: Optional[str] = "Sedang"
    deadline: Optional[str] = ""
    description: Optional[str] = ""
    instructions: Optional[str] = ""
    materials: Optional[str] = ""
    submission_info: Optional[str] = ""
    file_url: Optional[str] = ""
    web_preview_url: Optional[str] = ""
    image_url: Optional[str] = ""

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[str] = None
    completed: Optional[bool] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    materials: Optional[str] = None
    submission_info: Optional[str] = None
    file_url: Optional[str] = None
    web_preview_url: Optional[str] = None
    image_url: Optional[str] = None

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT DEFAULT 'Umum',
            priority TEXT DEFAULT 'Sedang',
            deadline TEXT DEFAULT '',
            completed BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/todos")
def get_tasks():
    conn = get_db()
    cursor = conn.cursor()
    # Urutkan: tugas belum selesai lebih dulu, lalu deadline terdekat (deadline kosong ditaruh di akhir), lalu id ASC
    cursor.execute("""
        SELECT id, title, category, priority, deadline, completed, created_at,
               description, instructions, materials, submission_info, file_url, web_preview_url, image_url
        FROM tasks 
        ORDER BY 
            completed ASC,
            CASE WHEN deadline IS NULL OR deadline = '' THEN 1 ELSE 0 END ASC,
            deadline ASC,
            id ASC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "title": r["title"],
            "category": r["category"],
            "priority": r["priority"],
            "deadline": r["deadline"] or "",
            "completed": bool(r["completed"]),
            "created_at": r["created_at"],
            "description": r["description"] or "",
            "instructions": r["instructions"] or "",
            "materials": r["materials"] or "",
            "submission_info": r["submission_info"] or "",
            "file_url": r["file_url"] or "",
            "web_preview_url": r["web_preview_url"] or "",
            "image_url": r["image_url"] or ""
        }
        for r in rows
    ]

@app.post("/api/todos")
def create_task(item: TaskCreate):
    cleaned_title = item.title.strip()
    if not cleaned_title:
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO tasks (title, category, priority, deadline, completed, description, instructions, materials, submission_info, file_url, web_preview_url, image_url)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            cleaned_title, item.category or "Umum", item.priority or "Sedang", item.deadline or "",
            item.description or "", item.instructions or "", item.materials or "",
            item.submission_info or "", item.file_url or "", item.web_preview_url or "", item.image_url or ""
        )
    )
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": new_id,
        "title": cleaned_title,
        "category": item.category or "Umum",
        "priority": item.priority or "Sedang",
        "deadline": item.deadline or "",
        "completed": False
    }

@app.patch("/api/todos/{task_id}")
def update_task(task_id: int, item: TaskUpdate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM tasks WHERE id = ?", (task_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    fields = []
    values = []
    if item.title is not None:
        fields.append("title = ?")
        values.append(item.title.strip())
    if item.category is not None:
        fields.append("category = ?")
        values.append(item.category)
    if item.priority is not None:
        fields.append("priority = ?")
        values.append(item.priority)
    if item.deadline is not None:
        fields.append("deadline = ?")
        values.append(item.deadline)
    if item.completed is not None:
        fields.append("completed = ?")
        values.append(1 if item.completed else 0)
    if item.description is not None:
        fields.append("description = ?")
        values.append(item.description)
    if item.instructions is not None:
        fields.append("instructions = ?")
        values.append(item.instructions)
    if item.materials is not None:
        fields.append("materials = ?")
        values.append(item.materials)
    if item.submission_info is not None:
        fields.append("submission_info = ?")
        values.append(item.submission_info)
    if item.file_url is not None:
        fields.append("file_url = ?")
        values.append(item.file_url)
    if item.web_preview_url is not None:
        fields.append("web_preview_url = ?")
        values.append(item.web_preview_url)
    if item.image_url is not None:
        fields.append("image_url = ?")
        values.append(item.image_url)
        
    if fields:
        values.append(task_id)
        cursor.execute(f"UPDATE tasks SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/todos/{task_id}")
def delete_task(task_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"success": True}

from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi import Request, UploadFile, File

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

@app.post("/api/upload")
async def upload_task_file(file: UploadFile = File(...)):
    filename = file.filename
    clean_name = f"{int(os.path.getmtime(DB_PATH))}_{filename}"
    save_path = os.path.join(UPLOADS_DIR, clean_name)
    with open(save_path, "wb") as f:
        f.write(await file.read())
    return {
        "success": True,
        "filename": filename,
        "url": f"/uploads/{clean_name}"
    }

@app.get("/download/{filename}")
def download_custom_file(filename: str):
    homelab_path = os.path.expanduser(f"~/homelab/{filename}")
    if os.path.exists(homelab_path):
        return FileResponse(homelab_path, filename=filename)
    upload_path = os.path.join(UPLOADS_DIR, filename)
    if os.path.exists(upload_path):
        return FileResponse(upload_path, filename=filename)
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/", response_class=HTMLResponse)
def serve_overview(request: Request):
    return templates.TemplateResponse(request, "overview.html", {
        "active_page": "overview",
        "page_title": "Karl • Overview"
    })

@app.get("/calendar", response_class=HTMLResponse)
def serve_calendar(request: Request):
    return templates.TemplateResponse(request, "calendar.html", {
        "active_page": "calendar",
        "page_title": "Karl • Calendar & Schedule"
    })

@app.get("/tasks", response_class=HTMLResponse)
def serve_tasks(request: Request):
    return templates.TemplateResponse(request, "tasks.html", {
        "active_page": "tasks",
        "page_title": "Karl • Projects & Tasks"
    })

@app.get("/settings", response_class=HTMLResponse)
def serve_settings(request: Request):
    return templates.TemplateResponse(request, "settings.html", {
        "active_page": "settings",
        "page_title": "Karl • Pengaturan & Desain"
    })

@app.get("/profile", response_class=HTMLResponse)
def serve_profile(request: Request):
    return templates.TemplateResponse(request, "settings.html", {
        "active_page": "settings",
        "page_title": "Karl • Pengaturan & Desain"
    })
