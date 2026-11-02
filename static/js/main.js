// Karl Tasks Studio - Shared JS
const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatHumanDate(dateStr) {
  if (!dateStr) return 'Tanpa deadline';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = parseInt(parts[2], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parts[0];
    return `${d} ${monthNames[m] || ''} ${y}`;
  }
  return dateStr;
}

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.innerText = str;
  return d.innerHTML;
}

// Theme handling
function initTheme() {
  const isDark = localStorage.getItem('karl_ui_theme') === 'dark';
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
  }
}

function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  document.body.setAttribute('data-theme', next);
  localStorage.setItem('karl_ui_theme', next);
}

// Design theme handling
function applySavedDesign() {
  const saved = localStorage.getItem('karl_ui_design') || 'default';
  document.documentElement.setAttribute('data-design', saved);
  document.body.setAttribute('data-design', saved);
  updateDesignChecks(saved);
}

function setDesignTheme(name) {
  localStorage.setItem('karl_ui_design', name);
  document.cookie = `karl_ui_design=${name}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.setAttribute('data-design', name);
  document.body.setAttribute('data-design', name);
  updateDesignChecks(name);
  closeDesignModal();
  if (typeof applyCurrentLayout === 'function') {
    applyCurrentLayout();
  }
  if (typeof renderAllViews === 'function') {
    renderAllViews();
  }
}

function updateDesignChecks(active) {
  const checkDefault = document.getElementById('design-check-default');
  const checkBento = document.getElementById('design-check-bento');
  const checkStudent = document.getElementById('design-check-student');
  if (checkDefault) checkDefault.classList.toggle('active', active === 'default');
  if (checkBento) checkBento.classList.toggle('active', active === 'bento');
  if (checkStudent) checkStudent.classList.toggle('active', active === 'student');
}

function openDesignModal() {
  const modal = document.getElementById('design-modal');
  if (modal) {
    const current = localStorage.getItem('karl_ui_design') || 'default';
    updateDesignChecks(current);
    modal.classList.add('open');
  }
}

function closeDesignModal() {
  const modal = document.getElementById('design-modal');
  if (modal) modal.classList.remove('open');
}

// Custom Confirmation for Theme Switching
let pendingThemeSwitch = null;

function requestThemeSwitch(themeName) {
  const current = localStorage.getItem('karl_ui_design') || 'default';
  if (themeName === current) {
    closeDesignModal();
    return;
  }
  
  pendingThemeSwitch = themeName;
  const names = {
    'default': 'Karl Command Center (Merah Crimson)',
    'bento': 'Medical Bento Squircle (Canvas Pastel)',
    'student': 'Student Course Hub (Violet Periwinkle)'
  };
  
  const titleEl = document.getElementById('confirm-modal-title');
  const descEl = document.getElementById('confirm-modal-desc');
  const modal = document.getElementById('custom-confirm-modal');
  
  if (titleEl) titleEl.innerText = 'Ganti Desain Antarmuka?';
  if (descEl) descEl.innerText = `Kamu akan beralih ke tema "${names[themeName] || themeName}". Halaman akan dimuat ulang dengan tata letak pilihanmu. Lanjutkan?`;
  
  closeDesignModal();
  if (modal) {
    modal.style.display = 'flex';
  }
}

function handleCustomConfirm(confirmed) {
  const modal = document.getElementById('custom-confirm-modal');
  if (modal) modal.style.display = 'none';
  
  if (confirmed && pendingThemeSwitch) {
    const target = pendingThemeSwitch;
    pendingThemeSwitch = null;
    setDesignTheme(target);
    const targetPath = target === 'bento' ? '/theme/bento' : (target === 'student' ? '/theme/student' : '/theme/karl');
    window.location.href = targetPath;
  } else {
    pendingThemeSwitch = null;
  }
}

// Avatar handling
function applySavedAvatar() {
  const saved = localStorage.getItem('karl_custom_avatar');
  const avatarBoxes = document.querySelectorAll('.user-avatar-box');
  
  avatarBoxes.forEach(box => {
    if (saved) {
      if (saved.startsWith('data:image') || saved.startsWith('http')) {
        box.innerHTML = `<img src="${saved}" alt="PP Karl">`;
      } else {
        box.innerHTML = `<span style="font-size: 1.4rem;">${saved}</span>`;
      }
    } else {
      box.innerHTML = '<img src="/static/img/karl_logo_square.png" alt="Karl">';
    }
  });
}

function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    localStorage.setItem('karl_custom_avatar', dataUrl);
    applySavedAvatar();
  };
  reader.readAsDataURL(file);
}

function setAvatarPreset(emoji) {
  localStorage.setItem('karl_custom_avatar', emoji);
  applySavedAvatar();
}

function resetAvatar() {
  localStorage.removeItem('karl_custom_avatar');
  applySavedAvatar();
}

// Modal handling
function openModal() {
  const modal = document.getElementById('task-modal');
  if (modal) {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('input-task-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = today;
    }
    const imgInput = document.getElementById('input-task-img');
    if (imgInput) imgInput.value = '';
    const webInput = document.getElementById('input-task-web');
    if (webInput) webInput.value = '';
    const instInput = document.getElementById('input-task-inst');
    if (instInput) instInput.value = '';
    const matInput = document.getElementById('input-task-mat');
    if (matInput) matInput.value = '';
    modal.classList.add('open');
  }
}

function closeModal() {
  const modal = document.getElementById('task-modal');
  if (modal) modal.classList.remove('open');
}

// Edit Modal Handling
function openEditModal(id, ev) {
  if (ev) ev.stopPropagation();
  // Tutup menu kebab yang terbuka
  document.querySelectorAll('.kebab-menu').forEach(m => m.classList.remove('show'));

  // Cari dari allTasks atau fetch langsung jika belum siap
  let task = (typeof allTasks !== 'undefined' ? allTasks : []).find(t => t.id === id);
  
  const populateAndShow = (t) => {
    document.getElementById('edit-task-id').value = t.id;
    document.getElementById('edit-task-title').value = t.title || '';
    document.getElementById('edit-task-cat').value = t.category || 'Umum';
    document.getElementById('edit-task-prio').value = t.priority || 'Sedang';
    document.getElementById('edit-task-date').value = t.deadline || '';
    const imgInput = document.getElementById('edit-task-img');
    if (imgInput) imgInput.value = t.image_url || '';
    const webInput = document.getElementById('edit-task-web');
    if (webInput) webInput.value = t.web_preview_url || '';
    const instInput = document.getElementById('edit-task-inst');
    if (instInput) instInput.value = t.instructions || '';
    const matInput = document.getElementById('edit-task-mat');
    if (matInput) matInput.value = t.materials || '';

    const modal = document.getElementById('edit-task-modal');
    if (modal) modal.classList.add('open');
  };

  if (task) {
    populateAndShow(task);
  } else {
    fetch('/api/todos')
      .then(res => res.json())
      .then(tasks => {
        if (typeof allTasks !== 'undefined') allTasks = tasks;
        const found = tasks.find(t => t.id === id);
        if (found) populateAndShow(found);
      });
  }
}

function closeEditModal() {
  const modal = document.getElementById('edit-task-modal');
  if (modal) modal.classList.remove('open');
}

// Helper function: convert text with URLs and file paths into clickable HTML links (<a href>)
function linkifyText(text) {
  if (!text) return '';
  // Escape basic HTML
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Match standard URLs (http:// or https://)
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  escaped = escaped.replace(urlRegex, function(url) {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="content-text-link">${url}</a>`;
  });

  // Match local /download/ or /uploads/ paths
  const localPathRegex = /(^|[\s(])(\/(?:download|uploads)\/[^\s<)]+)/g;
  escaped = escaped.replace(localPathRegex, function(match, prefix, path) {
    return `${prefix}<a href="${path}" target="_blank" download class="content-text-link">📥 ${path}</a>`;
  });

  return escaped;
}

