let allTasks = [];
let currentCatFilter = 'all';
let featuredTaskId = null;

function filterByCat(cat) {
  currentCatFilter = cat;
  const bentoFilterLbl = document.getElementById('bento-active-filter-label');
  if (bentoFilterLbl) {
    bentoFilterLbl.innerText = `Filter: ${cat === 'all' ? 'Semua' : cat}`;
  }
  renderBentoView();
}

function openFeaturedDetail() {
  if (featuredTaskId) {
    openTaskDetail(featuredTaskId);
  }
}

async function reloadPageData() {
  try {
    const res = await fetch('/api/todos');
    allTasks = await res.json();
    renderBentoView();
  } catch (e) {
    console.error('Error loading data:', e);
  }
}

function renderBentoView() {
  const tasks = allTasks;
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  let activeList = tasks.filter(t => !t.completed);
  if (currentCatFilter !== 'all') {
    activeList = activeList.filter(t => t.category === currentCatFilter);
  }

  // Count per category
  const countKuliah = tasks.filter(t => t.category === 'Kuliah' && !t.completed).length;
  const countCoding = tasks.filter(t => t.category === 'Coding' && !t.completed).length;
  const countHomelab = tasks.filter(t => t.category === 'Homelab' && !t.completed).length;
  const countUmum = tasks.filter(t => t.category === 'Umum' && !t.completed).length;

  const elKuliah = document.getElementById('bento-count-kuliah');
  const elCoding = document.getElementById('bento-count-coding');
  const elHomelab = document.getElementById('bento-count-homelab');
  const elUmum = document.getElementById('bento-count-umum');
  const elStatComp = document.getElementById('bento-stat-completed');
  const elStatAct = document.getElementById('bento-stat-active');

  if (elKuliah) elKuliah.innerText = `${countKuliah} Tugas`;
  if (elCoding) elCoding.innerText = `${countCoding} Tugas`;
  if (elHomelab) elHomelab.innerText = `${countHomelab} Tugas`;
  if (elUmum) elUmum.innerText = `${countUmum} Tugas`;
  if (elStatComp) elStatComp.innerText = completed;
  if (elStatAct) elStatAct.innerText = pending;

  // Featured Focus Card
  const ftTitle = document.getElementById('bento-featured-title');
  const ftMeta = document.getElementById('bento-featured-meta');
  const ftTag = document.getElementById('bento-featured-tag');
  const ftBtn = document.getElementById('bento-featured-btn');

  if (ftTitle && ftMeta && ftTag && ftBtn) {
    if (activeList.length > 0) {
      const topTask = activeList[0];
      featuredTaskId = topTask.id;
      ftTitle.innerText = topTask.title;
      ftMeta.innerText = `Batas: ${formatHumanDate(topTask.deadline)} • ${topTask.category}`;
      ftTag.innerText = `Prioritas ${topTask.priority}`;
      ftBtn.style.display = 'inline-block';
    } else {
      featuredTaskId = null;
      ftTitle.innerText = 'Semua Target Hari Ini Tuntas!';
      ftMeta.innerText = 'Tidak ada tugas yang menunggu.';
      ftTag.innerText = 'Bebas Tugas';
      ftBtn.style.display = 'none';
    }
  }

  // Appointments List
  const bentoContainer = document.getElementById('bento-tasks-list');
  if (bentoContainer) {
    if (activeList.length === 0) {
      bentoContainer.innerHTML = '<div class="empty-task-placeholder">Tidak ada tugas pada filter ini.</div>';
    } else {
      const isUts = (t) => t && t.title && (t.title.toUpperCase().includes('UTS') || t.title.toUpperCase().startsWith('UJIAN'));
      const regularTasks = activeList.filter(t => !isUts(t));
      const utsTasks = activeList.filter(t => isUts(t));

      const renderBentoCard = (t) => `
        <div class="bento-appointment-card ${t.completed ? 'completed' : ''}" id="card-${t.id}" onclick="openTaskDetail(${t.id}, event)" style="position: relative;">
          <div class="bac-main">
            <div class="bac-top-row">
              <span class="bac-cat-pill cat-${(t.category||'umum').toLowerCase()}">${escapeHtml(t.category || 'Umum')}</span>
              <span class="bac-prio-indicator">Prioritas: ${escapeHtml(t.priority)}</span>
            </div>
            <div class="bac-title">${escapeHtml(t.title)}</div>
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

      let htmlOut = '';
      if (regularTasks.length > 0) {
        htmlOut += regularTasks.map(renderBentoCard).join('');
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
        htmlOut += utsTasks.map(renderBentoCard).join('');
      }

      bentoContainer.innerHTML = htmlOut;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setDesignTheme('bento');
  reloadPageData();
});
