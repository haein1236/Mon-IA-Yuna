import { calculerProfilComportemental } from '../personnages'

// ============================================================
// MOTEUR DE SCÈNE — v5
// v1 : présence des personnages secondaires nommés
// v2 : lieu, objets, événements en attente, variété de prise de parole
// v3 : stockage par personnage (perf)
// v4 : rôles génériques improvisés + parole impérative
// v5 : présence du JOUEUR dans la scène + compteur de tours solo
//      (empêche le personnage de continuer à agir/parler indéfiniment
//      en l'absence du joueur, et d'halluciner ses pensées à distance)
// ============================================================

const PREFIXE_CLE_SCENE = 'yuna-scene-active'
const TOURS_PRESENCE_PAR_DEFAUT = 4
const TOURS_PRESENCE_IMPROVISE = 2

function normaliserTexte(texte) {
  return texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function cleScene(personnageId) {
  return `${PREFIXE_CLE_SCENE}-${personnageId}`
}
function chargerScene(personnageId) {
  const donnees = localStorage.getItem(cleScene(personnageId))
  return donnees ? JSON.parse(donnees) : { presents: {}, rolesImprovises: {}, dernierAParle: null, joueurPresent: true, toursSoloConsecutifs: 0 }
}
function sauvegarderScene(personnageId, scene) {
  localStorage.setItem(cleScene(personnageId), JSON.stringify(scene))
}

function detecterMentions(personnage, texte) {
  const secondaires = personnage.personnagesSecondaires || []
  if (secondaires.length === 0 || !texte) return []
  const texteNormalise = normaliserTexte(texte)
  return secondaires.filter((s) => {
    if (!s.nom) return false
    const regex = new RegExp(`\\b${normaliserTexte(s.nom)}\\b`)
    return regex.test(texteNormalise)
  })
}

const ROLES_GENERIQUES = [
  'frère', 'soeur', 'sœur', 'mère', 'maman', 'père', 'papa',
  'ami', 'amie', 'meilleur ami', 'meilleure amie',
  'collègue', 'voisin', 'voisine', 'cousin', 'cousine',
  'patron', 'patronne', 'grand-mère', 'grand-père', 'tante', 'oncle',
]

function detecterRolesGeneriques(personnage, texte) {
  if (!texte) return []
  const texteNormalise = normaliserTexte(texte)
  const rolesDejaNommes = new Set(
    (personnage.personnagesSecondaires || []).map((s) => normaliserTexte(s.role || ''))
  )
  const trouves = []
  for (const role of ROLES_GENERIQUES) {
    const roleNormalise = normaliserTexte(role)
    if (rolesDejaNommes.has(roleNormalise)) continue
    const regex = new RegExp(`\\b${roleNormalise}\\b`)
    if (regex.test(texteNormalise)) trouves.push(role)
  }
  return trouves
}

const VERBES_PAROLE = ['parle', 'parler', 'répond', 'repond', 'répondre', 'repondre', 'dit', 'prend la parole', 'prends la parole']
export function demandeExplicitementDeParler(texte) {
  if (!texte) return false
  const texteNormalise = normaliserTexte(texte)
  return VERBES_PAROLE.some((v) => new RegExp(`\\b${normaliserTexte(v)}\\b`).test(texteNormalise))
}

// NOUVEAU — présence du joueur dans la scène
const MOTS_DEPART = ['je sors', 'je pars', "je m'en vais", 'je quitte', 'je rentre chez moi', 'je raccroche']
const MOTS_RETOUR = ['je reviens', 'je rentre', "j'arrive", 'me revoici', 'je suis de retour', 'me revoilà']

function detecterChangementPresenceJoueur(texte) {
  if (!texte) return null
  const texteNormalise = normaliserTexte(texte)
  if (MOTS_DEPART.some((m) => texteNormalise.includes(normaliserTexte(m)))) return false
  if (MOTS_RETOUR.some((m) => texteNormalise.includes(normaliserTexte(m)))) return true
  return null // pas de changement détecté
}

/**
 * Met à jour toute la scène en un seul appel : personnages nommés
 * présents, rôles improvisés, présence du joueur, compteur de tours
 * solo. Renvoie un objet unique avec tout ce qu'il faut pour construire
 * le prompt — plus besoin de relire le storage ensuite.
 *
 * options.estContinuation : true quand cet appel vient du bouton
 * "Continuer l'histoire" (le personnage agit sans nouveau message du
 * joueur) — incrémente le compteur de tours solo au lieu de le
 * réinitialiser.
 */
export function mettreAJourScene(personnage, messageUtilisateur, dernierMessagePersonnage = '', options = {}) {
  const scene = chargerScene(personnage.id)
  if (!scene.rolesImprovises) scene.rolesImprovises = {}
  if (scene.joueurPresent === undefined) scene.joueurPresent = true
  if (scene.toursSoloConsecutifs === undefined) scene.toursSoloConsecutifs = 0

  // --- présence des personnages secondaires nommés ---
  for (const id of Object.keys(scene.presents)) {
    scene.presents[id] -= 1
    if (scene.presents[id] <= 0) delete scene.presents[id]
  }
  for (const role of Object.keys(scene.rolesImprovises)) {
    scene.rolesImprovises[role] -= 1
    if (scene.rolesImprovises[role] <= 0) delete scene.rolesImprovises[role]
  }

  const mentionnesJoueur = detecterMentions(personnage, messageUtilisateur)
  const mentionnesPersonnage = detecterMentions(personnage, dernierMessagePersonnage)
  for (const s of [...mentionnesJoueur, ...mentionnesPersonnage]) {
    scene.presents[s.id] = TOURS_PRESENCE_PAR_DEFAUT
  }
  if (mentionnesPersonnage.length > 0) {
    scene.dernierAParle = mentionnesPersonnage[mentionnesPersonnage.length - 1].id
  }

  const rolesJoueur = detecterRolesGeneriques(personnage, messageUtilisateur)
  const rolesPersonnage = detecterRolesGeneriques(personnage, dernierMessagePersonnage)
  for (const role of [...rolesJoueur, ...rolesPersonnage]) {
    scene.rolesImprovises[role] = TOURS_PRESENCE_IMPROVISE
  }

  // --- présence du joueur ---
  const changementPresence = detecterChangementPresenceJoueur(messageUtilisateur)
  if (changementPresence !== null) scene.joueurPresent = changementPresence

  // --- compteur de tours solo ---
  if (options.estContinuation) {
    scene.toursSoloConsecutifs += 1
  } else {
    scene.toursSoloConsecutifs = 0
    // un vrai message du joueur signifie presque toujours qu'il est présent,
    // sauf s'il vient d'annoncer explicitement son départ dans CE message
    if (changementPresence === null) scene.joueurPresent = true
  }

  sauvegarderScene(personnage.id, scene)

  const secondaires = personnage.personnagesSecondaires || []
  const nommes = Object.keys(scene.presents).map((id) => secondaires.find((s) => s.id === id)).filter(Boolean)
  const improvises = Object.keys(scene.rolesImprovises)

  return {
    nommes,
    improvises,
    dernierMessageUtilisateur: messageUtilisateur,
    demandeParole: demandeExplicitementDeParler(messageUtilisateur),
    joueurPresent: scene.joueurPresent,
    toursSoloConsecutifs: scene.toursSoloConsecutifs,
    dernierAParle: scene.dernierAParle,
  }
}

export function retirerDeLaScene(personnageId, secondaireId) {
  const scene = chargerScene(personnageId)
  if (scene.presents[secondaireId] !== undefined) {
    delete scene.presents[secondaireId]
    sauvegarderScene(personnageId, scene)
  }
}

export function reinitialiserScene(personnageId) {
  localStorage.removeItem(cleScene(personnageId))
}

function construireObjetScene(personnage, sceneDetection) {
  const secondaires = personnage.personnagesSecondaires || []
  const idsPresents = new Set(sceneDetection.nommes.map((s) => s.id))
  const absents = secondaires.filter((s) => !idsPresents.has(s.id))

  return {
    lieu: personnage.lieuTemps?.lieuActuel || null,
    objets: personnage.lieuTemps?.objetsPresents || [],
    ambiance: personnage.lieuTemps?.ambianceActuelle || null,
    sceneActuelle: personnage.progression?.sceneActuelle || null,
    evenementsEnAttente: personnage.progression?.evenementsDebloques || [],
    presents: sceneDetection.nommes,
    improvises: sceneDetection.improvises,
    absents,
  }
}

export function construireInstructionScene(personnage, sceneDetection) {
  const scene = construireObjetScene(personnage, sceneDetection)
  const blocs = []

  // NOUVEAU — absence du joueur : la règle la plus importante, en premier
  if (sceneDetection.joueurPresent === false) {
    blocs.push(`LE JOUEUR N'EST PLUS PRÉSENT DANS LA SCÈNE AVEC TOI. Tu ne peux ni le voir, ni l'entendre, ni percevoir ses pensées, ni savoir ce qu'il fait ou ressent ailleurs — sauf s'il te contacte explicitement (appel, message écrit). N'interagis JAMAIS avec des propos qu'il aurait exprimés hors de ta présence. Contente-toi d'UNE À DEUX actions courtes qui reflètent tes propres objectifs, puis arrête-toi et attends — n'enchaîne pas indéfiniment.`)
  }

  // NOUVEAU — trop de tours solo d'affilée
  if (sceneDetection.toursSoloConsecutifs >= 2) {
    blocs.push(`Tu as déjà agi seul(e) ${sceneDetection.toursSoloConsecutifs} fois de suite sans réaction du joueur. Termine ce que tu fais en UNE seule phrase courte, puis reste silencieux/immobile en attendant — n'invente plus de nouvelle action ni de nouveau lieu.`)
  }

  if (scene.presents.length > 0) {
    const numeroChapitre = personnage.progression?.chapitreActuel || 1
    // calculerProfilComportemental est importé plus bas dans le fichier réel
    const listePresents = scene.presents
      .map((s) => {
        const profilSecondaire = calculerProfilComportemental(s.traits || [], numeroChapitre)
        const ligneProfil = profilSecondaire.length > 0
          ? `\n  Son propre profil comportemental (à respecter, DIFFÉRENT du tien) : ${profilSecondaire.join(' ')}`
          : ''
        return `- ${s.nom} (${s.role}) : personnalité = "${s.personnalite}" ; lien avec toi = "${s.lienAvecPrincipal}"${ligneProfil}`
      })
      .join('\n')
    let instructionPresents = `PERSONNAGES PRÉSENTS DANS LA SCÈNE :\n${listePresents}\n\nATTENTION : chacun doit parler avec SA PROPRE voix, différente de la tienne.`
    if (sceneDetection.demandeParole) {
      instructionPresents += `\n\nIMPÉRATIF : le joueur demande explicitement qu'un de ces personnages parle. Tu DOIS écrire de VRAIES répliques entre guillemets pour lui — ne te contente PAS de résumer ou narrer.`
    }
    if (scene.presents.length > 1) {
      const nomDernier = scene.presents.find((s) => s.id === sceneDetection.dernierAParle)?.nom
      instructionPresents += nomDernier
        ? `\n\n${nomDernier} vient de parler récemment — privilégie qu'un AUTRE personnage présent réagisse cette fois.`
        : `\n\nVarie qui prend la parole d'un tour à l'autre.`
    }
    blocs.push(instructionPresents)
  }

  if (scene.improvises.length > 0) {
    let instructionImprovises = `RÔLES MENTIONNÉS SANS FICHE DÉFINIE (${scene.improvises.join(', ')}) : improvise-les librement, de façon cohérente avec ton histoire, avec leur propre voix. Improvisation ponctuelle, sans mémoire garantie d'une fois à l'autre.`
    if (sceneDetection.demandeParole) {
      instructionImprovises += `\n\nIMPÉRATIF : le joueur demande explicitement que ce personnage parle. Tu DOIS écrire de VRAIES répliques entre guillemets pour lui.`
    }
    blocs.push(instructionImprovises)
  }

  if (scene.absents.length > 0) {
    blocs.push(`Absents de la scène (ne les fais PAS parler ni apparaître) : ${scene.absents.map((s) => s.nom).join(', ')}`)
  }
  if (scene.objets.length > 0) {
    blocs.push(`Objets présents : ${scene.objets.join(', ')}`)
  }
  if (scene.evenementsEnAttente.length > 0) {
    blocs.push(`Événements en attente : ${scene.evenementsEnAttente.join(', ')}`)
  }
  if (scene.sceneActuelle) {
    blocs.push(`Description libre de la scène en cours : ${scene.sceneActuelle}`)
  }

  if (blocs.length === 0) return ''

  return `\n\n[CONTEXTE DE SCÈNE ACTUEL :\n${blocs.join('\n\n')}\n]`
}