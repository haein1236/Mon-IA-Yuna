// ============================================================
// MOTEUR DE MÉMOIRE — YUNA (stockage localStorage dédié)
// Fine couche de stockage au-dessus de la logique pure de utilsNiveaux.js.
// ============================================================

import {
  structureMemoireVide,
  completerStructure,
  fusionnerNiveau,
  supprimerDeNiveau,
  modifierDansNiveau,
  filtrerExpires,
  extraireTextesPourPrompt,
  NIVEAUX_VALIDES,
} from './utilsNiveaux'

const PREFIXE_CLE = 'yuna-memoire'

function cleStockage(espace) {
  return `${PREFIXE_CLE}-${espace}`
}

export function chargerMemoire(espace) {
  const donneesBrutes = localStorage.getItem(cleStockage(espace))
  if (!donneesBrutes) return structureMemoireVide()
  return completerStructure(JSON.parse(donneesBrutes))
}

function sauvegarderMemoire(espace, memoire) {
  localStorage.setItem(cleStockage(espace), JSON.stringify(memoire))
}

export function ajouterSouvenir(espace, niveau, items) {
  const memoire = fusionnerNiveau(chargerMemoire(espace), niveau, items)
  sauvegarderMemoire(espace, memoire)
  return memoire
}

export function supprimerSouvenir(espace, niveau, texte) {
  const memoire = supprimerDeNiveau(chargerMemoire(espace), niveau, texte)
  sauvegarderMemoire(espace, memoire)
  return memoire
}

export function modifierSouvenir(espace, niveau, index, nouveauTexte) {
  const memoire = modifierDansNiveau(chargerMemoire(espace), niveau, index, nouveauTexte)
  sauvegarderMemoire(espace, memoire)
  return memoire
}

export function oublierSouvenirsExpires(espace) {
  const memoire = filtrerExpires(chargerMemoire(espace))
  sauvegarderMemoire(espace, memoire)
  return memoire
}

export function obtenirSouvenirsPourPrompt(espace, niveauxInclus = NIVEAUX_VALIDES) {
  return extraireTextesPourPrompt(chargerMemoire(espace), niveauxInclus)
}

export function effacerMemoire(espace) {
  localStorage.removeItem(cleStockage(espace))
}

export { NIVEAUX_VALIDES }