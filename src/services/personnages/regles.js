// ============================================================
// MOTEUR DE RÈGLES — v2
// Décide ce qu'un personnage a le droit de faire, et VÉRIFIE après coup
// que le modèle a bien respecté ces règles (rejet + régénération sinon).
// v2 : ajoute télépathie, contrôle du joueur, seuils basés sur le temps
// réel écoulé, et un registre d'événements vécus pour empêcher les
// souvenirs inventés (ex: un baiser qui n'a jamais eu lieu).
// ============================================================

const MOTS_BAISER = [
  "embrasse", "l'embrasse", "t'embrasse", "un baiser", "bisou sur les lèvres",
  "prends la bouche", "prens la bouche", "nos lèvres", "sa bouche contre",
  "je t'embrasse", "notre baiser", "après notre baiser",
]
const MOTS_DECLARATION = [
  "je t'aime", "je suis amoureux de toi", "je suis amoureuse de toi",
  "tu es l'amour de ma vie", "tu es tout pour moi", "je ne peux plus vivre sans toi",
]
const MOTS_EXCUSE_RAPIDE = ["je suis désolé", "je m'excuse", "pardonne-moi", "excuse-moi"]

// NOUVEAU — télépathie : le personnage prétend connaître ce que le joueur
// pense ou ressent intérieurement, ce qu'il ne peut jamais savoir.
const MOTS_TELEPATHIE = [
  "je sens que tu", "je sais que tu penses", "je sais que tu ressens",
  "je vois que tu es", "je devine que tu", "je perçois que tu",
  "tu es amoureuse", "tu es amoureux", "tu es prête", "tu es heureuse",
  "tu es heureux", "je sens ton désir", "je sens ta",
]

// NOUVEAU — contrôle du joueur : le personnage décrit une réaction
// physique/émotionnelle du JOUEUR à sa place, ce qui n'est jamais permis.
const MOTS_CONTROLE_JOUEUR = [
  "tu rougis", "tu te laisses faire", "tu réponds avec passion",
  "tu frissonnes", "tu te sens", "tu ressens", "tu te rapproches",
  "tu te blottis", "tu soupires de plaisir", "tu gémis",
]

// NOUVEAU — références à un événement passé (baiser, déclaration) qui
// doit être vérifié contre le registre réel avant d'être accepté.
const MOTS_REFERENCE_BAISER_PASSE = [
  "notre baiser", "après notre baiser", "depuis notre baiser",
  "notre premier baiser", "quand on s'est embrassés", "la dernière fois qu'on s'est embrassés",
]
const MOTS_REFERENCE_DECLARATION_PASSEE = [
  "quand je t'ai dit que je t'aime", "depuis que je t'ai dit je t'aime",
  "ma déclaration", "quand je t'ai avoué mes sentiments",
]

function contientUnDe(texte, motsCles) {
  const t = texte.toLowerCase()
  return motsCles.some((m) => t.includes(m))
}

export function calculerInterdictions(personnage, nombreMessages, joursDepuisDebut = 0) {
  const interdictions = []
  const traits = personnage.traits || []
  const confiance = personnage.relation?.confiance ?? 20
  const romance = personnage.relation?.romance ?? 0

  const estReserve = traits.some((t) => ['timide', 'reserve', 'mefiant', 'froid', 'melancolique'].includes(t))
  const estFier = traits.some((t) => ['dominant', 'impitoyable', 'charismatique'].includes(t))

  // NOUVEAU — le temps réel écoulé prime sur le nombre de messages : une
  // longue session de chat le jour même ne doit jamais suffire à elle
  // seule à débloquer un geste romantique.
  if (joursDepuisDebut < 1) {
    interdictions.push("Vous vous connaissez depuis MOINS D'UNE JOURNÉE — aucun geste romantique, baiser ou déclaration, peu importe le nombre de messages déjà échangés aujourd'hui.")
  }

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

  // NOUVEAU — télépathie et contrôle du joueur, rappelés explicitement
  interdictions.push("Tu ne connais JAMAIS les pensées ou émotions intérieures du joueur — seulement ce qu'il dit ou fait explicitement. N'écris jamais à sa place (ses réactions, ses sentiments).")

  return interdictions
}

