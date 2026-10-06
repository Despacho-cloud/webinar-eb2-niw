// GET /api/oferta -> precio vigente de la guía según la fecha del servidor.
// Hasta el miércoles 21 de octubre de 2026, 11:59:59 p. m. (Houston, UTC-5): US$9 (antes US$22).
// Después: US$22, sin cuenta regresiva ni lenguaje de oferta.
// Variables de entorno opcionales (Vercel): PAY_URL_PROMO, PAY_URL_REGULAR.

const DEADLINE = Date.UTC(2026, 9, 22, 4, 59, 59); // 2026-10-21 23:59:59 en Houston (UTC-5)
const PAY_PROMO = 'https://link.fastpaydirect.com/payment-link/6ac44b3ac0e70c7fefb72ad6';

module.exports = (req, res) => {
  const now = Date.now();
  const promo = now <= DEADLINE;
  const regular = (process.env.PAY_URL_REGULAR || '').trim();
  const body = promo
    ? { ok: true, phase: 'promo', price: 9, was: 22, endsAt: new Date(DEADLINE).toISOString(), now, payUrl: (process.env.PAY_URL_PROMO || PAY_PROMO) }
    : { ok: true, phase: 'regular', price: 22, was: null, endsAt: null, now, payUrl: /^https:\/\//.test(regular) ? regular : null };
  res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=40');
  res.status(200).json(body);
};
