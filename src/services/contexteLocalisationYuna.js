import {
  chargerHistoriquePositions,
  chargerLieuxFavoris,
  calculerDistanceAujourdHui,
  calculerDistanceKm,
  detecterLieuProche,
} from './localisation'

// ============================================================
// INTÉGRATION LOCALISATION -> YUNA
// Génère un petit bloc de contexte en français, prêt à être injecté
// dans le system prompt de Yuna (voir ia/promptYuna.js).
// Reste volontairement discret et court : Yuna doit s'en servir avec
// légèreté, jamais réciter ces infos comme une liste de faits.
// Si aucune donnée pertinente n'est disponible, retourne une chaîne vide.
// ============================================================
export function genererContexteLocalisation() {
  const historique = chargerHistoriquePositions()
  const lieuxFavoris = chargerLieuxFavoris()
  if (historique.length === 0) return ''

  const lignes = []
  const derniere = historique[0]
  const lieuActuel = detecterLieuProche(derniere, lieuxFavoris, 150)

  // 1) Distance parcourue aujourd'hui
  const distanceAujourdHui = calculerDistanceAujourdHui(historique)
  if (distanceAujourdHui >= 3) {
    lignes.push(`Elle a beaucoup marché/bougé aujourd'hui (environ ${distanceAujourdHui.toFixed(1)} km).`)
  } else if (distanceAujourdHui >= 1) {
    lignes.push(`Elle a parcouru environ ${distanceAujourdHui.toFixed(1)} km aujourd'hui.`)
  }

  // 2) Position actuelle proche d'un lieu favori
  if (lieuActuel) {
    lignes.push(`Elle se trouve actuellement près de son lieu favori "${lieuActuel.nom}" ${lieuActuel.emoji}.`)
  }

  // 3) Retour dans un lieu favori qu'elle n'a pas visité depuis longtemps
  lieuxFavoris.forEach((lieu) => {
    if (lieuActuel && lieu.id === lieuActuel.id) return // déjà mentionné ci-dessus

    const visites = historique.filter((p) => {
      const distanceM = calculerDistanceKm(p.latitude, p.longitude, lieu.latitude, lieu.longitude) * 1000
      return distanceM <= 150
    })
    if (visites.length === 0) return

    const derniereVisite = visites.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    const joursDepuis = Math.floor((Date.now() - new Date(derniereVisite.date)) / 86400000)
    if (joursDepuis >= 7) {
      lignes.push(`Ça fait environ ${joursDepuis} jours qu'elle n'est pas allée à "${lieu.nom}" ${lieu.emoji}.`)
    }
  })

  if (lignes.length === 0) return ''

  // On limite à 2 informations max pour rester léger dans la conversation
  const lignesRetenues = lignes.slice(0, 2)

  return `\nCONTEXTE DE LOCALISATION (informations récentes sur ses déplacements — à utiliser avec légèreté, jamais comme une liste, uniquement si ça s'intègre naturellement à la conversation, jamais de façon insistante ou intrusive) :\n${lignesRetenues.map((l) => `- ${l}`).join('\n')}\n`
}