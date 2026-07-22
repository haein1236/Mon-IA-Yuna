// ============================================================
// MOTEUR DE SCÈNE — v4
// v1 : présence des personnages secondaires nommés
// v2 : lieu, objets, événements en attente, variété de prise de parole
// v3 : stockage par personnage (perf)
// v4 : rôles génériques improvisés ("mon frère", "ma sœur"...) sans
//      besoin de les avoir créés à l'avance dans la fiche du personnage
// ============================================================

import { calculerProfilComportemental } from '../personnages'

const PREFIXE_CLE_SCENE = 'yuna-scene-active'
const TOURS_PRESENCE_PAR_DEFAUT = 4
const TOURS_PRESENCE_IMPROVISE = 2 // les rôles improvisés restent moins longtemps — plus volatils, pas une vraie fiche

function normaliserTexte(texte) {
  return texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function cleScene(personnageId) {
  return `${PREFIXE_CLE_SCENE}-${personnageId}`
}

function chargerScene(personnageId) {
  const donnees = localStorage.getItem(cleScene(personnageId))
  return donnees ? JSON.parse(donnees) : { presents: {}, rolesImprovises: {}, dernierAParle: null }
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

// ============================================================
// RÔLES GÉNÉRIQUES — détectés même sans fiche personnage secondaire.
// Si le rôle correspond à un personnage secondaire DÉJÀ nommé dans la
// fiche (ex: le rôle "frère" existe déjà pour Sami), on ne l'improvise
// pas — on laisse le système normal gérer Sami.
// ============================================================
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

/**
 * Met à jour la scène : présence des personnages nommés ET des rôles
 * improvisés. Renvoie { nommes: [...objets complets], improvises: [...noms de rôles] }
 */
export function mettreAJourScene(personnage, messageUtilisateur, dernierMessagePersonnage = '') {
  const scene = chargerScene(personnage.id)
  if (!scene.rolesImprovises) scene.rolesImprovises = {}

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

  sauvegarderScene(personnage.id, scene)

  const secondaires = personnage.personnagesSecondaires || []
  const nommes = Object.keys(scene.presents).map((id) => secondaires.find((s) => s.id === id)).filter(Boolean)
  const improvises = Object.keys(scene.rolesImprovises)

  return { nommes, improvises }
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

export function construireObjetScene(personnage, sceneDetection) {
  const { nommes, improvises } = sceneDetection
  const secondaires = personnage.personnagesSecondaires || []
  const idsPresents = new Set(nommes.map((s) => s.id))
  const absents = secondaires.filter((s) => !idsPresents.has(s.id))

  return {
    lieu: personnage.lieuTemps?.lieuActuel || null,
    objets: personnage.lieuTemps?.objetsPresents || [],
    ambiance: personnage.lieuTemps?.ambianceActuelle || null,
    sceneActuelle: personnage.progression?.sceneActuelle || null,
    evenementsEnAttente: personnage.progression?.evenementsDebloques || [],
    presents: nommes,
    improvises,
    absents,
  }
}

export function construireInstructionScene(personnage, sceneDetection) {
  const scene = construireObjetScene(personnage, sceneDetection)
  const dernierAParle = chargerScene(personnage.id).dernierAParle

  const rienASignaler = scene.presents.length === 0 && scene.improvises.length === 0
    && scene.objets.length === 0 && !scene.sceneActuelle && scene.evenementsEnAttente.length === 0
  if (rienASignaler) return ''

  const blocs = []

  if (scene.presents.length > 0) {
    const numeroChapitre = personnage.progression?.chapitreActuel || 1
    const listePresents = scene.presents
      .map((s) => {
        const profilSecondaire = calculerProfilComportemental(s.traits || [], numeroChapitre)
        const ligneProfil = profilSecondaire.length > 0
          ? `\n  Son propre profil comportemental (à respecter, DIFFÉRENT du tien) : ${profilSecondaire.join(' ')}`
          : ''
        return `- ${s.nom} (${s.role}) : personnalité = "${s.personnalite}" ; lien avec toi = "${s.lienAvecPrincipal}"${ligneProfil}`
      })
      .join('\n')
    blocs.push(`PERSONNAGES PRÉSENTS DANS LA SCÈNE :\n${listePresents}\n\nATTENTION : chacun de ces personnages doit parler avec SA PROPRE voix — vocabulaire, ton, rythme, comportement différents des tiens et différents des autres personnages présents. Ne recopie pas ton propre style pour eux.`)

    if (scene.presents.length > 1) {
      const nomDernier = scene.presents.find((s) => s.id === dernierAParle)?.nom
      blocs.push(
        nomDernier
          ? `Plusieurs personnages sont présents. ${nomDernier} vient de parler récemment — privilégie qu'un AUTRE personnage présent réagisse cette fois.`
          : `Plusieurs personnages sont présents. Varie qui prend la parole d'un tour à l'autre.`
      )
    }
  }

  if (scene.improvises.length > 0) {
    blocs.push(`RÔLES MENTIONNÉS SANS FICHE DÉFINIE (${scene.improvises.join(', ')}) : le joueur ou toi avez évoqué ce type de personnage sans qu'il existe formellement dans l'histoire. Tu peux l'improviser librement, de façon cohérente avec ton propre passé et ton histoire (ex: si on parle de "ton frère", invente-lui une personnalité crédible avec votre lien). Fais-le parler si le moment s'y prête, avec sa propre voix, différente de la tienne. C'est une improvisation ponctuelle — elle n'a pas de mémoire garantie d'une conversation à l'autre.`)
  }

  if (scene.absents.length > 0) {
    blocs.push(`Absents de la scène actuelle (ne les fais PAS parler ni apparaître) : ${scene.absents.map((s) => s.nom).join(', ')}`)
  }
  if (scene.objets.length > 0) {
    blocs.push(`Objets présents dans la scène : ${scene.objets.join(', ')}`)
  }
  if (scene.evenementsEnAttente.length > 0) {
    blocs.push(`Événements en attente : ${scene.evenementsEnAttente.join(', ')}`)
  }
  if (scene.sceneActuelle) {
    blocs.push(`Description libre de la scène en cours : ${scene.sceneActuelle}`)
  }

  return `\n\n[CONTEXTE DE SCÈNE ACTUEL :\n${blocs.join('\n\n')}\n]`
}