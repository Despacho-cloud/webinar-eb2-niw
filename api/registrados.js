// GET /api/registrados -> { ok, n } con el número real de contactos con la etiqueta de registro.
// Caché de 60 s (memoria + CDN). Si falla, responde ok:false y la página oculta el contador.

const TAG = 'webinar-eb2-oct26-registrado';
let cache = { at: 0, n: null };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  const now = Date.now();
  if (cache.n !== null && now - cache.at < 60000) return res.status(200).json({ ok: true, n: cache.n });

  const token = process.env.GHL_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) return res.status(200).json({ ok: false });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch('https://services.leadconnectorhq.com/contacts/search', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: 'Bearer ' + token,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        locationId,
        page: 1,
        pageLimit: 1,
        filters: [{ field: 'tags', operator: 'contains', value: [TAG] }],
      }),
    });
    const d = await r.json().catch(() => ({}));
    const n = Number(d && d.total);
    if (!r.ok || !Number.isFinite(n) || n < 0) {
      console.error('registrados: respuesta inesperada', r.status);
      return res.status(200).json({ ok: false });
    }
    cache = { at: now, n };
    return res.status(200).json({ ok: true, n });
  } catch (e) {
    console.error('registrados: error', (e && e.name) || 'desconocido');
    return res.status(200).json({ ok: false });
  } finally {
    clearTimeout(timer);
  }
};
