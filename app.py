import os
import sqlite3
import hashlib
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, Request, UploadFile, File, Response
from fastapi.responses import HTMLResponse, FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ADMIN_PIN = os.environ.get("KARL_ADMIN_PIN", "2611070020")
ADMIN_TOKEN = hashlib.sha256(ADMIN_PIN.encode()).hexdigest()[:32]

def is_admin_request(request: Request) -> bool:
    token = request.cookies.get("karl_admin_token") or request.headers.get("X-Admin-Token") or request.query_params.get("admin_token")
    if token == ADMIN_TOKEN:
        return True
    # Bypass otomatis jika Karl mengakses langsung dari jaringan lokal LAN / localhost
    if request.client and request.client.host in ["127.0.0.1", "::1", "192.168.0.105"]:
        if not request.headers.get("CF-Connecting-IP") and not request.headers.get("CF-Ray"):
            return True
    return False

def require_admin(request: Request):
    if not is_admin_request(request):
        raise HTTPException(
            status_code=403,
            detail="Akses ditolak: Operasi tulis hanya diizinkan untuk Admin (Karl). Pengunjung publik hanya memiliki akses pratinjau (read-only)."
        )

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "tasks.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

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

class AdminLoginRequest(BaseModel):
    pin: str

@app.post("/api/admin/login")
def admin_login(data: AdminLoginRequest, response: Response):
    if data.pin.strip() == ADMIN_PIN:
        # Session berlaku 7 hari (604800 detik), reset otomatis setiap minggu
        # SameSite=lax, path=/, tanpa Secure agar cookie bisa disimpan baik di HTTPS Cloudflare maupun HTTP LAN
        response.set_cookie(
            key="karl_admin_token",
            value=ADMIN_TOKEN,
            max_age=604800,
            path="/",
            samesite="lax",
            httponly=False
        )
        return {"success": True, "token": ADMIN_TOKEN, "message": "Login Admin Berhasil (Sesi 7 Hari)"}
    raise HTTPException(status_code=401, detail="PIN Admin Salah")

@app.post("/api/admin/logout")
def admin_logout(response: Response):
    response.delete_cookie("karl_admin_token", path="/")
    return {"success": True, "message": "Logout Berhasil"}

@app.post("/api/todos")
def create_task(item: TaskCreate, request: Request):
    require_admin(request)
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
def update_task(task_id: int, item: TaskUpdate, request: Request):
    require_admin(request)
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
def delete_task(task_id: int, request: Request):
    require_admin(request)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"success": True}

def _is_readonly(request: Request, view: str = None, readonly: str = None) -> bool:
    if request.url.path.startswith("/view"):
        return True
    if view in ["readonly", "1", "true"] or readonly in ["1", "true", "readonly"]:
        return True
    if not is_admin_request(request):
        return True
    return False

@app.post("/api/upload")
async def upload_task_file(request: Request, file: UploadFile = File(...)):
    require_admin(request)
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
def serve_overview(request: Request, view: str = Query(None), readonly: str = Query(None), admin_token: str = Query(None)):
    # Pengunjung publik tanpa token admin otomatis diarahkan ke /view
    if not is_admin_request(request):
        return RedirectResponse(url="/view", status_code=303)

    theme_cookie = request.cookies.get("karl_ui_design", "default")
    template_name = "overview.html"
    if theme_cookie == "bento":
        template_name = "overview_bento.html"
    elif theme_cookie == "student":
        template_name = "overview_student.html"
    elif theme_cookie == "karl":
        template_name = "overview_karl.html"

    response = templates.TemplateResponse(request, template_name, {
        "active_page": "overview",
        "current_theme": theme_cookie,
        "page_title": "Karl Tasks - Overview",
        "is_readonly": False,
        "is_admin": True
    })

    # Jika user masuk membawa admin_token dari query URL, set cookie permanen sekarang juga
    if admin_token and admin_token == ADMIN_TOKEN:
        response.set_cookie(
            key="karl_admin_token",
            value=ADMIN_TOKEN,
            max_age=604800,
            path="/",
            samesite="lax",
            httponly=False
        )

    return response

@app.get("/calendar", response_class=HTMLResponse)
def serve_calendar(request: Request, view: str = Query(None), readonly: str = Query(None)):
    theme_cookie = request.cookies.get("karl_ui_design", "default")
    admin_ok = is_admin_request(request)
    return templates.TemplateResponse(request, "calendar.html", {
        "active_page": "calendar",
        "current_theme": theme_cookie,
        "page_title": "Karl - Kalender Tugas",
        "is_readonly": not admin_ok,
        "is_admin": admin_ok
    })

