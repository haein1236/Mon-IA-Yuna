const CLE_IMAGES = 'yuna-galerie-images'

// ============================================================
// RÉACTIONS DISPONIBLES sur une image (comme des emojis Facebook)
// ============================================================
export const REACTIONS_DISPONIBLES = ['❤️', '😍', '😂', '👍', '✨']

export function chargerImages() {
  const donnees = localStorage.getItem(CLE_IMAGES)
  if (!donnees) return []
  return JSON.parse(donnees)
}

export function sauvegarderImage(image) {
  const images = chargerImages()
  images.unshift(image)
  localStorage.setItem(CLE_IMAGES, JSON.stringify(images))
}

export function supprimerImage(id) {
  const images = chargerImages()
  const imagesFiltrees = images.filter((img) => img.id !== id)
  localStorage.setItem(CLE_IMAGES, JSON.stringify(imagesFiltrees))
}

export function toggleFavoriImage(id) {
  const images = chargerImages()
  const maj = images.map((img) =>
    img.id === id ? { ...img, favori: !img.favori } : img
  )
  localStorage.setItem(CLE_IMAGES, JSON.stringify(maj))
  return maj
}

export function fichierVersBase64(fichier) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onload = () => resolve(lecteur.result)
    lecteur.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    lecteur.readAsDataURL(fichier)
  })
}

export function genererUrlImageIA(description) {
  const descriptionEncodee = encodeURIComponent(description)
  return `https://image.pollinations.ai/prompt/${descriptionEncodee}?width=512&height=512&nologo=true`
}

export function ajouterCommentaireImage(id, commentaire) {
  const images = chargerImages()
  const imagesMaj = images.map((img) =>
    img.id === id ? { ...img, commentairePerso: commentaire } : img
  )
  localStorage.setItem(CLE_IMAGES, JSON.stringify(imagesMaj))
  return imagesMaj
}

// ============================================================
// BASCULER UNE RÉACTION SUR UNE IMAGE
// "reactions" est stocké comme un tableau d'emojis actifs sur cette
// image (ex: ['❤️', '✨']). Toucher un emoji déjà actif le retire
// (comme un like Facebook qu'on retire en re-cliquant).
// ============================================================
export function toggleReactionImage(id, emoji) {
  const images = chargerImages()
  const imagesMaj = images.map((img) => {
    if (img.id !== id) return img
    const reactionsActuelles = img.reactions || []
    const dejaActive = reactionsActuelles.includes(emoji)
    return {
      ...img,
      reactions: dejaActive
        ? reactionsActuelles.filter((r) => r !== emoji)
        : [...reactionsActuelles, emoji],
    }
  })
  localStorage.setItem(CLE_IMAGES, JSON.stringify(imagesMaj))
  return imagesMaj
}