// ==================== TASK DETAIL SLIDE SHEET HANDLER ====================
let currentDetailTaskId = null;

function openTaskDetail(id, ev) {
  if (ev && (ev.target.closest('.kebab-btn') || ev.target.closest('.kebab-menu'))) {
    return;
  }
  const task = (typeof allTasks !== 'undefined' ? allTasks : []).find(t => t.id === id);
  if (!task) return;
  currentDetailTaskId = task.id;

  // Title, Category, Deadline
  document.getElementById('detail-title').innerText = task.title;
  document.getElementById('detail-cat').innerText = task.category || 'Umum';
  document.getElementById('detail-date').innerText = `Deadline: ${formatHumanDate(task.deadline)}`;

  // Center Image (Hanya tampil jika tugas memiliki image_url)
  const imgWrap = document.getElementById('detail-center-img-wrap');
  const imgEl = document.getElementById('detail-img');
  if (task.image_url && task.image_url.trim() !== '') {
    imgEl.src = task.image_url;
    imgWrap.style.display = 'flex';
  } else {
    imgWrap.style.display = 'none';
    imgEl.src = '';
  }

  // Instructions Block
  const instBlock = document.getElementById('block-inst');
  const instText = document.getElementById('detail-inst');
  if (task.instructions && task.instructions.trim() !== '') {
    instText.innerHTML = linkifyText(task.instructions);
    instBlock.style.display = 'block';
  } else {
    instBlock.style.display = 'none';
  }

  // Materials & Answers Block
  const matBlock = document.getElementById('block-mat');
  const matText = document.getElementById('detail-mat');
  if (task.materials && task.materials.trim() !== '') {
    matText.innerHTML = linkifyText(task.materials);
    matBlock.style.display = 'block';
  } else {
    matBlock.style.display = 'none';
  }

  // Interactive Webview Block
  const webBlock = document.getElementById('block-web');
  const iframeEl = document.getElementById('detail-iframe');
  if (task.web_preview_url && task.web_preview_url.trim() !== '') {
    iframeEl.src = task.web_preview_url;
    webBlock.style.display = 'block';
  } else {
    iframeEl.src = 'about:blank';
    webBlock.style.display = 'none';
  }

  // File Download Link
  const fileWrap = document.getElementById('file-link-wrap');
  const fileBtn = document.getElementById('btn-download-file');
  const fileNameLabel = document.getElementById('file-name-label');
  if (task.file_url && task.file_url.trim() !== '') {
    fileBtn.href = task.file_url;
    if (fileNameLabel) {
      const parts = task.file_url.split('/');
      let rawName = decodeURIComponent(parts[parts.length - 1]);
      // Bersihkan timestamp angka di depan nama file jika ada
      rawName = rawName.replace(/^\d+_/, '');
      fileNameLabel.innerText = rawName;
    }
    fileWrap.style.display = 'block';
  } else {
    fileWrap.style.display = 'none';
  }

  // WhatsApp Share Link
  const waBtn = document.getElementById('btn-share-wa');
  const waMsg = encodeURIComponent(
    `*TUGAS: ${task.title}*\n` +
    `• Kategori: ${task.category}\n` +
    `• Deadline: ${formatHumanDate(task.deadline)}\n\n` +
    (task.materials ? `*Rincian Jawaban/Materi:*\n${task.materials}\n\n` : '') +
    (task.file_url ? `📎 Link Berkas: ${window.location.origin}${task.file_url}\n` : '') +
    `🌐 Dashboard: ${window.location.origin}/tasks`
  );
  waBtn.href = `https://api.whatsapp.com/send?text=${waMsg}`;

  // Reset Fullscreen State saat dibuka
  const sheetBox = document.getElementById('detail-sheet-box');
  if (sheetBox) sheetBox.classList.remove('fullscreen');
  const expandIcon = document.getElementById('icon-expand');
  const compressIcon = document.getElementById('icon-compress');
  if (expandIcon) expandIcon.style.display = 'block';
  if (compressIcon) compressIcon.style.display = 'none';

  // Update Detail Sheet CRUD buttons
  const statusLabel = document.getElementById('label-detail-status');
  const statusIcon = document.getElementById('icon-detail-status');
  const btnStatus = document.getElementById('btn-detail-status');
  if (statusLabel && statusIcon && btnStatus) {
    if (task.completed) {
      statusLabel.innerText = 'Batal';
      statusIcon.className = 'ph ph-arrow-counter-clockwise';
      btnStatus.classList.add('is-done');
    } else {
      statusLabel.innerText = 'Selesai';
      statusIcon.className = 'ph ph-check-circle';
      btnStatus.classList.remove('is-done');
    }
  }

  // Open Sheet with Push Animation
  const sheetModal = document.getElementById('detail-sheet-modal');
  if (sheetModal) sheetModal.classList.add('open');
}