export function validerReponse(personnage, texteReponse, nombreMessages, joursDepuisDebut = 0) {
  const traits = personnage.traits || []
  const confiance = personnage.relation?.confiance ?? 20
  const romance = personnage.relation?.romance ?? 0
  const estReserve = traits.some((t) => ['timide', 'reserve', 'mefiant', 'froid', 'melancolique'].includes(t))
  const estFier = traits.some((t) => ['dominant', 'impitoyable', 'charismatique'].includes(t))

  const tropTotPourGeste = joursDepuisDebut < 1 || ((estReserve || confiance < 40) && (romance < 40 || nombreMessages < 15))
  if (tropTotPourGeste && contientUnDe(texteReponse, MOTS_BAISER)) {
    return { valide: false, raison: "Le personnage a embrassé le joueur trop tôt selon son caractère, la confiance actuelle, ou le temps réellement écoulé depuis le début de l'histoire." }
  }

  const tropTotPourDeclaration = joursDepuisDebut < 1 || romance < 60 || nombreMessages < 20
  if (tropTotPourDeclaration && contientUnDe(texteReponse, MOTS_DECLARATION)) {
    return { valide: false, raison: "Le personnage a fait une déclaration d'amour trop tôt selon la relation actuelle ou le temps réellement écoulé." }
  }

  if (estFier && nombreMessages < 10 && contientUnDe(texteReponse, MOTS_EXCUSE_RAPIDE)) {
    return { valide: false, raison: "Un personnage fier ne s'excuse pas si vite." }
  }

  // NOUVEAU — télépathie
  if (contientUnDe(texteReponse, MOTS_TELEPATHIE)) {
    return { valide: false, raison: "Le personnage prétend connaître les pensées ou sentiments intérieurs du joueur — télépathie interdite, il ne peut connaître que ce qui est dit ou montré explicitement." }
  }

  // NOUVEAU — contrôle du joueur
  if (contientUnDe(texteReponse, MOTS_CONTROLE_JOUEUR)) {
    return { valide: false, raison: "Le personnage décrit une réaction physique ou émotionnelle du JOUEUR à sa place — c'est au joueur seul de décrire ses propres actions et ressentis." }
  }

  // NOUVEAU — référence à un événement passé qui n'a jamais eu lieu
  const evenements = personnage.progression?.evenementsVecus || {}
  if (contientUnDe(texteReponse, MOTS_REFERENCE_BAISER_PASSE) && !evenements.premierBaiser) {
    return { valide: false, raison: "Le personnage fait référence à un baiser passé qui n'a JAMAIS eu lieu dans cette histoire — souvenir inventé." }
  }
  if (contientUnDe(texteReponse, MOTS_REFERENCE_DECLARATION_PASSEE) && !evenements.declarationAmour) {
    return { valide: false, raison: "Le personnage fait référence à une déclaration d'amour passée qui n'a JAMAIS eu lieu — souvenir inventé." }
  }

  return { valide: true }
}

// NOUVEAU — détermine si une réponse VALIDÉE contient un événement à
// enregistrer dans le registre (pour que les futures références à cet
// événement soient acceptées, elles).
export function detecterEvenementsVecus(texteReponse) {
  const evenements = {}
  if (contientUnDe(texteReponse, MOTS_BAISER)) evenements.premierBaiser = true
  if (contientUnDe(texteReponse, MOTS_DECLARATION)) evenements.declarationAmour = true
  return evenements
}

// ============================================================
// RÈGLES POUR LES PERSONNAGES SECONDAIRES (inchangé depuis le patch précédent)
// ============================================================
const MOTS_TRAHISON = ["t'ai menti", "je t'ai trahi", "en fait je mens", "je te trahis"]

function compterRepliques(texte) {
  const correspondances = texte.match(/"[^"]{3,}"/g)
  return correspondances ? correspondances.length : 0
}

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
      interdictions.push(`${s.nom} est impitoyable envers ses ennemis mais pas envers ceux qu'il/elle aime.`)
    }
  }
  return interdictions
}

export function validerReponseScene(personnagesPresents, rolesImprovises, demandeParole, texteReponse) {
  for (const s of personnagesPresents || []) {
    const traits = s.traits || []
    if ((traits.includes('fidele') || traits.includes('loyal')) && contientUnDe(texteReponse, MOTS_TRAHISON)) {
      return { valide: false, raison: `${s.nom} (loyal/fidèle) semble trahir ou mentir, ce qui contredit directement son trait.` }
    }
  }

  const yAUnPersonnageSecondaireConcerne = (personnagesPresents?.length || 0) > 0 || (rolesImprovises?.length || 0) > 0
  if (demandeParole && yAUnPersonnageSecondaireConcerne) {
    if (compterRepliques(texteReponse) < 2) {
      return { valide: false, raison: "Le joueur a demandé explicitement qu'un personnage secondaire parle, mais la réponse ne contient pas de vraie réplique distincte pour lui." }
    }
  }

  return { valide: true }
}