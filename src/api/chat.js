// ============================================================
// ROUTE SERVEUR UNIFIÉE POUR LES 3 API DE SECOURS
// Groq, OpenRouter et Cerebras utilisent tous le même format
// "chat completions" (compatible OpenAI) — un seul fichier suffit,
// on choisit juste l'URL/clé/modèle selon le "provider" demandé.
// Les clés restent ICI, côté serveur — jamais exposées au navigateur.
// ============================================================

const CONFIGURATION_PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    cle: process.env.GROQ_API_KEY,
    modele: 'llama-3.3-70b-versatile',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    cle: process.env.OPENROUTER_API_KEY,
    modele: 'meta-llama/llama-3.3-70b-instruct:free',
  },
  cerebras: {
    url: 'https://api.cerebras.ai/v1/chat/completions',
    cle: process.env.CEREBRAS_API_KEY,
    modele: 'llama3.3-70b',
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { messages, provider = 'groq' } = req.body
    const config = CONFIGURATION_PROVIDERS[provider]

    if (!config) {
      return res.status(400).json({ error: `Fournisseur inconnu : ${provider}` })
    }
    if (!config.cle) {
      return res.status(500).json({ error: `Clé API manquante pour ${provider} (variable d'environnement non configurée sur Vercel)` })
    }

    const reponse = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.cle}`,
      },
      body: JSON.stringify({
        model: config.modele,
        temperature: 0.8,
        messages,
      }),
    })

    if (!reponse.ok) {
      const detail = await reponse.text()
      console.error(`Erreur ${provider} :`, detail)
      return res.status(reponse.status).json({ error: `${provider} a échoué (${reponse.status})` })
    }

    const data = await reponse.json()
    res.status(200).json({ reply: data.choices[0].message.content })

  } catch (e) {
    console.error('Erreur serveur /api/chat :', e)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}