function editFromDetail() {
  if (!currentDetailTaskId) return;
  const id = currentDetailTaskId;
  closeDetailSheet();
  setTimeout(() => openEditModal(id), 150);
}

async function toggleStatusFromDetail() {
  if (!currentDetailTaskId) return;
  const task = (typeof allTasks !== 'undefined' ? allTasks : []).find(t => t.id === currentDetailTaskId);
  const nextStatus = task ? !task.completed : true;
  await toggleTaskStatus(currentDetailTaskId, nextStatus);
  closeDetailSheet();
}

async function deleteFromDetail() {
  if (!currentDetailTaskId) return;
  const id = currentDetailTaskId;
  closeDetailSheet();
  setTimeout(() => deleteTask(id), 150);
}

function closeDetailSheet() {
  const sheetModal = document.getElementById('detail-sheet-modal');
  if (sheetModal) sheetModal.classList.remove('open');
  const sheetBox = document.getElementById('detail-sheet-box');
  if (sheetBox) sheetBox.classList.remove('fullscreen');
  const wrap = document.getElementById('iframe-wrap');
  if (wrap) wrap.classList.remove('web-fullscreen');
  const btn = document.getElementById('btn-web-fullscreen');
  if (btn) btn.innerText = '⛶ Buka Web Fullscreen';
  const iframeEl = document.getElementById('detail-iframe');
  if (iframeEl) iframeEl.src = 'about:blank';
}

