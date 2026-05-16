const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { session_id } = req.body;

  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid' || session.status === 'complete') {
      // Determine plan from the price ID
      const lineItems = await stripe.checkout.sessions.listLineItems(session_id);
      const priceId = lineItems.data[0]?.price?.id;
      const plan = priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'basic';
      return res.status(200).json({ success: true, plan });
    }
    return res.status(200).json({ success: false, error: 'Payment not completed' });
  } catch (err) {
    console.error('Verify error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
