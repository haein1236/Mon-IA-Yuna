import { supabase } from './supabase'

const CLE_LOCALISATION = 'yuna-derniere-position'
const CLE_HISTORIQUE = 'yuna-historique-positions'
const CLE_LIEUX_FAVORIS = 'yuna-lieux-favoris'

export function chargerDernierePosition() {
  const donnees = localStorage.getItem(CLE_LOCALISATION)
  return donnees ? JSON.parse(donnees) : null
}

export function sauvegarderPosition(position) {
  localStorage.setItem(CLE_LOCALISATION, JSON.stringify(position))
  // Garde aussi une trace dans l'historique (50 dernières positions
  // max, pour ne pas faire grossir le localStorage indéfiniment)
  const historique = chargerHistoriquePositions()
  historique.unshift(position)
  localStorage.setItem(CLE_HISTORIQUE, JSON.stringify(historique.slice(0, 50)))
}

export function chargerHistoriquePositions() {
  const donnees = localStorage.getItem(CLE_HISTORIQUE)
  return donnees ? JSON.parse(donnees) : []
}

// ============================================================
// LIEUX FAVORIS (maison, travail, etc.) — enregistrés localement,
// utiles pour calculer une distance ou lancer un itinéraire rapide
// ============================================================
export function chargerLieuxFavoris() {
  const donnees = localStorage.getItem(CLE_LIEUX_FAVORIS)
  return donnees ? JSON.parse(donnees) : []
}

export function sauvegarderLieuFavori(lieu) {
  const lieux = chargerLieuxFavoris()
  lieux.unshift({ id: Date.now(), ...lieu })
  localStorage.setItem(CLE_LIEUX_FAVORIS, JSON.stringify(lieux))
  return lieux
}

export function supprimerLieuFavori(id) {
  const lieux = chargerLieuxFavoris().filter((l) => l.id !== id)
  localStorage.setItem(CLE_LIEUX_FAVORIS, JSON.stringify(lieux))
  return lieux
}

// ============================================================
// AJOUT — renommer un lieu favori existant (utilisé par le bouton
// "modifier" dans l'interface). N'affecte aucune fonction existante.
// ============================================================
export function modifierLieuFavori(id, nouveauNom) {
  const lieux = chargerLieuxFavoris().map((l) =>
    l.id === id ? { ...l, nom: nouveauNom } : l
  )
  localStorage.setItem(CLE_LIEUX_FAVORIS, JSON.stringify(lieux))
  return lieux
}

// ============================================================
// DISTANCE ENTRE DEUX POINTS (formule de Haversine) — renvoie des km
// ============================================================
export function calculerDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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
        // km/h si dispo (souvent null à l'arrêt ou sur desktop)
        vitesse: pos.coords.speed != null ? Math.round(pos.coords.speed * 3.6) : null,
        altitude: pos.coords.altitude != null ? Math.round(pos.coords.altitude) : null,
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



// ... garde toutes les fonctions déjà existantes (chargerDernierePosition, obtenirPositionActuelle, obtenirAdresseApprox) ...

// ⬅️ NOUVEAU : publie ta position sur Supabase (visible par tes amis acceptés)
export async function publierPositionPartagee(position, partageActif = true) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('positions_partagees').upsert({
    user_id: user.id, latitude: position.latitude, longitude: position.longitude,
    precision_m: position.precision, partage_actif: partageActif, mis_a_jour_le: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

// ⬅️ NOUVEAU : récupère les positions de tes amis (RLS filtre déjà
// automatiquement — tu ne reçois QUE celles des amis acceptés)
export async function chargerPositionsAmis() {
  const { data } = await supabase
    .from('positions_partagees')
    .select('user_id, latitude, longitude, mis_a_jour_le, profils_publics(pseudo)')
    .eq('partage_actif', true)
  const { data: { user } } = await supabase.auth.getUser()
  return (data || []).filter((p) => p.user_id !== user.id)
}

export async function definirPartageActif(actif) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('positions_partagees').update({ partage_actif: actif }).eq('user_id', user.id)
}