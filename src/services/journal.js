const CLE_JOURNAL = 'yuna-journal'

export const HUMEURS = [
  { id: 'super', emoji: '😄', label: 'Super' },
  { id: 'bien', emoji: '🙂', label: 'Bien' },
  { id: 'neutre', emoji: '😐', label: 'Neutre' },
  { id: 'difficile', emoji: '😔', label: 'Difficile' },
  { id: 'dur', emoji: '😢', label: 'Dur' },
]

export function chargerEntreesJournal() {
  const donnees = localStorage.getItem(CLE_JOURNAL)
  return donnees ? JSON.parse(donnees) : []
}

export function obtenirEntreeDuJour(dateStr) {
  return chargerEntreesJournal().find((e) => e.date === dateStr) || null
}

export function sauvegarderEntreeJournal(entree) {
  const entrees = chargerEntreesJournal()
  const index = entrees.findIndex((e) => e.date === entree.date)
  if (index !== -1) entrees[index] = entree
  else entrees.unshift(entree)
  localStorage.setItem(CLE_JOURNAL, JSON.stringify(entrees))
  return entrees
}

export function supprimerEntreeJournal(date) {
  const entrees = chargerEntreesJournal().filter((e) => e.date !== date)
  localStorage.setItem(CLE_JOURNAL, JSON.stringify(entrees))
  return entrees
}