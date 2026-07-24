/* ============================================================
   ZI Learning — login.js
   Logika halaman login.
   Simpan di: js/login.js
   ============================================================ */

/* ── Init: redirect jika sudah login ────────────────────── */
(async () => {
  await redirectIfLoggedIn();
  await muatDaftarPegawai();
  cekSessionError();
})();

/* ── Muat dropdown nama pegawai ──────────────────────────── */
async function muatDaftarPegawai() {
  const select = document.getElementById('select-nama');
  const daftar = await getDaftarPegawai();

  if (daftar.length === 0) {
    select.innerHTML = '<option value="">— Gagal memuat daftar —</option>';
    return;
  }

  select.innerHTML = '<option value="">— Pilih nama Anda —</option>';
  daftar.forEach(p => {
    const opt = document.createElement('option');
    opt.value       = p.nip_suffix;
    opt.textContent = p.nama;
    select.appendChild(opt);
  });

  // Isi otomatis jika ada Remember Me
  const savedNip = localStorage.getItem('zi_remembered_nip');
  if (savedNip) {
    select.value = savedNip;
    document.getElementById('remember-me').checked = true;
  }
}

/* ── Handle login NIP (Opsi 1) ───────────────────────────── */
async function handleLogin() {
  const nipSuffix = document.getElementById('select-nama').value;
  const nipInput  = document.getElementById('input-nip').value.trim();
  const remember  = document.getElementById('remember-me').checked;
  const btn       = document.getElementById('btn-login');

  sembunyiError();

  // Validasi
  if (!nipSuffix) {
    tampilError('Pilih nama Anda terlebih dahulu.');
    return;
  }
  if (!/^\d{5}$/.test(nipInput)) {
    tampilError('Masukkan 5 digit angka terakhir NIP lama.');
    return;
  }
  if (nipInput !== nipSuffix) {
    tampilError('5 digit NIP tidak sesuai dengan nama yang dipilih.');
    return;
  }

  btn.disabled     = true;
  btn.textContent  = 'Memproses...';

  const { error } = await loginNip(nipSuffix);

  if (error) {
    tampilError('Login gagal. Pastikan nama dan NIP sudah benar.');
    btn.disabled    = false;
    btn.textContent = 'Masuk';
    return;
  }

  // Remember Me
  if (remember) {
    localStorage.setItem('zi_remembered_nip', nipSuffix);
  } else {
    localStorage.removeItem('zi_remembered_nip');
  }

  window.location.replace('index.html');
}

/* ── Handle login Google (Opsi 2) ───────────────────────── */
async function handleLoginGoogle() {
  sembunyiError();
  const { error } = await loginGoogle();
  if (error) {
    tampilError('Gagal masuk dengan Google. Silakan coba lagi.');
  }
}

/* ── Handle link Google ke NIP (modal) ───────────────────── */
async function handleLinkGoogle() {
  const nipInput = document.getElementById('input-nip-link').value.trim();
  const btn      = document.getElementById('btn-link');
  const alertEl  = document.getElementById('alert-link');

  alertEl.style.display = 'none';

  if (!/^\d{5}$/.test(nipInput)) {
    alertEl.textContent   = 'Masukkan 5 digit angka terakhir NIP lama.';
    alertEl.style.display = 'block';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Menghubungkan...';

  const { error } = await linkGoogle(nipInput);

  if (error) {
    alertEl.textContent   = error;
    alertEl.style.display = 'block';
    btn.disabled    = false;
    btn.textContent = 'Hubungkan & Masuk';
    return;
  }

  window.location.replace('index.html');
}

/* ── Cek apakah redirect dari Google OAuth ───────────────── */
// Dipanggil oleh google-callback.html via sessionStorage
function cekSessionError() {
  const err = sessionStorage.getItem('zi_login_error');
  if (err) {
    sessionStorage.removeItem('zi_login_error');
    if (err === 'google_not_linked') {
      tampilModalLink();
    } else {
      tampilError('Terjadi kesalahan saat login. Silakan coba lagi.');
    }
  }

  // Kalau balik dari Google dan perlu link NIP
  const needLink = sessionStorage.getItem('zi_need_link');
  if (needLink) {
    sessionStorage.removeItem('zi_need_link');
    tampilModalLink();
  }
}

/* ── Tampil modal link Google ────────────────────────────── */
function tampilModalLink() {
  document.getElementById('modal-link').style.display = 'flex';
}

/* ── Helper error ────────────────────────────────────────── */
function tampilError(pesan) {
  const el          = document.getElementById('alert-error');
  el.textContent    = pesan;
  el.style.display  = 'flex';
}

function sembunyiError() {
  document.getElementById('alert-error').style.display = 'none';
}

/* ── Keyboard shortcut ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('input-nip').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });

  document.getElementById('input-nip-link')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLinkGoogle();
  });
});