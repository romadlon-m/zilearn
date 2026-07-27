/* ============================================================
   ZI Learning — auth.js
   Simpan di: js/auth.js
   ============================================================ */

const db = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

async function getSession() {
  const { data: { session } } = await db.auth.getSession();
  return session;
}

/* ── Ambil profil pegawai ────────────────────────────────────
   Coba by id dulu (login NIP).
   Kalau tidak ketemu, coba by google_email (login Google).
   ─────────────────────────────────────────────────────────── */
async function getProfil() {
  const session = await getSession();
  if (!session) return null;

  const { data: byIdArr } = await db
    .from('pegawai')
    .select('*')
    .eq('id', session.user.id)
    .limit(1);

  const byId = byIdArr?.[0] ?? null;
  if (byId) return byId;

  const googleEmail = session.user.email;
  if (!googleEmail) return null;

  const { data: byEmail, error } = await db
    .from('pegawai')
    .select('*')
    .eq('google_email', googleEmail)
    .single();

  if (error) { console.error('getProfil error:', error.message); return null; }
  return byEmail;
}

async function loginNip(nipSuffix) {
  const email    = `${nipSuffix}@zi-learn.internal`;
  const password = nipSuffix;
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  return { data, error };
}

async function loginGoogle() {
  const redirectTo = window.location.href
    .split('/').slice(0, -1).join('/') + '/google-callback.html';

  const params   = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') || 'insight.html';
  sessionStorage.setItem('zi_after_login', redirect);

  const { data, error } = await db.auth.signInWithOAuth({
    provider : 'google',
    options  : { redirectTo, flowType: 'pkce' }
  });
  return { data, error };
}

async function logout() {
  sessionStorage.removeItem('zi_google_email');
  sessionStorage.removeItem('zi_need_link');
  sessionStorage.removeItem('zi_after_login');
  await db.auth.signOut();
  window.location.replace('insight.html');
}

async function requireLogin() {
  const session = await getSession();
  if (!session) {
    const params = new URLSearchParams(window.location.search);
    const from   = params.get('redirect') || window.location.pathname.split('/').pop();
    window.location.replace(`login.html?redirect=${from}`);
  }
  return session;
}

async function requireAdmin() {
  const profil = await getProfil();
  if (!profil || profil.role !== CONFIG.ROLE_ADMIN) window.location.replace('insight.html');
  return profil;
}

async function redirectIfLoggedIn() {
  const session = await getSession();
  if (!session) return;
  const params   = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') || 'insight.html';
  window.location.replace(redirect);
}

async function getDaftarPegawai() {
  const { data, error } = await db
    .from('pegawai')
    .select('id, nama, nip_suffix')
    .order('nama', { ascending: true });
  if (error) { console.error('getDaftarPegawai error:', error.message); return []; }
  return data;
}

async function linkGoogle(nipSuffix) {
  const googleEmail = sessionStorage.getItem('zi_google_email');
  if (!googleEmail) {
    return { error: 'Sesi Google tidak ditemukan. Silakan login Google ulang.' };
  }

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

  const { error: updateError } = await db
    .from('pegawai')
    .update({ google_email: googleEmail })
    .eq('id', pegawai.id);

  if (updateError) return { error: 'Gagal menyimpan. Coba lagi.' };

  const { error: loginError } = await loginNip(nipSuffix);
  if (loginError) {
    return { error: 'Link berhasil tapi gagal masuk. Coba login manual dengan NIP.' };
  }

  sessionStorage.removeItem('zi_google_email');
  sessionStorage.removeItem('zi_need_link');
  return { success: true };
}

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

/* ── Nama Samaran ─────────────────────────────────────────── */

// Cek apakah nama_samaran sudah diisi
async function cekNamaSamaran() {
  const profil = await getProfil();
  if (!profil) return false;
  return !!(profil.nama_samaran && profil.nama_samaran.trim());
}

// Simpan nama_samaran ke tabel pegawai
async function simpanNamaSamaran(namaSamaran) {
  const profil = await getProfil();
  if (!profil) return { error: 'Profil tidak ditemukan.' };

  // Cek apakah nama samaran sudah dipakai pegawai lain
  const { data: existing } = await db
    .from('pegawai')
    .select('id')
    .eq('nama_samaran', namaSamaran.trim())
    .neq('id', profil.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: 'Nama samaran ini sudah dipakai. Pilih nama lain.' };
  }

  const { error } = await db
    .from('pegawai')
    .update({ nama_samaran: namaSamaran.trim() })
    .eq('id', profil.id);

  if (error) return { error: 'Gagal menyimpan nama samaran. Coba lagi.' };
  return { success: true };
}

/* ── Redirect setelah login — cek nama_samaran dulu ─────────
   Dipakai di login.js dan google-callback.html
   Kalau nama_samaran belum diisi → ke nama-samaran.html
   Kalau sudah → ke halaman tujuan
   ─────────────────────────────────────────────────────────── */
async function redirectSetelahLogin(tujuan) {
  const sudahAda = await cekNamaSamaran();
  if (!sudahAda) {
    // Simpan tujuan akhir supaya setelah isi nama samaran bisa redirect ke sana
    sessionStorage.setItem('zi_after_nama_samaran', tujuan);
    window.location.replace('nama-samaran.html');
  } else {
    window.location.replace(tujuan);
  }
}