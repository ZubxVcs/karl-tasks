let allTasks = [];
let currentCatFilter = 'all';

function filterByCat(cat) {
  currentCatFilter = cat;
  document.querySelectorAll('.qcat-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  renderKarlView();
}

async function reloadPageData() {
  try {
    const res = await fetch('/api/todos');
    allTasks = await res.json();
    renderKarlView();
  } catch (e) {
    console.error('Error loading data:', e);
  }
}

function renderKarlView() {
  const tasks = allTasks;
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const high = tasks.filter(t => t.priority === 'Tinggi' && !t.completed).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  let activeList = tasks.filter(t => !t.completed);
  if (currentCatFilter !== 'all') {
    activeList = activeList.filter(t => t.category === currentCatFilter);
  }

  const elTotal = document.getElementById('metric-total');
  const elCompleted = document.getElementById('metric-completed');
  const elPending = document.getElementById('metric-pending');
  const elHigh = document.getElementById('metric-high');
  const elProgressPct = document.getElementById('progress-pct');
  const elProgressFill = document.getElementById('progress-fill');
  const elProgressSub = document.getElementById('progress-sub');

  if (elTotal) elTotal.innerText = total;
  if (elCompleted) elCompleted.innerText = completed;
  if (elPending) elPending.innerText = pending;
  if (elHigh) elHigh.innerText = high;
  if (elProgressPct) elProgressPct.innerText = `${completionRate}%`;
  if (elProgressFill) elProgressFill.style.width = `${completionRate}%`;
  if (elProgressSub) elProgressSub.innerText = `${completed} dari ${total} tugas selesai`;

  const heroStatusText = document.getElementById('hero-status-text');
  if (heroStatusText) {
    heroStatusText.innerText = `${pending} Tugas Berjalan • ${high} Prioritas Tinggi`;
  }

  const focusBanner = document.getElementById('focus-banner');
  const focusTitle = document.getElementById('focus-title');
  const focusDeadline = document.getElementById('focus-deadline');
  if (focusBanner && focusTitle && focusDeadline) {
    if (activeList.length > 0) {
      const topTask = activeList[0];
      focusTitle.innerText = topTask.title;
      focusDeadline.innerText = `Batas: ${formatHumanDate(topTask.deadline)} • ${topTask.category}`;
      focusBanner.onclick = (e) => { e.preventDefault(); openTaskDetail(topTask.id); };
    } else {
      focusTitle.innerText = 'Semua tugas telah tuntas!';
      focusDeadline.innerText = 'Kerja bagus, tidak ada deadline aktif.';
      focusBanner.onclick = null;
    }
  }

  const container = document.getElementById('overview-tasks-list');
  if (container) {
    if (activeList.length === 0) {
      container.innerHTML = '<div class="empty-task-placeholder">Tidak ada tugas aktif di kategori ini.</div>';
    } else {
      const isUts = (t) => t && t.title && (t.title.toUpperCase().includes('UTS') || t.title.toUpperCase().startsWith('UJIAN'));
      const regularTasks = activeList.filter(t => !isUts(t));
      const utsTasks = activeList.filter(t => isUts(t));

      const renderCard = (t) => `
        <div class="project-card ${t.completed ? 'completed' : ''}" id="card-${t.id}" onclick="openTaskDetail(${t.id}, event)">
          <div class="project-card-header">
            <span class="date-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${formatHumanDate(t.deadline)}
            </span>
            <button class="kebab-btn" onclick="toggleKebab(${t.id}, event)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle><circle cx="5" cy="12" r="2"></circle></svg>
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

      let htmlOut = '';
      if (regularTasks.length > 0) {
        htmlOut += regularTasks.map(renderCard).join('');
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
        htmlOut += utsTasks.map(renderCard).join('');
      }

      container.innerHTML = htmlOut;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setDesignTheme('default');
  reloadPageData();
});
