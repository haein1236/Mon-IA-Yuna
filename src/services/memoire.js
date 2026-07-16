// ============================================================
// SERVICE MÉMOIRE
// Stocke des "faits marquants" extraits automatiquement des
// conversations passées (ex: "prépare un examen", "aime les chats"),
// pour que Yuna puisse s'en souvenir d'une conversation à l'autre —
// une mémoire à long terme simple, gardée uniquement dans ce navigateur.
// ============================================================

const CLE_MEMOIRE = 'yuna-memoire-faits'
const NOMBRE_MAX_FAITS = 25 // au-delà, les plus anciens sont oubliés

// Charge la liste des faits mémorisés (tableau de phrases courtes)
export function chargerFaits() {
  const donneesBrutes = localStorage.getItem(CLE_MEMOIRE)
  if (!donneesBrutes) return []
  return JSON.parse(donneesBrutes)
}

// Ajoute de nouveaux faits à la mémoire, en évitant les doublons exacts,
// et en gardant seulement les NOMBRE_MAX_FAITS plus récents
export function ajouterFaits(nouveauxFaits) {
  if (!nouveauxFaits || nouveauxFaits.length === 0) return

  const faitsExistants = chargerFaits()
  const faitsUniques = nouveauxFaits.filter((f) => !faitsExistants.includes(f))

  // slice(-N) garde les N DERNIERS éléments du tableau (les plus récents)
  const faitsMisAJour = [...faitsExistants, ...faitsUniques].slice(-NOMBRE_MAX_FAITS)

  localStorage.setItem(CLE_MEMOIRE, JSON.stringify(faitsMisAJour))
}

// Supprime un fait précis — utile si tu veux "corriger" un souvenir erroné
export function supprimerFait(fait) {
  const faitsRestants = chargerFaits().filter((f) => f !== fait)
  localStorage.setItem(CLE_MEMOIRE, JSON.stringify(faitsRestants))
}

// Efface toute la mémoire (déjà couvert automatiquement par le bouton
// "Tout réinitialiser" des Paramètres, car la clé commence par "yuna-")
export function effacerMemoire() {
  localStorage.removeItem(CLE_MEMOIRE)
}

// Modifie un fait existant (par son index dans le tableau)
export function modifierFait(index, nouveauTexte) {
  const faits = chargerFaits()
  if (index < 0 || index >= faits.length) return faits
  faits[index] = nouveauTexte
  localStorage.setItem(CLE_MEMOIRE, JSON.stringify(faits))
  return faits
}