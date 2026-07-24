import { supabase } from './supabase'

// ============================================================
// "MA CARTE DE VIE" — service de localisation 100% PERSONNEL
// Aucune notion d'amis, de partage ou de positions_partagees ici.
// LocalStorage = source de vérité pour l'affichage instantané.
// Supabase = sauvegarde en arrière-plan, best-effort (jamais bloquant,
// jamais d'erreur remontée à l'UI si l'utilisateur n'est pas connecté
// ou est hors-ligne).
// ============================================================

const CLE_LOCALISATION = 'yuna-derniere-position'
const CLE_HISTORIQUE = 'yuna-historique-positions'
const CLE_LIEUX_FAVORIS = 'yuna-lieux-favoris'
const CLE_SOUVENIRS = 'yuna-souvenirs-lieux'

// Nombre de positions gardées en historique local. On monte à 300
// (au lieu de 50 avant) car l'historique sert maintenant à calculer
// les trajets du jour et les statistiques, pas juste à afficher une liste.
const TAILLE_MAX_HISTORIQUE = 300

// ============================================================
// 1) POSITION ACTUELLE
// ============================================================
export function chargerDernierePosition() {
  const donnees = localStorage.getItem(CLE_LOCALISATION)
  return donnees ? JSON.parse(donnees) : null
}

export function sauvegarderPosition(position) {
  localStorage.setItem(CLE_LOCALISATION, JSON.stringify(position))

  const historique = chargerHistoriquePositions()
  historique.unshift(position)
  localStorage.setItem(CLE_HISTORIQUE, JSON.stringify(historique.slice(0, TAILLE_MAX_HISTORIQUE)))

  synchroniserPositionSupabase(position)
}

export function chargerHistoriquePositions() {
  const donnees = localStorage.getItem(CLE_HISTORIQUE)
  return donnees ? JSON.parse(donnees) : []
}

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

// Reverse geocoding via Nominatim (OpenStreetMap) — gratuit, aucune clé requise.
// Échoue silencieusement : la position reste affichée même sans adresse lisible.
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

// ============================================================
// 2) LIEUX FAVORIS (avec emoji personnalisé)
// ============================================================
export function chargerLieuxFavoris() {
  const donnees = localStorage.getItem(CLE_LIEUX_FAVORIS)
  return donnees ? JSON.parse(donnees) : []
}

// lieu attendu : { nom, emoji, latitude, longitude }
export function sauvegarderLieuFavori(lieu) {
  const lieux = chargerLieuxFavoris()
  const nouveauLieu = {
    id: Date.now(),
    emoji: lieu.emoji || '📍',
    dateCreation: new Date().toISOString(),
    ...lieu,
  }
  const maj = [nouveauLieu, ...lieux]
  localStorage.setItem(CLE_LIEUX_FAVORIS, JSON.stringify(maj))
  synchroniserLieuFavoriSupabase(nouveauLieu)
  return maj
}

export function supprimerLieuFavori(id) {
  const lieux = chargerLieuxFavoris().filter((l) => l.id !== id)
  localStorage.setItem(CLE_LIEUX_FAVORIS, JSON.stringify(lieux))
  supprimerLieuFavoriSupabase(id)
  return lieux
}

// updates peut contenir { nom, emoji }
export function modifierLieuFavori(id, updates) {
  const lieux = chargerLieuxFavoris().map((l) => (l.id === id ? { ...l, ...updates } : l))
  localStorage.setItem(CLE_LIEUX_FAVORIS, JSON.stringify(lieux))
  return lieux
}

// ============================================================
// 3) DISTANCE ENTRE DEUX POINTS (formule de Haversine) — renvoie des km
// ============================================================
export function calculerDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Retourne le lieu favori le plus proche d'une position si celui-ci
// est à moins de `seuilMetres` (150m par défaut), sinon null.
export function detecterLieuProche(position, lieuxFavoris, seuilMetres = 150) {
  if (!position || !lieuxFavoris?.length) return null
  let plusProche = null
  let distanceMin = Infinity
  for (const lieu of lieuxFavoris) {
    const distanceKm = calculerDistanceKm(position.latitude, position.longitude, lieu.latitude, lieu.longitude)
    if (distanceKm * 1000 <= seuilMetres && distanceKm < distanceMin) {
      distanceMin = distanceKm
      plusProche = lieu
    }
  }
  return plusProche
}

