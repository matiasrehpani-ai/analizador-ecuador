export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requerida' });

  const prompt = `Actúa como un experto en CRO (Conversion Rate Optimization) y Diseño Web con enfoque en el mercado ecuatoriano. Analiza la siguiente URL: ${url}

Usa web search para visitar y examinar el sitio. Luego aplica este sistema de puntuación estricto de 0 a 10 puntos:

CRITERIOS:
1. Propiedad (3 pts): ¿Tiene web propia o solo redes sociales/directorio? Sin web propia = 0 pts total.
2. Velocidad y Mobile (2 pts): ¿Parece ligera y responsiva la estructura?
3. CTA arriba del fold (1 pt): ¿Hay botón de acción visible sin hacer scroll?
4. Diseño y Estética (1 pt): ¿El diseño parece moderno o tiene más de 5 años?
5. Formulario/Contacto (1 pt): ¿Es fácil encontrar cómo contactarlos?
6. SEO Local Ecuador (1 pt): ¿Aparece ubicación en Ecuador (Quito, Guayaquil, etc.) y palabras clave del nicho?
7. Propuesta de Valor (1 pt): ¿Comunica claramente qué hace y qué gana el cliente en la primera pantalla?

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks. Exactamente este formato:
{
  "score": <número 0-10>,
  "verdict": "<Prospecto Fuerte | Prospecto Válido | Prospecto Débil>",
  "criteria": [
    {"name": "Propiedad", "pts_earned": <0-3>, "pts_max": 3, "note": "<observación breve>"},
    {"name": "Velocidad y Mobile", "pts_earned": <0-2>, "pts_max": 2, "note": "<observación>"},
    {"name": "CTA arriba del fold", "pts_earned": <0-1>, "pts_max": 1, "note": "<observación>"},
    {"name": "Diseño y Estética", "pts_earned": <0-1>, "pts_max": 1, "note": "<observación>"},
    {"name": "Formulario/Contacto", "pts_earned": <0-1>, "pts_max": 1, "note": "<observación>"},
    {"name": "SEO Local Ecuador", "pts_earned": <0-1>, "pts_max": 1, "note": "<observación>"},
    {"name": "Propuesta de Valor", "pts_earned": <0-1>, "pts_max": 1, "note": "<observación>"}
  ],
  "issues": ["<problema crítico 1>", "<problema crítico 2>", "<problema crítico 3>"],
  "pitch": [
    {"title": "<título argumento 1>", "body": "<argumento persuasivo dirigido al dueño, máx 2 oraciones>"},
    {"title": "<título argumento 2>", "body": "<argumento persuasivo>"},
    {"title": "<título argumento 3>", "body": "<argumento persuasivo>"}
  ]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const textBlock = data.content && data.content.find(b => b.type === 'text');
    if (!textBlock) return res.status(500).json({ error: 'Sin respuesta de texto' });

    let raw = textBlock.text.trim().replace(/```json|```/g, '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Formato inesperado' });

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
