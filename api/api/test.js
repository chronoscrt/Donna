module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      status: 'FAIL',
      problem: 'ANTHROPIC_API_KEY is not set in Vercel Environment Variables',
      fix: 'Go to Vercel > Settings > Environment Variables > Add ANTHROPIC_API_KEY'
    });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say OK' }]
      })
    });
    const data = await response.json();
    if (response.ok) {
      return res.status(200).json({
        status: 'SUCCESS',
        message: 'API key is valid and working',
        response: data.content?.[0]?.text || 'got response'
      });
    } else {
      return res.status(200).json({
        status: 'FAIL',
        http_status: response.status,
        error: data.error?.message || JSON.stringify(data),
        fix: response.status === 401 ? 'API key is wrong or expired — create a new one at console.anthropic.com' :
             response.status === 403 ? 'API key does not have permission — check billing at console.anthropic.com' :
             response.status === 529 ? 'Anthropic API is overloaded — try again in a minute' :
             'Unknown error — see error field above'
      });
    }
  } catch (err) {
    return res.status(200).json({
      status: 'FAIL',
      problem: 'Network error: ' + err.message,
      fix: 'Vercel function cannot reach api.anthropic.com'
    });
  }
};
