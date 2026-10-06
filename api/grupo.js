// GET /api/grupo?cid=<id>  -> agrega la etiqueta grupo-wa-clic y redirige (302) al grupo de WhatsApp.
// Si falta el id o la configuración, solo redirige.

const GRUPO = 'https://chat.whatsapp.com/JT1Tik0U2BxDIxlfg1SDEi?s=cl&p=i&mlu=0&ilr=4';
const TAG = 'grupo-wa-clic';

module.exports = async (req, res) => {
  const cid = String(req.query?.cid || '');
  const token = process.env.GHL_TOKEN;

  if (/^[A-Za-z0-9]{10,40}$/.test(cid) && token) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    try {
      const r = await fetch(`https://services.leadconnectorhq.com/contacts/${cid}/tags`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          Authorization: 'Bearer ' + token,
          Version: '2021-07-28',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ tags: [TAG] }),
      });
      if (!r.ok) console.error('grupo: etiqueta falló', r.status);
    } catch (e) {
      console.error('grupo: error', e?.name || 'desconocido');
    } finally {
      clearTimeout(timer);
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', GRUPO);
  res.status(302).end();
};
