// File: api/preset.js  (Vercel serverless function)
const presets = require('../presets.json');

function isTikTok(u) {
  try {
    const h = new URL(u).hostname;
    return h === 'tiktok.com' || h.endsWith('.tiktok.com');
  } catch { return false; }
}

module.exports = async (req, res) => {
  const url = req.query.url;
  if (!url || !isTikTok(url)) {
    return res.status(400).json({ error: 'Link harus dari TikTok.' });
  }
  try {
    // Ikuti link pendek (vt.tiktok.com) ke link asli
    const head = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const finalUrl = isTikTok(head.url) ? head.url : url;

    const r = await fetch('https://www.tiktok.com/oembed?url=' + encodeURIComponent(finalUrl));
    if (!r.ok) return res.status(404).json({ error: 'Video tidak ditemukan.' });
    const v = await r.json();

    const text = ((v.title || '') + ' ' + (v.author_name || '')).toLowerCase();
    const found = presets.filter(p => p.keywords.some(k => text.includes(k.toLowerCase())));

    res.status(200).json({
      video: { title: v.title, author: v.author_unique_id || v.author_name, thumbnail: v.thumbnail_url },
      presets: found.map(p => ({ name: p.name, link: p.link }))
    });
  } catch (e) {
    res.status(500).json({ error: 'Terjadi kesalahan, coba lagi.' });
  }
};