function toggleFullscreenSheet() {
  const sheetBox = document.getElementById('detail-sheet-box');
  const expandIcon = document.getElementById('icon-expand');
  const compressIcon = document.getElementById('icon-compress');
  if (!sheetBox) return;

  const isFull = sheetBox.classList.toggle('fullscreen');
  if (isFull) {
    if (expandIcon) expandIcon.style.display = 'none';
    if (compressIcon) compressIcon.style.display = 'block';
  } else {
    if (expandIcon) expandIcon.style.display = 'block';
    if (compressIcon) compressIcon.style.display = 'none';
  }
}

function toggleWebviewFullscreen() {
  const wrap = document.getElementById('iframe-wrap');
  const btn = document.getElementById('btn-web-fullscreen');
  if (!wrap) return;

  const isWebFull = wrap.classList.toggle('web-fullscreen');
  if (isWebFull) {
    btn.innerText = '✕ Tutup Fullscreen Web';
  } else {
    btn.innerText = '⛶ Buka Web Fullscreen';
  }
}

async function handleTaskImageUpload(e, target) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      if (target === 'input') {
        document.getElementById('input-task-img').value = data.url;
      } else {
        document.getElementById('edit-task-img').value = data.url;
      }
      alert('Foto dokumen/slide berhasil diunggah!');
    }
  } catch (err) {
    alert('Gagal mengunggah foto.');
  }
}

// Drag & Drop File Upload Handler
function initDropzone() {
  const dropzone = document.getElementById('task-dropzone');
  const fileInput = document.getElementById('dropzone-input');
  if (!dropzone || !fileInput) return;

  dropzone.onclick = () => fileInput.click();

  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  };
  dropzone.ondragleave = () => dropzone.classList.remove('dragover');

  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      uploadFileForTask(e.dataTransfer.files[0]);
    }
  };

  fileInput.onchange = () => {
    if (fileInput.files.length) {
      uploadFileForTask(fileInput.files[0]);
    }
  };
}

