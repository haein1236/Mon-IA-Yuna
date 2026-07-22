// ============================================================
// MOTEUR DE SCÈNE — gère quels personnages secondaires sont
// "présents" dans la conversation, au-delà du simple message
// courant. Remplace detecterPersonnageSecondaireMentionne (qui
// ne retournait qu'un seul personnage et oubliait tout entre
// deux tours).
//
// À placer dans : src/services/personnages/moteurScene.js
// ============================================================

const CLE_SCENE = 'yuna-scene-active'
const TOURS_PRESENCE_PAR_DEFAUT = 4 // combien de tours un perso reste "présent" sans être re-mentionné

function normaliserTexte(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function chargerScenes() {
  const donnees = localStorage.getItem(CLE_SCENE)
  return donnees ? JSON.parse(donnees) : {}
}

function sauvegarderScenes(scenes) {
  localStorage.setItem(CLE_SCENE, JSON.stringify(scenes))
}

// Détecte TOUS les personnages secondaires mentionnés dans un texte (pas un seul)
function detecterMentions(personnage, texte) {
  const secondaires = personnage.personnagesSecondaires || []
  if (secondaires.length === 0 || !texte) return []
  const texteNormalise = normaliserTexte(texte)
  return secondaires.filter((s) => {
    if (!s.nom) return false
    const nomNormalise = normaliserTexte(s.nom)
    const regex = new RegExp(`\\b${nomNormalise}\\b`)
    return regex.test(texteNormalise)
  })
}

// Récupère l'état de scène actuel pour un personnage principal
function obtenirScene(personnageId) {
  const scenes = chargerScenes()
  return scenes[personnageId] || { presents: {} } // presents: { idSecondaire: toursRestants }
}

/**
 * Met à jour et renvoie la liste des personnages secondaires actuellement
 * "présents" dans la scène. À appeler avant chaque envoi de message.
 *
 * - Un perso mentionné dans le message du joueur OU dans la dernière
 *   réponse du personnage principal redevient/reste présent.
 * - Un perso présent le reste pendant TOURS_PRESENCE_PAR_DEFAUT tours
 *   même sans être re-mentionné (pour permettre les dialogues à trois
 *   sans que le joueur retape son nom à chaque fois).
 * - Passé ce délai, il "quitte" naturellement la scène.
 */
export function mettreAJourScene(personnage, messageUtilisateur, dernierMessagePersonnage = '') {
  const scenes = chargerScenes()
  const scene = scenes[personnage.id] || { presents: {} }

  // 1. décrémente tout le monde d'un tour
  for (const id of Object.keys(scene.presents)) {
    scene.presents[id] -= 1
    if (scene.presents[id] <= 0) delete scene.presents[id]
  }

  // 2. ajoute/rafraîchit les personnages mentionnés dans le message du joueur
  //    et dans la dernière réponse du personnage principal
  const mentionnesJoueur = detecterMentions(personnage, messageUtilisateur)
  const mentionnesPersonnage = detecterMentions(personnage, dernierMessagePersonnage)
  const tousMentionnes = [...mentionnesJoueur, ...mentionnesPersonnage]

  for (const s of tousMentionnes) {
    scene.presents[s.id] = TOURS_PRESENCE_PAR_DEFAUT
  }

  scenes[personnage.id] = scene
  sauvegarderScenes(scenes)

  // 3. renvoie les objets complets des personnages actuellement présents
  const secondaires = personnage.personnagesSecondaires || []
  return Object.keys(scene.presents)
    .map((id) => secondaires.find((s) => s.id === id))
    .filter(Boolean)
}

// Force la sortie d'un personnage de la scène (ex: le personnage principal dit "il est parti")
export function retirerDeLaScene(personnageId, secondaireId) {
  const scenes = chargerScenes()
  if (scenes[personnageId]?.presents?.[secondaireId] !== undefined) {
    delete scenes[personnageId].presents[secondaireId]
    sauvegarderScenes(scenes)
  }
}

export function reinitialiserScene(personnageId) {
  const scenes = chargerScenes()
  delete scenes[personnageId]
  sauvegarderScenes(scenes)
}

/**
 * Construit le bloc d'instruction à injecter dans le prompt, pour
 * UN ou PLUSIEURS personnages secondaires présents à la fois.
 */
export function construireInstructionScene(personnagesPresents) {
  if (!personnagesPresents || personnagesPresents.length === 0) return ''

  const blocs = personnagesPresents
    .map(
      (s) =>
        `- ${s.nom} (${s.role}) : personnalité = "${s.personnalite}" ; lien avec toi = "${s.lienAvecPrincipal}"`,
    )
    .join('\n')

  return `

[INSTRUCTION IMPÉRATIVE — PERSONNAGES SECONDAIRES PRÉSENTS DANS LA SCÈNE :
${blocs}

Ces personnages sont physiquement présents dans la scène actuelle. Selon ce qui est cohérent avec la situation, ils peuvent réellement prendre la parole (avec de vraies répliques entre "guillemets", dans LEUR PROPRE personnalité, pas la tienne), réagir, interrompre, ou rester silencieux si ce n'est pas leur moment. Ne les ignore pas simplement parce que le joueur ne les a pas nommés dans son dernier message — ils sont toujours là jusqu'à ce qu'ils quittent explicitement la scène.]`
}