function updateSettingsView() {
  const current = localStorage.getItem('karl_ui_design') || 'default';

  ['default', 'bento', 'student'].forEach(theme => {
    const card = document.getElementById(`theme-card-${theme}`);
    const pill = document.getElementById(`status-pill-${theme}`);
    const btn = document.getElementById(`btn-select-${theme}`);

    if (card && pill && btn) {
      if (theme === current) {
        card.classList.add('selected');
        pill.style.display = 'inline-block';
        btn.innerText = 'Desain Sedang Digunakan';
        btn.classList.add('active');
      } else {
        card.classList.remove('selected');
        pill.style.display = 'none';
        btn.innerText = 'Gunakan Desain Ini';
        btn.classList.remove('active');
      }
    }
  });
}

function selectDesignEngine(name) {
  setDesignTheme(name);
  updateSettingsView();
  
  const toast = document.getElementById('settings-toast');
  if (toast) {
    toast.innerText = `Desain ${name === 'bento' ? 'Medical Bento' : (name === 'student' ? 'Student Hub' : 'Karl Command Center')} aktif!`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      const targetPath = name === 'bento' ? '/theme/bento' : (name === 'student' ? '/theme/student' : '/theme/karl');
      window.location.href = targetPath;
    }, 600);
  }
}

function clearAppCache() {
  if (confirm('Bersihkan cache dan muat ulang halaman?')) {
    localStorage.removeItem('karl_custom_avatar');
    window.location.reload();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateSettingsView();
});