@app.get("/tasks", response_class=HTMLResponse)
def serve_tasks(request: Request, view: str = Query(None), readonly: str = Query(None)):
    theme_cookie = request.cookies.get("karl_ui_design", "default")
    admin_ok = is_admin_request(request)
    return templates.TemplateResponse(request, "tasks.html", {
        "active_page": "tasks",
        "current_theme": theme_cookie,
        "page_title": "Karl - Projects & Tasks",
        "is_readonly": not admin_ok,
        "is_admin": admin_ok
    })

@app.get("/settings", response_class=HTMLResponse)
def serve_settings(request: Request, view: str = Query(None), readonly: str = Query(None)):
    theme_cookie = request.cookies.get("karl_ui_design", "default")
    admin_ok = is_admin_request(request)
    return templates.TemplateResponse(request, "settings.html", {
        "active_page": "settings",
        "current_theme": theme_cookie,
        "page_title": "Karl - Pengaturan & Desain",
        "is_readonly": not admin_ok,
        "is_admin": admin_ok
    })

@app.get("/theme/karl", response_class=HTMLResponse)
def serve_theme_karl(request: Request):
    if not is_admin_request(request):
        return RedirectResponse(url="/view", status_code=303)
    return templates.TemplateResponse(request, "overview_karl.html", {
        "active_page": "overview",
        "current_theme": "default",
        "page_title": "Karl Tasks - Command Center",
        "is_readonly": False,
        "is_admin": True
    })

@app.get("/theme/bento", response_class=HTMLResponse)
def serve_theme_bento(request: Request):
    if not is_admin_request(request):
        return RedirectResponse(url="/view", status_code=303)
    return templates.TemplateResponse(request, "overview_bento.html", {
        "active_page": "overview",
        "current_theme": "bento",
        "page_title": "Karl Tasks - Medical Bento Squircle",
        "is_readonly": False,
        "is_admin": True
    })

@app.get("/theme/student", response_class=HTMLResponse)
def serve_theme_student(request: Request):
    if not is_admin_request(request):
        return RedirectResponse(url="/view", status_code=303)
    return templates.TemplateResponse(request, "overview_student.html", {
        "active_page": "overview",
        "current_theme": "student",
        "page_title": "Karl Tasks - Student Course Hub",
        "is_readonly": False,
        "is_admin": True
    })

@app.get("/profile", response_class=HTMLResponse)
def serve_profile(request: Request):
    if not is_admin_request(request):
        return RedirectResponse(url="/view", status_code=303)
    theme_cookie = request.cookies.get("karl_ui_design", "default")
    return templates.TemplateResponse(request, "settings.html", {
        "active_page": "settings",
        "current_theme": theme_cookie,
        "page_title": "Karl - Pengaturan & Desain",
        "is_readonly": False,
        "is_admin": True
    })


@app.get("/view", response_class=HTMLResponse)
def view_overview(request: Request):
    return templates.TemplateResponse(request, "view/index.html", {
        "active_page": "overview",
        "current_theme": "karl",
        "page_title": "Karl Tasks — Command Center (Pratinjau)",
        "is_readonly": True,
        "is_admin": is_admin_request(request)
    })

@app.get("/view/tasks", response_class=HTMLResponse)
def view_tasks(request: Request):
    theme_cookie = request.cookies.get("karl_ui_design", "default")
    admin_ok = is_admin_request(request)
    return templates.TemplateResponse(request, "tasks.html", {
        "active_page": "tasks",
        "current_theme": theme_cookie,
        "page_title": "Karl - Tasks (Pratinjau)",
        "is_readonly": not admin_ok,
        "is_admin": admin_ok
    })

@app.get("/view/calendar", response_class=HTMLResponse)
def view_calendar(request: Request):
    theme_cookie = request.cookies.get("karl_ui_design", "default")
    admin_ok = is_admin_request(request)
    return templates.TemplateResponse(request, "calendar.html", {
        "active_page": "calendar",
        "current_theme": theme_cookie,
        "page_title": "Karl - Calendar (Pratinjau)",
        "is_readonly": not admin_ok,
        "is_admin": admin_ok
    })

@app.get("/view/settings", response_class=HTMLResponse)
def view_settings(request: Request):
    theme_cookie = request.cookies.get("karl_ui_design", "default")
    admin_ok = is_admin_request(request)
    return templates.TemplateResponse(request, "view/settings.html", {
        "active_page": "settings",
        "current_theme": theme_cookie,
        "page_title": "Karl - Pengaturan (Mode View)",
        "is_readonly": not admin_ok,
        "is_admin": admin_ok
    })
