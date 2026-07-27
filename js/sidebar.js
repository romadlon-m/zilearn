/* ============================================================
   ZI Learning — sidebar.js
   Load sidebar.html ke semua halaman dan set state login.
   Simpan di: js/sidebar.js

   Cara pakai di setiap halaman:
   1. Tambah <div id="sidebar-container"></div> di body
   2. Load script: <script src="js/sidebar.js"></script>
   3. Panggil: loadSidebar('nama-halaman')
      Nilai valid: 'insight' | 'challenge' | 'library' | 'riwayat'
   ============================================================ */

async function loadSidebar(activePage) {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  // Fetch sidebar.html
  try {
    const res  = await fetch('components/sidebar.html');
    const html = await res.text();
    container.innerHTML = html;
  } catch (e) {
    console.error('Gagal load sidebar:', e);
    return;
  }

  // Set item aktif
  const items = container.querySelectorAll('.sidebar-item[data-page]');
  items.forEach(item => {
    if (item.dataset.page === activePage) {
      item.classList.add('active');
    }
  });

  // Render footer berdasarkan status login
  await renderSidebarFooter();
}

async function renderSidebarFooter() {
  const footer  = document.getElementById('sidebar-footer');
  if (!footer) return;

  const session = await getSession();

  if (!session) {
    // Belum login — tampilkan tombol masuk
    footer.innerHTML = `
      <a href="login.html" class="btn btn-outline btn-full"
         style="color:#fff;border-color:rgba(255,255,255,0.4);font-size:0.8125rem;">
        Masuk
      </a>
    `;
    return;
  }

  // Sudah login — tampilkan nama dan tombol keluar
  const profil = await getProfil();
  const nama   = profil?.nama ?? 'Pegawai';
  const role   = profil?.role === CONFIG.ROLE_ADMIN ? 'Admin' : 'Pegawai';
  const inisial = getInisial(nama);

  footer.innerHTML = `
    <div class="sidebar-user">
      <div class="sidebar-avatar" style="flex-shrink:0;">${inisial}</div>
      <div style="min-width:0;flex:1;">
        <div class="sidebar-user-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${nama}</div>
        <div class="sidebar-user-role">${role}</div>
      </div>
    </div>
    <button
      onclick="logout()"
      style="margin-top:10px;width:100%;background:rgba(255,255,255,0.08);border:none;
             color:rgba(255,255,255,0.7);padding:7px;border-radius:6px;
             font-size:0.8125rem;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;"
    >
      Keluar
    </button>
  `;
}

/* ── Toggle sidebar mobile ───────────────────────────────── */
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('overlay')?.classList.toggle('open');
}