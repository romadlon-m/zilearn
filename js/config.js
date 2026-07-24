/* ============================================================
   ZI Learning — config.js
   Semua konstanta dan konfigurasi global.
   Simpan di: js/config.js
   ============================================================ */

const CONFIG = {

  /* ── Supabase ─────────────────────────────────────────── */
  SUPABASE_URL  : 'https://touwgoojuqqtjohglwzg.supabase.co',
  SUPABASE_KEY  : 'sb_publishable_V4zfFOaNyWrGgPNxgPq8qA_eXVGMMb5', // publishable key

  /* ── Google Sheets CSV URL ────────────────────────────── */
  // Didapat dari: File → Share → Publish to web → CSV
  SHEETS_KONTEN : 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1Wl8j5VCPFV6ewaewXeN5Il3-ztMZS9X3UXMxwfGYWd8GwkH_BSY9Cwpd98wivz4jWvJ-RwTaQDaJ/pub?gid=0&single=true&output=csv',
  SHEETS_SOAL   : 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1Wl8j5VCPFV6ewaewXeN5Il3-ztMZS9X3UXMxwfGYWd8GwkH_BSY9Cwpd98wivz4jWvJ-RwTaQDaJ/pub?gid=438869818&single=true&output=csv',

  /* ── Nama Platform ────────────────────────────────────── */
  APP_NAME      : 'ZI Learning',
  APP_SUB       : 'BPS Provinsi Kepulauan Bangka Belitung',

  /* ── Pengaturan Kuis ──────────────────────────────────── */
  QUIZ_JUMLAH_SOAL : 10,    // jumlah soal per sesi kuis

  /* ── Role ─────────────────────────────────────────────── */
  ROLE_PEGAWAI  : 'pegawai',
  ROLE_ADMIN    : 'admin',

};

/* ── Helper: konversi URL share Drive ke URL gambar ──────── */
function driveUrl(shareUrl) {
  if (!shareUrl) return '';
  const match = shareUrl.match(/\/d\/([^/]+)\//);
  return match
    ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`
    : shareUrl;
}

/* ── Helper: format tanggal Indonesia ───────────────────── */
function formatTanggal(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
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