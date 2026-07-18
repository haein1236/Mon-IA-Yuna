// ============================================================
// SERVICE ALBUMS
// Gère les albums personnalisés de la galerie. Volontairement
// indépendant de services/images.js : un album ne stocke que des
// références (id) vers des photos, jamais les photos elles-mêmes.
// Ça évite toute duplication de données et tout risque de casser
// le service images existant.
// ============================================================

const CLE_ALBUMS = 'yuna-albums'

const COULEURS_ALBUMS = ['#C4688A', '#8B6FA8', '#4A6B94', '#6B8F5E', '#C4917A', '#B46A72']

export function chargerAlbums() {
  const donnees = localStorage.getItem(CLE_ALBUMS)
  return donnees ? JSON.parse(donnees) : []
}

function sauvegarder(albums) {
  localStorage.setItem(CLE_ALBUMS, JSON.stringify(albums))
  return albums
}

export function creerAlbum(nom) {
  const albums = chargerAlbums()
  const nouvelAlbum = {
    id: `album-${Date.now()}`,
    nom: nom.trim(),
    couleur: COULEURS_ALBUMS[albums.length % COULEURS_ALBUMS.length],
    photoIds: [],
  }
  albums.unshift(nouvelAlbum)
  return sauvegarder(albums)
}

export function supprimerAlbum(albumId) {
  return sauvegarder(chargerAlbums().filter((a) => a.id !== albumId))
}

export function renommerAlbum(albumId, nouveauNom) {
  const albums = chargerAlbums().map((a) => a.id === albumId ? { ...a, nom: nouveauNom.trim() } : a)
  return sauvegarder(albums)
}

export function togglePhotoDansAlbum(albumId, photoId) {
  const albums = chargerAlbums().map((a) => {
    if (a.id !== albumId) return a
    const dejaPresente = a.photoIds.includes(photoId)
    return { ...a, photoIds: dejaPresente ? a.photoIds.filter((id) => id !== photoId) : [...a.photoIds, photoId] }
  })
  return sauvegarder(albums)
}

export function retirerPhotoDeTousLesAlbums(photoId) {
  const albums = chargerAlbums().map((a) => ({ ...a, photoIds: a.photoIds.filter((id) => id !== photoId) }))
  return sauvegarder(albums)
}