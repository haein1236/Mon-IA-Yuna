// ============================================================
// MOTEUR DE RÈGLES
// Décide ce qu'un personnage a le droit de faire à cet instant précis,
// selon SES traits et l'état réel de la relation — totalement
// indépendant du fournisseur IA (Gemini, Groq, peu importe).
// Deux rôles :
// 1. calculerInterdictions() → injecté DANS le prompt AVANT génération
//    (guide le modèle en amont, la meilleure défense)
// 2. validerReponse() → vérifié APRÈS génération, filet de sécurité
//    si le modèle ignore les consignes malgré tout
// ============================================================

const MOTS_BAISER = ["embrasse", "l'embrasse", "t'embrasse", "un baiser", "bisou sur les lèvres"]
const MOTS_DECLARATION = ["je t'aime", "je suis amoureux de toi", "je suis amoureuse de toi", "tu es l'amour de ma vie"]
const MOTS_EXCUSE_RAPIDE = ["je suis désolé", "je m'excuse", "pardonne-moi", "excuse-moi"]

function contientUnDe(texte, motsCles) {
  const t = texte.toLowerCase()
  return motsCles.some((m) => t.includes(m))
}

export function calculerInterdictions(personnage, nombreMessages) {
  const interdictions = []
  const traits = personnage.traits || []
  const confiance = personnage.relation?.confiance ?? 20
  const romance = personnage.relation?.romance ?? 0

  const estReserve = traits.some((t) => ['timide', 'reserve', 'mefiant', 'froid', 'melancolique'].includes(t))
  const estFier = traits.some((t) => ['dominant', 'impitoyable', 'charismatique'].includes(t))

  if ((estReserve || confiance < 40) && (romance < 40 || nombreMessages < 15)) {
    interdictions.push("Tu ne dois PAS embrasser le joueur ni avoir de geste physiquement intime — la confiance n'est pas encore suffisante.")
  }
  if (romance < 60 || nombreMessages < 20) {
    interdictions.push("Tu ne dois PAS faire de déclaration d'amour explicite (\"je t'aime\") — c'est encore trop tôt.")
  }
  if (estFier && nombreMessages < 10) {
    interdictions.push("Ton personnage est fier — il ne s'excuse jamais immédiatement ni facilement, même s'il a tort.")
  }
  if (traits.includes('reserve') || traits.includes('timide')) {
    interdictions.push("Évite les longues tirades — ton personnage reste économe en mots, surtout sur ses sentiments.")
  }
  if (traits.includes('mefiant') && confiance < 50) {
    interdictions.push("Tu élude ou refuses si on te demande de parler de ton passé ou de tes blessures — pas encore assez confiance.")
  }
  return interdictions
}

export function validerReponse(personnage, texteReponse, nombreMessages) {
  const traits = personnage.traits || []
  const confiance = personnage.relation?.confiance ?? 20
  const romance = personnage.relation?.romance ?? 0
  const estReserve = traits.some((t) => ['timide', 'reserve', 'mefiant', 'froid', 'melancolique'].includes(t))
  const estFier = traits.some((t) => ['dominant', 'impitoyable', 'charismatique'].includes(t))

  if ((estReserve || confiance < 40) && (romance < 40 || nombreMessages < 15) && contientUnDe(texteReponse, MOTS_BAISER)) {
    return { valide: false, raison: "Le personnage a embrassé le joueur trop tôt selon son caractère et la confiance actuelle." }
  }
  if ((romance < 60 || nombreMessages < 20) && contientUnDe(texteReponse, MOTS_DECLARATION)) {
    return { valide: false, raison: "Le personnage a fait une déclaration d'amour trop tôt." }
  }
  if (estFier && nombreMessages < 10 && contientUnDe(texteReponse, MOTS_EXCUSE_RAPIDE)) {
    return { valide: false, raison: "Un personnage fier ne s'excuse pas si vite." }
  }
  return { valide: true }
}

// ============================================================
// RÈGLES POUR LES PERSONNAGES SECONDAIRES PRÉSENTS DANS LA SCÈNE
// Moins strict que pour le personnage principal (on ne peut pas garantir
// à 100% quelle réplique appartient à quel personnage dans un texte à
// plusieurs voix) — mais mieux qu'aucun filet du tout.
// ============================================================

const MOTS_TRAHISON = ["t'ai menti", "je t'ai trahi", "en fait je mens", "je te trahis"]

export function calculerInterdictionsSecondaires(personnagesPresents) {
  const interdictions = []
  for (const s of personnagesPresents || []) {
    const traits = s.traits || []
    if (traits.includes('fidele') || traits.includes('loyal')) {
      interdictions.push(`${s.nom} est loyal/fidèle — il/elle ne doit jamais mentir sciemment ni trahir le personnage principal.`)
    }
    if (traits.includes('timide') || traits.includes('reserve')) {
      interdictions.push(`${s.nom} est timide/réservé — ses répliques doivent rester courtes, pas de longues tirades.`)
    }
    if (traits.includes('froid')) {
      interdictions.push(`${s.nom} est froid — évite les démonstrations d'affection excessives de sa part.`)
    }
    if (traits.includes('impitoyable')) {
      interdictions.push(`${s.nom} est impitoyable envers ses ennemis mais pas envers ceux qu'il/elle aime — pas de dureté gratuite envers le joueur ou le personnage principal sans raison narrative claire.`)
    }
  }
  return interdictions
}

export function validerReponseScene(personnagesPresents, texteReponse) {
  for (const s of personnagesPresents || []) {
    const traits = s.traits || []
    if ((traits.includes('fidele') || traits.includes('loyal')) && contientUnDe(texteReponse, MOTS_TRAHISON)) {
      return { valide: false, raison: `${s.nom} (loyal/fidèle) semble trahir ou mentir, ce qui contredit directement son trait.` }
    }
  }
  return { valide: true }
}