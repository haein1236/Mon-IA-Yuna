// ============================================================
// CONFIGURATION MULTI-MODÈLES PAR FOURNISSEUR
// Chaque fournisseur a PLUSIEURS modèles candidats — si le premier
// n'existe plus (catalogue changé), on essaie le suivant avant
// d'abandonner ce fournisseur. Rend le système résistant aux
// changements de catalogue gratuit, fréquents chez ces fournisseurs.
// ============================================================
const CONFIGURATION_PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    cle: process.env.GROQ_API_KEY,
    modeles: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    cle: process.env.OPENROUTER_API_KEY,
    modeles: ['meta-llama/llama-3.2-3b-instruct:free', 'google/gemma-2-9b-it:free', 'mistralai/mistral-7b-instruct:free'],
  },
  cerebras: {
    url: 'https://api.cerebras.ai/v1/chat/completions',
    cle: process.env.CEREBRAS_API_KEY,
    modeles: ['llama-3.3-70b', 'llama3.1-8b'],
  },
}

async function essayerUnModele(url, cle, modele, messages) {
  const reponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
    body: JSON.stringify({ model: modele, temperature: 0.8, messages }),
  })
  if (!reponse.ok) {
    const detail = await reponse.text()
    throw new Error(`${reponse.status} — ${detail.slice(0, 200)}`)
  }
  const data = await reponse.json()
  return data.choices[0].message.content
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  try {
    const { messages, provider = 'groq' } = req.body
    const config = CONFIGURATION_PROVIDERS[provider]

    if (!config) return res.status(400).json({ error: `Fournisseur inconnu : ${provider}` })
    if (!config.cle) {
      console.error(`[api/chat] Clé manquante pour "${provider}"`)
      return res.status(500).json({ error: `Clé API manquante pour ${provider} — vérifie la variable d'environnement sur Vercel.` })
    }

    let derniereErreur = null
    for (const modele of config.modeles) {
      try {
        const reply = await essayerUnModele(config.url, config.cle, modele, messages)
        return res.status(200).json({ reply, modeleUtilise: modele })
      } catch (e) {
        console.error(`[api/chat] ${provider}/${modele} a échoué :`, e.message)
        derniereErreur = e
        // continue vers le modèle suivant de ce même fournisseur
      }
    }

    return res.status(502).json({ error: `Tous les modèles de ${provider} ont échoué`, detail: derniereErreur?.message })

  } catch (e) {
    console.error('[api/chat] Erreur serveur inattendue :', e)
    res.status(500).json({ error: 'Erreur serveur', detail: e.message })
  }
}