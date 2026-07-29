/* ============================================================
   ZI Learning — config.js
   Simpan di: js/config.js
   ============================================================ */

const CONFIG = {

  /* ── Supabase ─────────────────────────────────────────── */
  SUPABASE_URL  : 'https://touwgoojuqqtjohglwzg.supabase.co',
  SUPABASE_KEY  : 'sb_publishable_V4zfFOaNyWrGgPNxgPq8qA_eXVGMMb5',

  /* ── Google Sheets CSV URL ────────────────────────────── */
  SHEETS_INSIGHT  : 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1Wl8j5VCPFV6ewaewXeN5Il3-ztMZS9X3UXMxwfGYWd8GwkH_BSY9Cwpd98wivz4jWvJ-RwTaQDaJ/pub?gid=1014653976&single=true&output=csv',
  SHEETS_LIBRARY  : 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1Wl8j5VCPFV6ewaewXeN5Il3-ztMZS9X3UXMxwfGYWd8GwkH_BSY9Cwpd98wivz4jWvJ-RwTaQDaJ/pub?gid=1911028908&single=true&output=csv',
  SHEETS_SOAL     : 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1Wl8j5VCPFV6ewaewXeN5Il3-ztMZS9X3UXMxwfGYWd8GwkH_BSY9Cwpd98wivz4jWvJ-RwTaQDaJ/pub?gid=438869818&single=true&output=csv',

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

/* ── Helper: inisial nama untuk avatar ──────────────────── */
function getInisial(nama) {
  if (!nama) return '?';
  const parts = nama.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Helper: parse CSV dari Google Sheets ────────────────── */
function parseCSV(text) {
  const lines  = text.trim().split('\n');
  const header = parseCSVRow(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCSVRow(line);
    const obj  = {};
    header.forEach((h, i) => obj[h.trim()] = (vals[i] || '').trim());
    return obj;
  }).filter(r => Object.values(r).some(v => v));
}

function parseCSVRow(row) {
  const result = [];
  let current  = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}