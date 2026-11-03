let allTasks = [];
let currentFilter = 'all';

async function reloadPageData() {
  try {
    const res = await fetch('/api/todos');
    allTasks = await res.json();
    renderTasksList();
  } catch (e) {
    console.error('Error loading tasks:', e);
  }
}

function isUtsTask(task) {
  if (!task || !task.title) return false;
  const t = task.title.toUpperCase();
  return t.includes('UTS') || t.startsWith('UJIAN');
}

function renderTasksList() {
  const container = document.getElementById('tasks-list');
  if (!container) return;
  let filtered = allTasks;
  if (currentFilter === 'completed') {
    filtered = allTasks.filter(t => t.completed);
  } else if (currentFilter !== 'all') {
    filtered = allTasks.filter(t => t.category === currentFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-task-placeholder">Tidak ada tugas pada kategori ini.</div>';
    return;
  }

  const design = localStorage.getItem('karl_ui_design') || 'default';

  const regularTasks = filtered.filter(t => !isUtsTask(t));
  const utsTasks = filtered.filter(t => isUtsTask(t));

  const renderSingleCard = (t) => {
    if (design === 'bento') {
      return `
        <div class="bento-appointment-card ${t.completed ? 'completed' : ''}" id="card-${t.id}" onclick="openTaskDetail(${t.id}, event)" style="position: relative;">
          <div class="bac-main">
            <div class="bac-top-row">
              <span class="bac-cat-pill cat-${(t.category||'umum').toLowerCase()}">${escapeHtml(t.category || 'Umum')}</span>
              <span class="bac-prio-indicator">Prioritas: ${escapeHtml(t.priority)}</span>
              ${t.completed ? '<span class="status-done-badge">✓ Selesai</span>' : ''}
            </div>
            <div class="bac-title ${t.completed ? 'task-title-completed' : ''}">${escapeHtml(t.title)}</div>
            <div class="bac-schedule-row">
              <div>
                <span class="bac-sch-lbl">Batas Waktu</span>
                <span class="bac-sch-val">${formatHumanDate(t.deadline)}</span>
              </div>
            </div>
          </div>
          <button class="bac-stripes-col" title="Menu Opsi Tugas" onclick="toggleKebab(${t.id}, event)">
            <span class="bac-stripe-line"></span>
            <span class="bac-stripe-line"></span>
            <span class="bac-stripe-line"></span>
          </button>
          <div class="kebab-menu" id="kebab-${t.id}">
            <div class="kebab-item" onclick="openTaskDetail(${t.id}, event)">
              <i class="ph ph-eye"></i>
              <span>Detail</span>
            </div>
            <div class="kebab-item" onclick="openEditModal(${t.id}, event)">
              <i class="ph ph-pencil-simple"></i>
              <span>Edit</span>
            </div>
            <div class="kebab-item" onclick="toggleTaskStatus(${t.id}, ${!t.completed})">
              <i class="ph ${t.completed ? 'ph-arrow-counter-clockwise' : 'ph-check'}"></i>
              <span>${t.completed ? 'Batal Selesai' : 'Selesai'}</span>
            </div>
            <div class="kebab-item delete" onclick="deleteTask(${t.id})">
              <i class="ph ph-trash"></i>
              <span>Hapus</span>
            </div>
          </div>
        </div>
      `;
    }

    if (design === 'student') {
      return `
        <div class="student-task-row ${t.completed ? 'completed' : ''}" id="card-${t.id}" onclick="openTaskDetail(${t.id}, event)" style="position: relative;">
          <div class="str-checkbox" onclick="event.stopPropagation(); toggleTaskStatus(${t.id}, ${!t.completed}, event)" title="${t.completed ? 'Batal Selesai' : 'Tandai Selesai'}">
            <div class="str-check-circle ${t.completed ? 'checked' : ''}">
              ${t.completed ? '<i class="ph ph-check str-check-icon"></i>' : ''}
            </div>
          </div>
          <div class="str-info">
            <div class="str-title ${t.completed ? 'task-title-completed' : ''}">${escapeHtml(t.title)}</div>
            <div class="str-meta">
              <span class="str-cat-pill">${escapeHtml(t.category || 'Tugas')}</span>
              <span class="str-due">${formatHumanDate(t.deadline)}</span>
              <span class="str-prio">Prio: ${escapeHtml(t.priority)}</span>
            </div>
          </div>
          <button class="str-action-btn" onclick="toggleKebab(${t.id}, event)" title="Menu Opsi Tugas">Detail</button>
          <div class="kebab-menu" id="kebab-${t.id}">
            <div class="kebab-item" onclick="openTaskDetail(${t.id}, event)">
              <i class="ph ph-eye"></i>
              <span>Detail Lengkap</span>
            </div>
            <div class="kebab-item" onclick="openEditModal(${t.id}, event)">
              <i class="ph ph-pencil-simple"></i>
              <span>Edit Tugas</span>
            </div>
            <div class="kebab-item" onclick="toggleTaskStatus(${t.id}, ${!t.completed})">
              <i class="ph ${t.completed ? 'ph-arrow-counter-clockwise' : 'ph-check'}"></i>
              <span>${t.completed ? 'Batal Selesai' : 'Tandai Selesai'}</span>
            </div>
            <div class="kebab-item delete" onclick="deleteTask(${t.id})">
              <i class="ph ph-trash"></i>
              <span>Hapus Tugas</span>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="project-card ${t.completed ? 'completed' : ''}" id="card-${t.id}" onclick="openTaskDetail(${t.id}, event)">
        <div class="project-card-header">
          <span class="date-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${formatHumanDate(t.deadline)}
          </span>
          <button class="kebab-btn" onclick="toggleKebab(${t.id}, event)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="2" r="2"></circle><circle cx="19" cy="12" r="2"></circle><circle cx="5" cy="12" r="2"></circle></svg>
          </button>
          <div class="kebab-menu" id="kebab-${t.id}">
            <div class="kebab-item" onclick="openTaskDetail(${t.id}, event)">👁 Lihat Detail</div>
            <div class="kebab-item" onclick="openEditModal(${t.id}, event)">✎ Edit Tugas</div>
            <div class="kebab-item" onclick="toggleTaskStatus(${t.id}, ${!t.completed})">${t.completed ? '↩ Batal Selesai' : '✓ Tandai Selesai'}</div>
            <div class="kebab-item delete" onclick="deleteTask(${t.id})">✕ Hapus Tugas</div>
          </div>
        </div>
        <div class="project-title ${t.completed ? 'task-title-completed' : ''}">${escapeHtml(t.title)}</div>
        <div class="project-card-footer">
          <div class="priority-indicator">
            <span class="dot-prio-${t.priority}"></span>
            <span>Prioritas: ${t.priority}</span>
          </div>
          <span class="category-tag">${t.category}</span>
        </div>
      </div>
    `;
  };

  let htmlOut = '';
  if (regularTasks.length > 0) {
    htmlOut += regularTasks.map(renderSingleCard).join('');
  }

  if (utsTasks.length > 0) {
    htmlOut += `
      <div class="uts-section-divider">
        <div class="uts-divider-line"></div>
        <div class="uts-divider-badge">
          <i class="ph ph-exam"></i>
          <span>UJIAN TENGAH SEMESTER (UTS)</span>
        </div>
        <div class="uts-divider-line right"></div>
      </div>
    `;
    htmlOut += utsTasks.map(renderSingleCard).join('');
  }

  container.innerHTML = htmlOut;
}

document.querySelectorAll('.pill-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasksList();
  });
});

document.addEventListener('DOMContentLoaded', reloadPageData);
