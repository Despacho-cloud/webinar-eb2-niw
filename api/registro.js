// POST /api/registro  -> upsert del contacto en GoHighLevel + etiqueta de registro.
// Variables de entorno (solo en Vercel): GHL_TOKEN, GHL_LOCATION_ID.
// No se registran datos personales en los logs.

const GHL = 'https://services.leadconnectorhq.com';
const TAG_REGISTRO = 'webinar-eb2-oct26-registrado';
const SOURCE = 'Landing webinar';
const ALLOWED_ORIGINS = ['https://webinar.myeb2.life', 'https://webinar-eb2-niw.vercel.app'];

// Rate limit simple por IP (por instancia): 5 envíos / 10 min.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < win)) hits.delete(k);
  return list.length > 5;
}

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

function json(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

async function ghl(path, method, body, token) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(GHL + path, {
      method,
      signal: ctrl.signal,
      headers: {
        Authorization: 'Bearer ' + token,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Método no permitido.' });

  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return json(res, 403, { ok: false, error: 'Origen no permitido.' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (limited(ip)) return json(res, 429, { ok: false, error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' });

  const b = typeof req.body === 'object' && req.body ? req.body : {};

  // Honeypot: responder como si todo hubiera ido bien, sin crear nada.
  if (clean(b.website, 100)) return json(res, 200, { ok: true, id: null });

  const name = clean(b.name, 120);
  const email = clean(b.email, 160).toLowerCase();
  const phone = clean(b.phone, 20).replace(/[^\d+]/g, '');
  const consent = b.consent === true || b.consent === 'true' || b.consent === 'on';

  const errors = {};
  if (name.length < 2 || !/\p{L}/u.test(name)) errors.name = 'Escribe tu nombre.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Escribe un correo válido.';
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) errors.phone = 'Escribe un teléfono válido con tu país.';
  if (!consent) errors.consent = 'Necesitamos tu consentimiento para enviarte la información.';
  if (Object.keys(errors).length) return json(res, 422, { ok: false, errors, error: 'Revisa los campos marcados.' });

  const token = process.env.GHL_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) {
    console.error('registro: faltan variables de entorno GHL_TOKEN / GHL_LOCATION_ID');
    return json(res, 503, { ok: false, error: 'El registro no está disponible por un momento. Intenta de nuevo en unos minutos.' });
  }

  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ');

  try {
    const up = await ghl('/contacts/upsert', 'POST', {
      locationId,
      firstName,
      lastName,
      name,
      email,
      phone,
      source: SOURCE,
    }, token);
    if (!up.ok) {
      console.error('registro: upsert falló', up.status);
      return json(res, 502, { ok: false, error: 'No pudimos completar tu registro. Intenta de nuevo.' });
    }
    const id = up.data?.contact?.id;
    if (!id) return json(res, 502, { ok: false, error: 'No pudimos completar tu registro. Intenta de nuevo.' });

    const tag = await ghl(`/contacts/${id}/tags`, 'POST', { tags: [TAG_REGISTRO] }, token);
    if (!tag.ok) console.error('registro: etiqueta falló', tag.status);

    return json(res, 200, { ok: true, id });
  } catch (e) {
    console.error('registro: error', e?.name || 'desconocido');
    return json(res, 502, { ok: false, error: 'No pudimos completar tu registro. Intenta de nuevo.' });
  }
};
