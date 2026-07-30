/* ============================================================
   ZI Learning — config.js
   Simpan di: js/config.js
   ============================================================ */

/* ============================================================
   SKEMA DATABASE — CATATAN PENTING

   Tabel `challenge`:
   - `tanggal`        : tanggal buka (date) — dipakai bersama jam_buka untuk window mulai
   - `tanggal_tutup`  : tanggal tutup (date) — dipakai bersama jam_tutup untuk window selesai
   - Sebelum kolom tanggal_tutup ada, diasumsikan 1 hari (tanggal = buka sekaligus tutup)
   - Data lama: tanggal_tutup sudah diisi = tanggal via SQL migration
   - jam_buka berlaku di tanggal (hari buka), jam_tutup berlaku di tanggal_tutup (hari tutup)

   Jangan hapus catatan ini — diperlukan untuk memahami logika window challenge.
   ============================================================ */

const CONFIG = {

  /* ── Supabase ─────────────────────────────────────────── */
  SUPABASE_URL  : 'https://touwgoojuqqtjohglwzg.supabase.co',
  SUPABASE_KEY  : 'sb_publishable_V4zfFOaNyWrGgPNxgPq8qA_eXVGMMb5',

  /* ── Google Sheets CSV URL ────────────────────────────── */
  SHEETS_INSIGHT  : 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1Wl8j5VCPFV6ewaewXeN5Il3-ztMZS9X3UXMxwfGYWd8GwkH_BSY9Cwpd98wivz4jWvJ-RwTaQDaJ/pub?gid=1014653976&single=true&output=csv',
  SHEETS_LIBRARY  : 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1Wl8j5VCPFV6ewaewXeN5Il3-ztMZS9X3UXMxwfGYWd8GwkH_BSY9Cwpd98wivz4jWvJ-RwTaQDaJ/pub?gid=1911028908&single=true&output=csv',
  SHEETS_SOAL     : 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0czDtHVNknK2kS6AnCUhIkALVkvT0dOecxWDkITKkg0ci9Msz0q-6Zp9UM5-eQHfzXu4wA4X8_qJd/pub?gid=438869818&single=true&output=csv',

  /* ── Nama Platform ────────────────────────────────────── */
  APP_NAME      : 'ZI Learning',
  APP_SUB       : 'BPS Provinsi Kepulauan Bangka Belitung',

  /* ── Pengaturan Kuis ──────────────────────────────────── */
  QUIZ_JUMLAH_SOAL : 10,

  /* ── Role ─────────────────────────────────────────────── */
  ROLE_PEGAWAI  : 'pegawai',
  ROLE_ADMIN    : 'admin',

  /* ── Mode development — set false saat production ────── */
  DEV_MODE      : true,

};

/* ── Mapping kode pilar → nama lengkap ───────────────────── */
const PILAR_NAMA = {
  P1: 'Manajemen Perubahan',
  P2: 'Penataan Tatalaksana',
  P3: 'Penataan SDM',
  P4: 'Penguatan Akuntabilitas',
  P5: 'Penguatan Pengawasan',
  P6: 'Pelayanan Publik',
};

function namaPilar(kode) {
  return PILAR_NAMA[kode] || kode;
}

/* ── Helper: konversi URL share Drive ke thumbnail ───────── */
function driveUrl(shareUrl) {
  if (!shareUrl) return '';
  const match = shareUrl.match(/\/d\/([^/]+)\//);
  return match
    ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`
    : shareUrl;
}

/* ── Helper: konversi URL Google Docs ke export HTML ─────── */
function docsToHtmlUrl(docsUrl) {
  if (!docsUrl) return '';
  const match = docsUrl.match(/\/d\/([^/]+)\//);
  return match
    ? `https://docs.google.com/document/d/${match[1]}/export?format=html`
    : '';
}


/* ── Helper: format tanggal Indonesia ───────────────────── */
// Mendukung format DD/MM/YYYY dan YYYY-MM-DD
function formatTanggal(dateStr) {
  if (!dateStr) return '';
  let d;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    // DD/MM/YYYY
    d = new Date(`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`);
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day   : 'numeric',
    month : 'long',
    year  : 'numeric'
  });
}

/* ── Helper: parse tanggal DD/MM/YYYY atau YYYY-MM-DD ke timestamp ── */
function parseTanggal(dateStr) {
  if (!dateStr) return 0;
  if (dateStr.includes('/')) {
    const [dd, mm, yyyy] = dateStr.split('/');
    return new Date(yyyy, mm - 1, dd).getTime();
  }
  return new Date(dateStr).getTime();
}

/* ── Helper: inisial nama untuk avatar ──────────────────── */
function getInisial(nama) {
  if (!nama) return '?';
  const parts = nama.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Helper: parse CSV dari Google Sheets ────────────────── */
// Menggunakan parsing karakter-per-karakter (RFC 4180 compliant) agar
// field dengan newline di dalam quotes (misal kolom pembahasan) tidak
// memotong baris lebih awal dan menyebabkan soal hilang.
function parseCSV(text) {
  const rows = parseCSVAll(text.trim());
  if (rows.length < 2) return [];
  const header = rows[0].map(h => h.trim());
  return rows.slice(1).map(row => {
    const obj = {};
    header.forEach((h, i) => obj[h] = (row[i] || '').trim());
    return obj;
  }).filter(r => Object.values(r).some(v => v));
}

// Parsing seluruh teks CSV sekaligus — tidak pre-split per baris,
// sehingga newline di dalam quoted field diperlakukan sebagai konten biasa.
function parseCSVAll(text) {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch   = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        // escaped quote ("") → satu karakter "
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((ch === '\n' || (ch === '\r' && next === '\n')) && !inQuotes) {
      // akhir baris — hanya jika tidak di dalam quoted field
      if (ch === '\r') i++; // lewati \n dari pasangan \r\n
      row.push(current);
      current = '';
      rows.push(row);
      row = [];
    } else {
      current += ch;
    }
  }

  // baris terakhir tanpa trailing newline
  row.push(current);
  if (row.some(v => v !== '')) rows.push(row);

  return rows;
}