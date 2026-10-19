// GET /api/oferta -> precio de la guía. Oferta de esta edición del evento: US$9 (antes US$37) hasta el jueves 29 de octubre de 2026, 11:59:59 p. m. (Houston, UTC-5).
// Después: US$37 (precio de referencia) hasta la siguiente edición. Variables opcionales: PAY_URL_PROMO, PAY_URL_REGULAR.
const DEADLINE = Date.UTC(2026, 9, 30, 4, 59, 59);
const PAY_PROMO = 'https://link.fastpaydirect.com/payment-link/6ac44b3ac0e70c7fefb72ad6';

module.exports = (req, res) => {
  const now = Date.now();
  const regular = (process.env.PAY_URL_REGULAR || '').trim();
  const body = now <= DEADLINE
    ? { ok: true, phase: 'promo', price: 9, was: 37, endsAt: new Date(DEADLINE).toISOString(), now, payUrl: (process.env.PAY_URL_PROMO || PAY_PROMO) }
    : { ok: true, phase: 'regular', price: 37, was: null, endsAt: null, now, payUrl: regular.startsWith('https://') ? regular : null };
  res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=40');
  res.status(200).json(body);
};