// ============================================================
// 4) DISTANCE PARCOURUE AUJOURD'HUI
// ============================================================
export function calculerDistanceAujourdHui(historique) {
  const aujourdHui = new Date().toDateString()
  const positionsDuJour = historique
    .filter((p) => new Date(p.date).toDateString() === aujourdHui)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  let total = 0
  for (let i = 1; i < positionsDuJour.length; i++) {
    total += calculerDistanceKm(
      positionsDuJour[i - 1].latitude, positionsDuJour[i - 1].longitude,
      positionsDuJour[i].latitude, positionsDuJour[i].longitude
    )
  }
  return total
}

// ============================================================
// 5) TRAJETS DU JOUR (regroupe l'historique en segments de déplacement)
// ============================================================
function devinerModeDeplacement(vitesseKmh, distanceKm, dureeMin) {
  const vitesseMoyenne = vitesseKmh != null && vitesseKmh > 0
    ? vitesseKmh
    : (dureeMin > 0 ? (distanceKm / (dureeMin / 60)) : 0)

  if (vitesseMoyenne <= 1) return { mode: 'Arrêt', emoji: '🧍' }
  if (vitesseMoyenne <= 7) return { mode: 'Marche', emoji: '🚶' }
  if (vitesseMoyenne <= 13) return { mode: 'Sport', emoji: '🏃' }
  if (vitesseMoyenne <= 30) return { mode: 'Transport', emoji: '🚌' }
  return { mode: 'Voiture', emoji: '🚗' }
}

// Regroupe les positions d'une journée en trajets (départ -> arrivée),
// avec distance, durée, et mode de déplacement deviné selon la vitesse.
// dateReference : Date du jour à analyser (aujourd'hui par défaut)
export function genererTrajetsDuJour(historique, lieuxFavoris = [], dateReference = new Date()) {
  const jourCible = dateReference.toDateString()
  const positions = historique
    .filter((p) => new Date(p.date).toDateString() === jourCible)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (positions.length < 2) return []

  const SEUIL_NOUVEAU_SEGMENT_KM = 0.08 // en dessous de 80m on considère qu'on n'a pas vraiment bougé
  const trajets = []
  let depart = positions[0]

  for (let i = 1; i < positions.length; i++) {
    const arrivee = positions[i]
    const distance = calculerDistanceKm(depart.latitude, depart.longitude, arrivee.latitude, arrivee.longitude)
    if (distance < SEUIL_NOUVEAU_SEGMENT_KM) continue

    const dureeMin = Math.max(1, Math.round((new Date(arrivee.date) - new Date(depart.date)) / 60000))
    const { mode, emoji } = devinerModeDeplacement(arrivee.vitesse, distance, dureeMin)
    const lieuDepart = detecterLieuProche(depart, lieuxFavoris)
    const lieuArrivee = detecterLieuProche(arrivee, lieuxFavoris)

    trajets.push({
      id: `${depart.date}__${arrivee.date}`,
      lieuDepart: lieuDepart?.nom || null,
      emojiDepart: lieuDepart?.emoji || '📍',
      lieuArrivee: lieuArrivee?.nom || null,
      emojiArrivee: lieuArrivee?.emoji || '📍',
      distanceKm: distance,
      dureeMin,
      mode,
      emojiMode: emoji,
      heureDepart: depart.date,
      heureArrivee: arrivee.date,
    })
    depart = arrivee
  }

  return trajets
}

// ============================================================
// 6) SOUVENIRS PAR LIEU (photo, note, humeur)
// Local-first : toujours lisible/écrivable même hors-ligne.
// Synchronisé vers Supabase en best-effort si l'utilisateur est connecté.
// ============================================================
export function chargerSouvenirsLocaux() {
  const donnees = localStorage.getItem(CLE_SOUVENIRS)
  return donnees ? JSON.parse(donnees) : []
}

function sauvegarderSouvenirsLocaux(liste) {
  localStorage.setItem(CLE_SOUVENIRS, JSON.stringify(liste))
}

// Rafraîchit le cache local avec les souvenirs Supabase (à appeler une
// fois au montage de l'écran, en arrière-plan). Ne jette jamais d'erreur.
export async function synchroniserSouvenirsDepuisSupabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return chargerSouvenirsLocaux()
    const { data, error } = await supabase
      .from('souvenirs_lieux')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    if (data?.length) sauvegarderSouvenirsLocaux(data)
    return chargerSouvenirsLocaux()
  } catch (erreur) {
    console.error('Sync souvenirs Supabase impossible, cache local utilisé :', erreur.message)
    return chargerSouvenirsLocaux()
  }
}

