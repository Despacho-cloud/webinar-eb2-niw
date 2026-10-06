// GET /api/comprado?cid=<id> -> { paid: boolean } según la etiqueta ebook-eb2-comprado del contacto.
// Solo devuelve un booleano; no expone datos del contacto.

const TAG = 'ebook-eb2-comprado';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const cid = String((req.query && req.query.cid) || '');
  const token = process.env.GHL_TOKEN;
  if (!/^[A-Za-z0-9]{10,40}$/.test(cid) || !token) return res.status(200).json({ paid: false });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(`https://services.leadconnectorhq.com/contacts/${cid}`, {
      signal: ctrl.signal,
      headers: { Authorization: 'Bearer ' + token, Version: '2021-07-28', Accept: 'application/json' },
    });
    if (!r.ok) return res.status(200).json({ paid: false });
    const d = await r.json().catch(() => ({}));
    const tags = (d && d.contact && d.contact.tags) || [];
    return res.status(200).json({ paid: tags.map((t) => String(t).toLowerCase()).includes(TAG) });
  } catch (e) {
    console.error('comprado: error', (e && e.name) || 'desconocido');
    return res.status(200).json({ paid: false });
  } finally {
    clearTimeout(timer);
  }
};
