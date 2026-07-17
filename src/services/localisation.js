const CLE_LOCALISATION = 'yuna-derniere-position'

export function chargerDernierePosition() {
  const donnees = localStorage.getItem(CLE_LOCALISATION)
  return donnees ? JSON.parse(donnees) : null
}

export function sauvegarderPosition(position) {
  localStorage.setItem(CLE_LOCALISATION, JSON.stringify(position))
}

// ============================================================
// DEMANDE LA POSITION RÉELLE DE L'APPAREIL
// Utilise l'API native du navigateur (gratuite, aucune clé
// nécessaire) — demande une autorisation à l'utilisateur à chaque
// première utilisation par domaine.
// ============================================================
export function obtenirPositionActuelle() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas supportée par ton navigateur."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        precision: Math.round(pos.coords.accuracy),
        date: new Date().toISOString(),
      }),
      (erreur) => {
        let message = "Impossible d'obtenir ta position."
        if (erreur.code === 1) message = "Tu as refusé l'accès à ta position. Autorise-le dans les réglages de ton navigateur pour utiliser cette fonctionnalité."
        if (erreur.code === 2) message = "Ta position n'a pas pu être déterminée pour l'instant."
        if (erreur.code === 3) message = "La demande de localisation a expiré. Réessaie."
        reject(new Error(message))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

// ============================================================
// ADRESSE APPROXIMATIVE (reverse geocoding)
// Utilise Nominatim (OpenStreetMap) — gratuit, aucune clé requise.
// Échoue silencieusement si indisponible : la position reste
// affichée même sans adresse lisible.
// ============================================================
export async function obtenirAdresseApprox(latitude, longitude) {
  try {
    const reponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`
    )
    if (!reponse.ok) throw new Error('geocoding échoué')
    const donnees = await reponse.json()
    return donnees.display_name || null
  } catch {
    return null
  }
}