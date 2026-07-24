/* ============================================================
   ZI Learning — auth.js
   Session management dan helper autentikasi.
   Simpan di: js/auth.js

   WAJIB dimuat sebelum file JS lain di setiap halaman:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/config.js"></script>
   <script src="js/auth.js"></script>
   ============================================================ */

/* ── Inisialisasi Supabase client ────────────────────────── */
const db = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

/* ── Ambil session aktif ─────────────────────────────────── */
async function getSession() {
  const { data: { session } } = await db.auth.getSession();
  return session;
}

/* ── Ambil profil pegawai dari tabel pegawai ─────────────── */
async function getProfil() {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await db
    .from('pegawai')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('getProfil error:', error.message);
    return null;
  }
  return data;
}

/* ── Login dengan NIP suffix (Opsi 1) ───────────────────── */
// Pegawai pilih nama dari dropdown → sistem bentuk email dari nip_suffix
async function loginNip(nipSuffix) {
  const email    = `${nipSuffix}@zi-learn.internal`;
  const password = nipSuffix;

  const { data, error } = await db.auth.signInWithPassword({ email, password });
  return { data, error };
}

/* ── Login dengan Google (Opsi 2) ───────────────────────── */
async function loginGoogle() {
  const redirectTo = window.location.href
    .split('/')
    .slice(0, -1)
    .join('/') + '/google-callback.html';

  const { data, error } = await db.auth.signInWithOAuth({
    provider : 'google',
    options  : { redirectTo, flowType: 'pkce' }
  });
  return { data, error };
}

/* ── Logout ──────────────────────────────────────────────── */
async function logout() {
  await db.auth.signOut();
  window.location.replace('login.html');
}

/* ── Guard: halaman yang butuh login ─────────────────────── */
// Taruh di atas halaman yang memerlukan login:
// requireLogin();
async function requireLogin() {
  const session = await getSession();
  if (!session) {
    window.location.replace('login.html');
  }
  return session;
}

/* ── Guard: halaman yang hanya boleh diakses admin ──────── */
async function requireAdmin() {
  const profil = await getProfil();
  if (!profil || profil.role !== CONFIG.ROLE_ADMIN) {
    window.location.replace('index.html');
  }
  return profil;
}

/* ── Redirect jika sudah login (untuk halaman login) ─────── */
// Taruh di halaman login.html supaya user yang sudah login
// tidak perlu login lagi:
// redirectIfLoggedIn();
async function redirectIfLoggedIn() {
  const session = await getSession();
  if (session) {
    window.location.replace('index.html');
  }
}

/* ── Ambil daftar nama pegawai (untuk dropdown login) ────── */
async function getDaftarPegawai() {
  const { data, error } = await db
    .from('pegawai')
    .select('id, nama, nip_suffix')
    .order('nama', { ascending: true });

  if (error) {
    console.error('getDaftarPegawai error:', error.message);
    return [];
  }
  return data;
}

/* ── Link akun Google ke pegawai (saat pertama OAuth) ────── */
async function linkGoogle(nipSuffix) {
  const session = await getSession();
  if (!session) return { error: 'Tidak ada session aktif' };

  const googleEmail = session.user.email;

  // Cari pegawai berdasarkan nip_suffix
  const { data: pegawai, error: cariError } = await db
    .from('pegawai')
    .select('id, google_email')
    .eq('nip_suffix', nipSuffix)
    .single();

  if (cariError || !pegawai) {
    return { error: '5 digit NIP tidak ditemukan. Pastikan input benar.' };
  }

  if (pegawai.google_email) {
    return { error: 'NIP ini sudah terhubung ke akun Google lain.' };
  }

  // Update kolom google_email
  const { error: updateError } = await db
    .from('pegawai')
    .update({ google_email: googleEmail })
    .eq('id', pegawai.id);

  if (updateError) {
    return { error: 'Gagal menyimpan. Coba lagi.' };
  }

  return { success: true, pegawaiId: pegawai.id };
}

/* ── Cek apakah user Google sudah ter-link ke pegawai ────── */
async function cekLinkGoogle() {
  const session = await getSession();
  if (!session) return null;

  const googleEmail = session.user.email;

  const { data, error } = await db
    .from('pegawai')
    .select('*')
    .eq('google_email', googleEmail)
    .single();

  if (error) return null;
  return data;
}