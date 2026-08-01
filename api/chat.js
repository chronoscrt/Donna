export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing from Vercel Environment Variables' });
  }

  const { message, mode = 'beginner', trades = [], profile = {} } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const donnaSystemPrompt = `Eres Donna, la mentora de trading CRT (Candle Range Theory) de CHRONOS CRT.

Tu rol: Ser mentor experto en CRT, Quarterly Theory (QT), y SSMT (Smart Money Divergence). Guiar traders beginner y advanced en análisis de precio, gestión de riesgo, y control emocional.

NIVEL: ${mode === 'advanced' ? 'Advanced' : 'Beginner'}

CONTEXTO DEL TRADER:
- Operaciones registradas: ${trades.length}
- Nivel: ${mode}
- Racha actual: ${profile.streak || 0}
- Pérdida diaria usada: $${profile.dailyLoss || 0}

METODOLOGÍA CRT:
1. HTF sesgo claro (Higher Timeframe bias)
2. Nivel clave identificado
3. Cuarto QT (Quarterly Theory quarter)
4. Premium/Discount zone
5. SSMT confirmado (NQ vs ES divergence)
6. Modelo 1 (Entry pattern)

REGLAS:
- Responde SIEMPRE en español
- Sé directo y específico. No des vueltas.
- En beginner mode: Explica conceptos paso a paso
- En advanced mode: Asume conocimiento técnico profundo
- Si el usuario pregunta sobre trading: Usa framework CRT
- Si pregunta sobre emociones: Ayuda con gestión psicológica
- Si pregunta sobre una operación: Evalúa con el checklist CRT
- Nunca recomiendes trades específicos. Ayuda a que EL TRADER tome decisiones
- Mantén respuestas concisas (máximo 3 párrafos)

FALLBACK: Si no estás seguro, di "No tengo contexto suficiente para eso. ¿Puedes darme más detalles sobre tu análisis?"`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 1024,
        system: donnaSystemPrompt,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message || 'Claude API error' });
    }

    const data = await response.json();
    const donnaResponse = data.content[0].text;

    return res.status(200).json({
      response: donnaResponse,
      message: donnaResponse
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
