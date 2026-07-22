// ============================================================
// MOTEUR DE SCÈNE — gère quels personnages secondaires sont
// "présents" dans la conversation.
//
// Clé isolée par personnage pour éviter de charger/réécrire
// l'état global à chaque tour de parole.
//
// À placer dans : src/services/personnages/moteurScene.js
// ============================================================

const PREFIXE_CLE_SCENE = 'yuna-scene-active'
const TOURS_PRESENCE_PAR_DEFAUT = 4 // tours de présence d'un perso sans re-mention

function normaliserTexte(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// Génère une clé localStorage propre à chaque personnage principal
function cleScene(personnageId) {
  return `${PREFIXE_CLE_SCENE}-${personnageId}`
}

function chargerScene(personnageId) {
  const donnees = localStorage.getItem(cleScene(personnageId))
  return donnees ? JSON.parse(donnees) : { presents: {}, dernierAParle: null }
}

function sauvegarderScene(personnageId, scene) {
  localStorage.setItem(cleScene(personnageId), JSON.stringify(scene))
}

// Détecte TOUS les personnages secondaires mentionnés dans un texte
function detecterMentions(personnage, texte) {
  const secondaires = personnage.personnagesSecondaires || []
  if (secondaires.length === 0 || !texte) return []
  const texteNormalise = normaliserTexte(texte)
  return secondaires.filter((s) => {
    if (!s.nom) return false
    const nomNormalise = normaliserTexte(s.nom)
    const regex = new RegExp(`\\b${nomNormalise}\\b`, 'i')
    return regex.test(texteNormalise)
  })
}

/**
 * Récupère l'état de scène actuel pour un personnage principal
 */
export function obtenirScene(personnageId) {
  return chargerScene(personnageId)
}

/**
 * Met à jour et renvoie la liste des personnages secondaires actuellement
 * "présents" dans la scène. À appeler avant chaque envoi de message.
 */
export function mettreAJourScene(personnage, messageUtilisateur, dernierMessagePersonnage = '') {
  const scene = chargerScene(personnage.id)

  // 1. Décrémente tout le monde d'un tour
  for (const id of Object.keys(scene.presents)) {
    scene.presents[id] -= 1
    if (scene.presents[id] <= 0) delete scene.presents[id]
  }

  // 2. Ajoute/rafraîchit les personnages mentionnés
  const mentionnesJoueur = detecterMentions(personnage, messageUtilisateur)
  const mentionnesPersonnage = detecterMentions(personnage, dernierMessagePersonnage)
  const tousMentionnes = [...mentionnesJoueur, ...mentionnesPersonnage]

  for (const s of tousMentionnes) {
    scene.presents[s.id] = TOURS_PRESENCE_PAR_DEFAUT
  }

  sauvegarderScene(personnage.id, scene)

  // 3. Renvoie les objets complets des personnages actuellement présents
  const secondaires = personnage.personnagesSecondaires || []
  return Object.keys(scene.presents)
    .map((id) => secondaires.find((s) => s.id === id))
    .filter(Boolean)
}

/**
 * Force la sortie d'un personnage de la scène
 */
export function retirerDeLaScene(personnageId, secondaireId) {
  const scene = chargerScene(personnageId)
  if (scene.presents[secondaireId] !== undefined) {
    delete scene.presents[secondaireId]
    sauvegarderScene(personnageId, scene)
  }
}

/**
 * Réinitialise la scène active d'un personnage
 */
export function reinitialiserScene(personnageId) {
  localStorage.removeItem(cleScene(personnageId))
}

/**
 * Construit le bloc d'instruction à injecter dans le prompt.
 */
export function construireInstructionScene(personnagesPresents, personnageId = null) {
  if (!personnagesPresents || personnagesPresents.length === 0) return ''

  let dernierAParle = null
  if (personnageId) {
    dernierAParle = chargerScene(personnageId).dernierAParle
  }

  const blocs = personnagesPresents
    .map(
      (s) =>
        `- ${s.nom} (${s.role}) : personnalité = "${s.personnalite}" ; lien avec toi = "${s.lienAvecPrincipal}"`,
    )
    .join('\n')

  const contexteDernierLocuteur = dernierAParle
    ? `\nRemarque : Le dernier personnage secondaire ayant pris la parole était "${dernierAParle}".`
    : ''

  return `

[INSTRUCTION IMPÉRATIVE — PERSONNAGES SECONDAIRES PRÉSENTS DANS LA SCÈNE :
${blocs}${contexteDernierLocuteur}

Ces personnages sont physiquement présents dans la scène actuelle. Selon ce qui est cohérent avec la situation, ils peuvent réellement prendre la parole (avec de vraies répliques entre "guillemets", dans LEUR PROPRE personnalité, pas la tienne), réagir, interrompre, ou rester silencieux si ce n'est pas leur moment. Ne les ignore pas simplement parce que le joueur ne les a pas nommés dans son dernier message — ils sont toujours là jusqu'à ce qu'ils quittent explicitement la scène.]`
}