async function uploadFileForTask(file) {
  if (!currentDetailTaskId) return;
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      await fetch(`/api/todos/${currentDetailTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: data.url })
      });
      alert(`Berkas ${data.filename} berhasil diunggah!`);
      const task = (typeof allTasks !== 'undefined' ? allTasks : []).find(t => t.id === currentDetailTaskId);
      if (task) task.file_url = data.url;
      const fileWrap = document.getElementById('file-link-wrap');
      const fileBtn = document.getElementById('btn-download-file');
      fileBtn.href = data.url;
      fileWrap.style.display = 'block';
    }
  } catch (err) {
    alert('Gagal mengunggah berkas.');
  }
}

async function submitEditTask() {
  const id = document.getElementById('edit-task-id').value;
  const title = document.getElementById('edit-task-title').value.trim();
  if (!title) {
    alert('Judul tugas tidak boleh kosong');
    return;
  }
  const category = document.getElementById('edit-task-cat').value;
  const priority = document.getElementById('edit-task-prio').value;
  const deadline = document.getElementById('edit-task-date').value || '';
  const imgInput = document.getElementById('edit-task-img');
  const image_url = imgInput ? imgInput.value.trim() : '';
  const webInput = document.getElementById('edit-task-web');
  const web_preview_url = webInput ? webInput.value.trim() : '';
  const instInput = document.getElementById('edit-task-inst');
  const instructions = instInput ? instInput.value.trim() : '';
  const matInput = document.getElementById('edit-task-mat');
  const materials = matInput ? matInput.value.trim() : '';

  try {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, priority, deadline, image_url, web_preview_url, instructions, materials })
    });
    if (res.ok) {
      closeEditModal();
      if (typeof reloadPageData === 'function') {
        await reloadPageData();
      } else {
        window.location.reload();
      }
    } else {
      alert('Gagal memperbarui tugas');
    }
  } catch (e) {
    alert('Gagal memperbarui tugas');
  }
}

async function submitNewTask() {
  const titleInput = document.getElementById('input-task-title');
  const title = titleInput.value.trim();
  if (!title) {
    alert('Judul tugas tidak boleh kosong');
    return;
  }

  const category = document.getElementById('input-task-cat').value;
  const priority = document.getElementById('input-task-prio').value;
  const deadline = document.getElementById('input-task-date').value || '';
  const imgInput = document.getElementById('input-task-img');
  const image_url = imgInput ? imgInput.value.trim() : '';
  const webInput = document.getElementById('input-task-web');
  const web_preview_url = webInput ? webInput.value.trim() : '';
  const instInput = document.getElementById('input-task-inst');
  const instructions = instInput ? instInput.value.trim() : '';
  const matInput = document.getElementById('input-task-mat');
  const materials = matInput ? matInput.value.trim() : '';

  try {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, priority, deadline, image_url, web_preview_url, instructions, materials })
    });
    if (res.ok) {
      titleInput.value = '';
      if (imgInput) imgInput.value = '';
      if (webInput) webInput.value = '';
      if (instInput) instInput.value = '';
      if (matInput) matInput.value = '';
      closeModal();
      if (typeof reloadPageData === 'function') {
        await reloadPageData();
      } else {
        window.location.reload();
      }
    }
  } catch (e) {
    alert('Gagal menambahkan tugas');
  }
}

async function toggleTaskStatus(id, completed) {
  try {
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    // Update array lokal agar instan
    if (typeof allTasks !== 'undefined') {
      const t = allTasks.find(item => item.id === id);
      if (t) t.completed = completed;
    }
    if (typeof reloadPageData === 'function') {
      await reloadPageData();
    } else {
      window.location.reload();
    }
  } catch (e) {
    alert('Gagal memperbarui status tugas');
  }
}

async function deleteTask(id) {
  if (!confirm('Hapus tugas ini?')) return;
  try {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (typeof reloadPageData === 'function') {
      await reloadPageData();
    } else {
      window.location.reload();
    }
  } catch (e) {
    alert('Gagal menghapus tugas');
  }
}

function toggleKebab(id, ev) {
  ev.stopPropagation();
  if (document.body.dataset.readonly === 'true') {
    openTaskDetail(id, ev);
    return;
  }
  const currentMenu = document.getElementById(`kebab-${id}`);
  const willShow = currentMenu ? !currentMenu.classList.contains('show') : false;

  // Tutup semua menu lain dan reset z-index parent card
  document.querySelectorAll('.kebab-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.project-card, .bento-appointment-card, .student-task-row').forEach(c => {
    c.style.zIndex = '';
  });

  if (willShow && currentMenu) {
    currentMenu.classList.add('show');
    // Angkat parent card ke z-index tinggi agar popup tidak tertutup kartu di bawahnya
    const parentCard = currentMenu.closest('.project-card, .bento-appointment-card, .student-task-row');
    if (parentCard) {
      parentCard.style.zIndex = '999';
    }

    // Auto-adjust positioning agar tidak terpotong tepi layar bawah
    const rect = currentMenu.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 20) {
      currentMenu.style.top = 'auto';
      currentMenu.style.bottom = '48px';
    } else {
      currentMenu.style.top = '';
      currentMenu.style.bottom = '';
    }
  }
}

window.addEventListener('click', () => {
  document.querySelectorAll('.kebab-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.project-card, .bento-appointment-card, .student-task-row').forEach(c => {
    c.style.zIndex = '';
  });
});

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  applySavedDesign();
  initTheme();
  applySavedAvatar();
  initDropzone();
  initHoppingBallDock();

  if (document.body.dataset.readonly === 'true') {
    initReadonlyMode();
  }
});

/* ==================== FLOATING HOPPING BALL DOCK INTERACTION ==================== */
function initHoppingBallDock() {
  const dock = document.getElementById('floating-dock');
  const ball = document.getElementById('dock-hopping-ball');
  const iconWrap = document.getElementById('dock-ball-icon-wrap');
  if (!dock || !ball || !iconWrap) return;

  function updateBallPosition(targetSlot, isAnimated = true) {
    if (!targetSlot) return;
    const dockRect = dock.getBoundingClientRect();
    const slotRect = targetSlot.getBoundingClientRect();

    // Hitung posisi center X slot terhadap kontainer dock
    const centerX = slotRect.left - dockRect.left + (slotRect.width / 2) - 22; // 22 = radius ball (44/2)
    ball.style.setProperty('--ball-x', `${centerX}px`);
    ball.style.transform = `translate(${centerX}px, 0)`;

    // Salin SVG icon dari slot aktif ke dalam bola mengambang
    const svgIcon = targetSlot.querySelector('svg');
    if (svgIcon) {
      iconWrap.innerHTML = svgIcon.outerHTML;
    }

    if (isAnimated) {
      ball.classList.remove('is-hopping');
      void ball.offsetWidth; // trigger reflow
      ball.classList.add('is-hopping');
    }
  }

  // Cari slot yang saat ini berstatus active
  const activeSlot = dock.querySelector('.dock-slot.active');
  if (activeSlot) {
    // Tunggu sedikit agar layout flexbox dock sudah terukur sempurna
    requestAnimationFrame(() => {
      setTimeout(() => updateBallPosition(activeSlot, false), 50);
    });
  }

  // Pasang listener klik halus untuk feedback visual seketika sebelum navigasi pindah halaman
  dock.querySelectorAll('.dock-slot').forEach(slot => {
    slot.addEventListener('click', function(e) {
      dock.querySelectorAll('.dock-slot').forEach(s => s.classList.remove('active'));
      this.classList.add('active');
      updateBallPosition(this, true);
    });
  });

  window.addEventListener('resize', () => {
    const currentActive = dock.querySelector('.dock-slot.active');
    if (currentActive) {
      updateBallPosition(currentActive, false);
    }
  });
}

function initReadonlyMode() {
  window.openModal = function() {
    showToastNotification('Mode Tamu: Pembuatan tugas hanya bisa dilakukan oleh Karl.');
  };
  window.submitNewTask = function() {
    showToastNotification('Mode Tamu: Tidak dapat menyimpan tugas ke server.');
  };
  window.submitEditTask = function() {
    showToastNotification('Mode Tamu: Tidak dapat menyimpan perubahan ke server.');
  };
  window.deleteTask = function(id) {
    showToastNotification('Mode Tamu: Kamu tidak memiliki izin menghapus tugas Karl.');
  };
  window.toggleTaskStatus = function(id, completed) {
    if (typeof allTasks !== 'undefined') {
      const t = allTasks.find(item => item.id === id);
      if (t) t.completed = completed;
    }
    if (typeof renderAllViews === 'function') renderAllViews();
    if (typeof renderTasksList === 'function') renderTasksList();
    if (typeof renderTimeline === 'function') renderTimeline();
    showToastNotification('Mode Tamu Sandbox: Status tugas hanya berubah di browsermu, database Karl tetap aman.');
  };
  window.uploadFileForTask = function() {
    showToastNotification('Mode Tamu: Upload berkas dinonaktifkan.');
  };
  window.toggleStatusFromDetail = function() {
    showToastNotification('Mode Tamu: Status tugas terkunci.');
  };
  window.deleteFromDetail = function() {
    showToastNotification('Mode Tamu: Tidak dapat menghapus tugas.');
  };
  window.editFromDetail = function() {
    showToastNotification('Mode Tamu: Tidak dapat mengedit tugas.');
  };
  window.openEditModal = function() {
    showToastNotification('Mode Tamu: Tidak dapat mengedit tugas.');
  };

  document.querySelectorAll('.dock-center-slot').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.pc-actions .btn-primary').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.sheet-actions').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.dropzone-box').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.kebab-btn, .bac-stripes-col, .str-kebab-trigger').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.bento-add-mini-btn').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.student-sc-add').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.student-btn-new-board').forEach(el => el.style.display = 'none');
}

function showToastNotification(msg) {
  let toast = document.getElementById('settings-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'settings-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function loginAdminPrompt() {
  const modal = document.getElementById('admin-login-modal');
  const input = document.getElementById('admin-pin-input');
  const err = document.getElementById('admin-pin-error');
  if (modal) {
    if (err) err.style.display = 'none';
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 150);
    }
    modal.style.display = 'flex';
  }
}

function closeAdminLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) modal.style.display = 'none';
}

async function submitAdminPinLogin() {
  const input = document.getElementById('admin-pin-input');
  const err = document.getElementById('admin-pin-error');
  const btn = document.getElementById('admin-login-submit-btn');
  const pin = input ? input.value.trim() : '';

  if (!pin) {
    if (err) {
      err.innerText = 'PIN tidak boleh kosong!';
      err.style.display = 'block';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Memverifikasi...';
  }

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ pin: pin })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      // Simpan cookie langsung lewat JS sebagai fallback kuat
      document.cookie = 'karl_admin_token=' + data.token + '; max-age=604800; path=/; samesite=lax';
      localStorage.setItem('karl_admin_token', data.token);

      closeAdminLoginModal();
      showToast('Login Berhasil! Mengalihkan ke Dashboard Owner...');
      
      // Auto-restart / redirect pasti ke halaman home owner
      setTimeout(() => {
        window.location.href = '/?admin_token=' + data.token;
      }, 200);
    } else {
      if (err) {
        err.innerText = data.detail || 'PIN Salah! Coba lagi.';
        err.style.display = 'block';
      }
      if (input) input.focus();
    }
  } catch (e) {
    if (err) {
      err.innerText = 'Gagal menghubungi server.';
      err.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Masuk';
    }
  }
}

function logoutAdmin() {
  const modal = document.getElementById('admin-logout-modal');
  if (modal) {
    modal.style.display = 'flex';
  } else {
    executeAdminLogout();
  }
}

function closeAdminLogoutModal() {
  const modal = document.getElementById('admin-logout-modal');
  if (modal) modal.style.display = 'none';
}

async function executeAdminLogout() {
  const btn = document.getElementById('admin-logout-submit-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Mengunci...';
  }
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
    document.cookie = 'karl_admin_token=; Max-Age=0; path=/;';
    localStorage.removeItem('karl_admin_token');
    closeAdminLogoutModal();
    showToast('Sesi admin terkunci. Kembali ke mode tamu.');
    setTimeout(() => {
      window.location.replace('/view');
    }, 300);
  } catch (e) {
    window.location.replace('/view');
  }
}

function salinTeks(teks) {
  var str = String(teks);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(str).then(function() {
      showToast('Berhasil disalin: ' + str);
    }).catch(function() {
      fallbackSalin(str);
    });
  } else {
    fallbackSalin(str);
  }
}

function fallbackSalin(str) {
  var el = document.createElement('textarea');
  el.value = str;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  showToast('Berhasil disalin: ' + str);
}

function salinLinkSekarang() {
  salinTeks('2611070020');
}

function copyPreviewLink() {
  var url = window.location.origin + '/view';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() {
      showToast('Link pratinjau berhasil disalin!');
    });
  } else {
    var input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('Link pratinjau berhasil disalin!');
  }
}
