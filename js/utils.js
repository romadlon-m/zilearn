/**
 * utils.js — ZI Learning
 * Fungsi utility yang dipakai lintas halaman.
 * Dipanggil setelah config.js dan auth.js di-load.
 */

/**
 * Cek challenge berstatus Aktif yang sudah melewati jam_tutup (WIB),
 * lalu auto-update ke Selesai di Supabase.
 * Dipanggil di challenge.html, leaderboard.html, dan admin.html.
 * @returns {Promise<number>} jumlah challenge yang ditutup
 */
async function autoTutupChallengeExpired() {
  try {
    const sekarang = new Date();

    const { data, error } = await db
      .from('challenge')
      .select('id, tanggal_tutup, jam_tutup')
      .or('status.eq.Aktif,status.eq.aktif');

    if (error || !data?.length) return 0;

    const expired = data.filter(c => {
      if (!c.tanggal_tutup || !c.jam_tutup) return false;
      // Admin input WIB — parse dengan offset +07:00
      const jamTutup = new Date(`${c.tanggal_tutup}T${String(c.jam_tutup).slice(0,5)}:00+07:00`);
      return sekarang > jamTutup;
    });

    if (!expired.length) return 0;

    await Promise.all(
      expired.map(c =>
        db.from('challenge').update({ status: 'Selesai' }).eq('id', c.id)
      )
    );

    console.log(`[utils] ${expired.length} challenge otomatis ditutup.`);
    return expired.length;

  } catch (e) {
    console.error('[utils] autoTutupChallengeExpired error:', e);
    return 0;
  }
}