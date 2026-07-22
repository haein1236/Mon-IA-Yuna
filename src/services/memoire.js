// ============================================================
// SERVICE MÉMOIRE — YUNA
// Fine couche au-dessus du moteur générique (moteurMemoire.js),
// avec l'espace 'yuna'. Les fonctions exportées ici gardent
// exactement la même signature qu'avant pour ne rien casser dans
// MemoireScreen.jsx ni gemini.js.
// ============================================================

import {
  chargerMemoire,
  ajouterSouvenir,
  supprimerSouvenir,
  modifierSouvenir,
  oublierSouvenirsExpires,
  obtenirSouvenirsPourPrompt,
  effacerMemoire as effacerMemoireGenerique,
} from './memoire/moteurMemoire'

const ESPACE = 'yuna'

// Ancienne API : renvoyait un simple tableau de strings.
// On la reconstruit à partir de tous les niveaux, pour ne rien casser
// dans MemoireScreen.jsx qui affiche `faits.map((fait, index) => ...)`.
export function chargerFaits() {
  oublierSouvenirsExpires(ESPACE)
  return obtenirSouvenirsPourPrompt(ESPACE)
}

// Ancienne API : ajoutait des faits bruts. On les range dans "recente"
// par défaut.
export function ajouterFaits(nouveauxFaits) {
  ajouterSouvenir(ESPACE, 'recente', nouveauxFaits)
}

export function supprimerFait(fait) {
  // Cherche le niveau réel qui contient ce texte pour le supprimer au bon endroit
  const memoire = chargerMemoire(ESPACE)
  for (const niveau of Object.keys(memoire)) {
    if (memoire[niveau].some((s) => s.texte === fait)) {
      supprimerSouvenir(ESPACE, niveau, fait)
      break
    }
  }
  return chargerFaits()
}

export function modifierFait(index, nouveauTexte) {
  // L'ancienne API travaillait par index sur un tableau plat. On retrouve
  // le niveau et l'index réel correspondant à cet index "plat".
  const memoire = chargerMemoire(ESPACE)
  let compteur = 0
  for (const niveau of Object.keys(memoire)) {
    for (let i = 0; i < memoire[niveau].length; i++) {
      if (compteur === index) {
        modifierSouvenir(ESPACE, niveau, i, nouveauTexte)
        return chargerFaits()
      }
      compteur++
    }
  }
  return chargerFaits()
}

export function effacerMemoire() {
  effacerMemoireGenerique(ESPACE)
}

// Nouvelle fonction optionnelle : permet d'ajouter directement
// un souvenir dans un niveau spécifique ('ancrage', 'a_long_terme', 'recente', etc.)
export function ajouterSouvenirNiveau(niveau, items) {
  return ajouterSouvenir(ESPACE, niveau, items)
}