# Karl Tasks Studio - Fullstack Multi-Page Architecture

Aplikasi manajemen tugas dan jadwal harian Karl dengan struktur multi-page modular (FastAPI, SQLite, Jinja2, Vanilla CSS/JS).

## Struktur File & Halaman:
```text
karl_tasks/
├── app.py                  # Backend FastAPI REST API & Page Routes
├── tasks.db                # Database SQLite
├── static/
│   ├── css/
│   │   └── style.css       # Clean design system, themes, and floating dock
│   └── js/
│       └── main.js         # Shared API client, theme toggle, and avatar persistence
└── templates/
    ├── base.html           # Layout utama: Desktop Topbar, Mobile Header, Floating Dock, Modal (+)
    ├── overview.html       # Halaman 1: Ringkasan 4 metrik & Target Fokus
    ├── calendar.html       # Halaman 2: Kalender Bulanan & Jadwal Harian
    ├── tasks.html          # Halaman 3: Daftar Tugas & Proyek + Kategori Filter
    └── profile.html        # Halaman 4: Ganti Foto Profil / Avatar Kustom & Info Sistem
```

## Cara Menjalankan:
```bash
pip install fastapi uvicorn jinja2
python3 -m uvicorn app:app --host 0.0.0.0 --port 8089
```
Buka browser di `http://localhost:8089/`
