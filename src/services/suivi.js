// ============================================================
// SUIVI D'ACTIVITÉ
// Enregistre la dernière fois où l'utilisateur a visité l'app dans
// son ensemble, ainsi que certaines pages précises (Journal, Galerie)
// — sert de base à l'accueil intelligent de Yuna.
// ============================================================
const CLE_SUIVI = 'yuna-suivi-activite'

export function chargerSuivi() {
  const donnees = localStorage.getItem(CLE_SUIVI)
  return donnees ? JSON.parse(donnees) : {}
}

export function enregistrerVisite(cle) {
  const suivi = chargerSuivi()
  suivi[cle] = new Date().toISOString()
  localStorage.setItem(CLE_SUIVI, JSON.stringify(suivi))
}

// Retourne le nombre de jours écoulés depuis une date ISO donnée.
// Infinity si aucune date n'a jamais été enregistrée (première visite)
export function joursDepuis(dateISO) {
  if (!dateISO) return Infinity
  const diffMs = Date.now() - new Date(dateISO).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}