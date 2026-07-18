// ============================================================
// SERVICE JOURNAL
// Persiste TOUT le tableau d'entrées d'un coup — plus simple que
// des fonctions dédiées, puisque le composant JournalScreen gère
// déjà sa propre logique de fusion/mise à jour des entrées en state.
// ============================================================
const CLE_JOURNAL = 'yuna-journal'

// ============================================================
// HUMEURS DISPONIBLES — source unique de vérité. Utilisée à la fois
// par JournalScreen.jsx (sélecteur d'humeur, calendrier, stats) et
// GalleryScreen.jsx (lien "ce jour-là dans ton journal"), pour que
// les deux écrans ne puissent jamais diverger sur la liste des
// humeurs disponibles.
// ============================================================
export const HUMEURS = [
  { id: 'radieuse', emoji: '✨', label: 'Radieuse' },
  { id: 'bien', emoji: '🙂', label: 'Bien' },
  { id: 'sereine', emoji: '😌', label: 'Sereine' },
  { id: 'fatiguee', emoji: '😴', label: 'Fatiguée' },
  { id: 'stressee', emoji: '😰', label: 'Stressée' },
  { id: 'triste', emoji: '😔', label: 'Triste' },
]

export function chargerEntreesJournal() {
  const donnees = localStorage.getItem(CLE_JOURNAL)
  return donnees ? JSON.parse(donnees) : []
}

export function sauvegarderEntreesJournal(entrees) {
  localStorage.setItem(CLE_JOURNAL, JSON.stringify(entrees))
}