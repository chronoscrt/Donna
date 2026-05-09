module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not set' });

  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });

  try {
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${session_id}?expand[]=line_items`,
      { headers: { 'Authorization': `Bearer ${secretKey}` } }
    );
    const session = await response.json();

    if (!response.ok) return res.status(400).json({ error: session.error?.message });

    if (session.payment_status === 'paid' || session.status === 'complete') {
      const amount = session.amount_total;
      const plan = amount >= 1500 ? 'pro' : 'basic';
      return res.status(200).json({ success: true, plan, customer: session.customer });
    }

    return res.status(200).json({ success: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
