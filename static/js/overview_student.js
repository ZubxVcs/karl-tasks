let allTasks = [];
let currentCatFilter = 'all';

function filterByCat(cat) {
  currentCatFilter = cat;
  renderStudentView();
}

async function reloadPageData() {
  try {
    const res = await fetch('/api/todos');
    allTasks = await res.json();
    renderStudentView();
  } catch (e) {
    console.error('Error loading data:', e);
  }
}

function renderStudentView() {
  const tasks = allTasks;
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  let activeList = tasks.filter(t => !t.completed);
  if (currentCatFilter !== 'all') {
    activeList = activeList.filter(t => t.category === currentCatFilter);
  }

  // Count per category
  const countKuliah = tasks.filter(t => t.category === 'Kuliah' && !t.completed).length;
  const countCoding = tasks.filter(t => t.category === 'Coding' && !t.completed).length;
  const countHomelab = tasks.filter(t => t.category === 'Homelab' && !t.completed).length;

  const elKuliah = document.getElementById('sc-kuliah-desc');
  const elCoding = document.getElementById('sc-coding-desc');
  const elHomelab = document.getElementById('sc-homelab-desc');
  const elRate = document.getElementById('student-overall-rate');

  if (elKuliah) elKuliah.innerText = `${countKuliah} tugas aktif`;
  if (elCoding) elCoding.innerText = `${countCoding} tugas aktif`;
  if (elHomelab) elHomelab.innerText = `${countHomelab} tugas aktif`;
  if (elRate) elRate.innerText = `${completionRate}% Selesai`;

  // Calculate completion rates per category
  function getCatRate(cat) {
    const catTotal = tasks.filter(t => t.category === cat).length;
    const catDone = tasks.filter(t => t.category === cat && t.completed).length;
    return catTotal > 0 ? Math.round((catDone / catTotal) * 100) : 0;
  }

  const kRate = getCatRate('Kuliah');
  const cRate = getCatRate('Coding');
  const hRate = getCatRate('Homelab');

  const elSkul = document.getElementById('st-score-kuliah');
  const elFkul = document.getElementById('st-fill-kuliah');
  const elScod = document.getElementById('st-score-coding');
  const elFcod = document.getElementById('st-fill-coding');
  const elShome = document.getElementById('st-score-homelab');
  const elFhome = document.getElementById('st-fill-homelab');

  if (elSkul) elSkul.innerText = `${kRate}%`;
  if (elFkul) elFkul.style.width = `${kRate}%`;
  if (elScod) elScod.innerText = `${cRate}%`;
  if (elFcod) elFcod.style.width = `${cRate}%`;
  if (elShome) elShome.innerText = `${hRate}%`;
  if (elFhome) elFhome.style.width = `${hRate}%`;

  // Student Task Rows
  const studentContainer = document.getElementById('student-tasks-list');
  if (studentContainer) {
    if (activeList.length === 0) {
      studentContainer.innerHTML = '<div class="student-empty-placeholder">Tidak ada tugas aktif di filter ini.</div>';
    } else {
      studentContainer.innerHTML = activeList.map(t => `
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
      `).join('');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setDesignTheme('student');
  reloadPageData();
});
