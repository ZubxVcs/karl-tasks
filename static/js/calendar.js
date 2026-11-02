let allTasks = [];
let currentYear = 2026;
let currentMonth = 9; // Oktober (0-indexed)
let selectedDateStr = '2026-10-22';

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

async function reloadPageData() {
  try {
    const res = await fetch('/api/todos');
    allTasks = await res.json();
    renderCalendar();
    renderTimeline();
  } catch (e) {
    console.error('Error loading calendar:', e);
  }
}

function renderCalendar() {
  const monthYearEl = document.getElementById('cal-month-year');
  if (monthYearEl) {
    monthYearEl.innerText = `${monthNames[currentMonth]} ${currentYear}`;
  }
  const grid = document.getElementById('days-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDayIndex; i++) {
    const empty = document.createElement('div');
    grid.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasEvent = allTasks.some(t => t.deadline === dateStr);
    const isSelected = dateStr === selectedDateStr;

    const cell = document.createElement('div');
    cell.className = `day-cell ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}`;
    cell.innerText = day;
    cell.onclick = () => selectDate(dateStr);
    grid.appendChild(cell);
  }
}

function navMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

function selectDate(dateStr) {
  selectedDateStr = dateStr;
  renderCalendar();
  renderTimeline();
}

function renderTimeline() {
  const container = document.getElementById('timeline-list');
  const titleEl = document.getElementById('timeline-title');
  if (!container || !titleEl) return;
  
  const dayTasks = allTasks.filter(t => t.deadline === selectedDateStr);
  titleEl.innerText = selectedDateStr === '2026-10-22' ? "Jadwal Hari Ini" : `Jadwal (${formatHumanDate(selectedDateStr)})`;

  const iconMap = {
    'Kuliah': '🎓',
    'Homelab': '🖥️',
    'Coding': '⚡',
    'Umum': '📌'
  };

  if (dayTasks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.88rem;">
        Tidak ada agenda / tugas di tanggal ini.
      </div>
    `;
    return;
  }

  container.innerHTML = dayTasks.map(t => `
    <div class="timeline-item">
      <div class="timeline-icon-box">${iconMap[t.category] || '📌'}</div>
      <div class="timeline-info">
        <span class="timeline-meta">${t.category} • Prioritas: ${t.priority}</span>
        <div class="timeline-task-title">${escapeHtml(t.title)}</div>
        <div class="timeline-time">${formatHumanDate(t.deadline)}</div>
      </div>
      <button class="timeline-check-btn ${t.completed ? 'checked' : ''}" onclick="toggleTaskStatus(${t.id}, ${!t.completed})" title="Tandai Selesai">
        ✓
      </button>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', reloadPageData);
