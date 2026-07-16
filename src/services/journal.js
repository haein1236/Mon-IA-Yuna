// ============================================================
// SERVICE JOURNAL
// Persiste TOUT le tableau d'entrées d'un coup — plus simple que
// des fonctions dédiées, puisque le composant JournalScreen gère
// déjà sa propre logique de fusion/mise à jour des entrées en state.
// ============================================================
const CLE_JOURNAL = 'yuna-journal'

export function chargerEntreesJournal() {
  const donnees = localStorage.getItem(CLE_JOURNAL)
  return donnees ? JSON.parse(donnees) : []
}

export function sauvegarderEntreesJournal(entrees) {
  localStorage.setItem(CLE_JOURNAL, JSON.stringify(entrees))
}