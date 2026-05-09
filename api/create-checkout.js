module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured in Vercel Environment Variables' });
  }

  const { plan } = req.body;
  const priceId = plan === 'pro'
    ? process.env.STRIPE_PRICE_PRO    // $15/month price ID
    : process.env.STRIPE_PRICE_BASIC; // $10/month price ID

  if (!priceId) {
    return res.status(500).json({ 
      error: `STRIPE_PRICE_${plan.toUpperCase()} not configured in Vercel Environment Variables` 
    });
  }

  try {
    const body = new URLSearchParams({
      'payment_method_types[]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'mode': 'subscription',
      'success_url': 'https://www.chronoscrt.com?session_id={CHECKOUT_SESSION_ID}',
      'cancel_url': 'https://www.chronoscrt.com',
      'allow_promotion_codes': 'true',
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });

    const session = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: session.error?.message || 'Stripe error' });
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