// souvenir attendu : { lieuId, texte, photo (base64|null), humeur }
export function ajouterSouvenir({ lieuId, texte, photo, humeur }) {
  const nouveauSouvenir = {
    id: Date.now(),
    lieu_id: lieuId,
    texte: texte || '',
    photo: photo || null,
    humeur: humeur || null,
    created_at: new Date().toISOString(),
  }
  const liste = [nouveauSouvenir, ...chargerSouvenirsLocaux()]
  sauvegarderSouvenirsLocaux(liste)
  synchroniserNouveauSouvenirSupabase(nouveauSouvenir)
  return liste
}

export function supprimerSouvenir(id) {
  const liste = chargerSouvenirsLocaux().filter((s) => s.id !== id)
  sauvegarderSouvenirsLocaux(liste)
  supprimerSouvenirSupabase(id)
  return liste
}

// ============================================================
// 7) STATISTIQUES PERSONNELLES
// ============================================================
export function calculerStatistiques(historique, lieuxFavoris, souvenirs = []) {
  if (!historique?.length) {
    return {
      distanceTotaleKm: 0,
      nombreLieuxVisites: 0,
      lieuLePlusFrequente: null,
      visitesLieuPlusFrequente: 0,
      nombreJoursActifs: 0,
      nombreSouvenirs: souvenirs.length,
    }
  }

  const trie = [...historique].sort((a, b) => new Date(a.date) - new Date(b.date))
  let distanceTotale = 0
  for (let i = 1; i < trie.length; i++) {
    distanceTotale += calculerDistanceKm(
      trie[i - 1].latitude, trie[i - 1].longitude,
      trie[i].latitude, trie[i].longitude
    )
  }

  const joursActifs = new Set(historique.map((p) => new Date(p.date).toDateString()))

  const compteurVisites = {}
  historique.forEach((p) => {
    const lieu = detecterLieuProche(p, lieuxFavoris, 150)
    if (lieu) compteurVisites[lieu.id] = (compteurVisites[lieu.id] || 0) + 1
  })

  let lieuLePlusFrequente = null
  let maxVisites = 0
  Object.entries(compteurVisites).forEach(([id, count]) => {
    if (count > maxVisites) {
      maxVisites = count
      lieuLePlusFrequente = lieuxFavoris.find((l) => String(l.id) === id) || null
    }
  })

  return {
    distanceTotaleKm: distanceTotale,
    nombreLieuxVisites: Object.keys(compteurVisites).length,
    lieuLePlusFrequente,
    visitesLieuPlusFrequente: maxVisites,
    nombreJoursActifs: joursActifs.size,
    nombreSouvenirs: souvenirs.length,
  }
}

// ============================================================
// SYNCHRONISATION SUPABASE — best-effort, jamais bloquant pour l'UI.
// Si l'utilisateur n'est pas connecté ou est hors-ligne, ces fonctions
// échouent silencieusement (log console uniquement) : localStorage
// reste toujours la source affichée à l'écran.
// ============================================================
async function synchroniserPositionSupabase(position) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('positions_personnelles').insert({
      user_id: user.id,
      latitude: position.latitude,
      longitude: position.longitude,
      precision: position.precision,
      adresse: position.adresse || null,
    })
  } catch (erreur) {
    console.error('Sync position Supabase échouée (position gardée en local) :', erreur.message)
  }
}

async function synchroniserLieuFavoriSupabase(lieu) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('lieux_favoris').insert({
      user_id: user.id,
      nom: lieu.nom,
      emoji: lieu.emoji,
      latitude: lieu.latitude,
      longitude: lieu.longitude,
    })
  } catch (erreur) {
    console.error('Sync lieu favori Supabase échouée (lieu gardé en local) :', erreur.message)
  }
}

async function supprimerLieuFavoriSupabase(id) {
  try {
    // Remarque : si l'app fonctionne hors-ligne, l'id local (timestamp)
    // ne correspond pas forcément à l'id Supabase (uuid). Cette suppression
    // ne fait donc effet que sur les lieux déjà synchronisés avec cet id.
    await supabase.from('lieux_favoris').delete().eq('id', id)
  } catch (erreur) {
    console.error('Suppression lieu favori Supabase échouée :', erreur.message)
  }
}

async function synchroniserNouveauSouvenirSupabase(souvenir) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('souvenirs_lieux').insert({
      user_id: user.id,
      lieu_id: souvenir.lieu_id,
      texte: souvenir.texte,
      photo: souvenir.photo,
      humeur: souvenir.humeur,
    })
  } catch (erreur) {
    console.error('Sync souvenir Supabase échouée (souvenir gardé en local) :', erreur.message)
  }
}

async function supprimerSouvenirSupabase(id) {
  try {
    await supabase.from('souvenirs_lieux').delete().eq('id', id)
  } catch (erreur) {
    console.error('Suppression souvenir Supabase échouée :', erreur.message)
  }
}