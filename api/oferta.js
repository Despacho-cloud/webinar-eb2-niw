// GET /api/oferta -> precio de la guía: US$9 (antes US$37), sin fecha límite. Se mantiene para cada edición del evento.
const PAY_PROMO = 'https://link.fastpaydirect.com/payment-link/6ac44b3ac0e70c7fefb72ad6';

module.exports = (req, res) => {
  const body = { ok: true, phase: 'promo', price: 9, was: 37, endsAt: null, now: Date.now(), payUrl: (process.env.PAY_URL_PROMO || PAY_PROMO) };
  res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=40');
  res.status(200).json(body);
};
