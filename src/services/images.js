import { retirerPhotoDeTousLesAlbums } from './albums'

const CLE_IMAGES = 'yuna-galerie-images'

// ============================================================
// RÉACTIONS DISPONIBLES sur une image (comme des emojis Facebook)
// ============================================================
export const REACTIONS_DISPONIBLES = ['❤️', '😍', '😂', '👍', '✨']

// ============================================================
// UTILITAIRE DE SAUVEGARDE SÉCURISÉE
// Évite les plantages silencieux si le localStorage est plein (QuotaExceededError)
// ============================================================
function sauvegarderEnSecurite(cle, valeur) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur))
    return true
  } catch (erreur) {
    console.error('Stockage local plein ou indisponible :', erreur)
    return false
  }
}

export function chargerImages() {
  const donnees = localStorage.getItem(CLE_IMAGES)
  if (!donnees) return []
  try {
    return JSON.parse(donnees)
  } catch (erreur) {
    console.error('Erreur lors de la lecture des images :', erreur)
    return []
  }
}

export function sauvegarderImage(image) {
  const images = chargerImages()
  images.unshift(image)
  const succes = sauvegarderEnSecurite(CLE_IMAGES, images)
  if (!succes) {
    throw new Error(
      "Impossible d'enregistrer l'image — stockage local plein. Supprime quelques images pour libérer de la place."
    )
  }
}

export function supprimerImage(id) {
  const images = chargerImages()
  const imagesFiltrees = images.filter((img) => img.id !== id)
  const succes = sauvegarderEnSecurite(CLE_IMAGES, imagesFiltrees)
  
  if (!succes) {
    throw new Error("Impossible de mettre à jour le stockage après suppression.")
  }

  // Évite les références fantômes dans les albums après la suppression de la photo
  retirerPhotoDeTousLesAlbums(id)
}

export function toggleFavoriImage(id) {
  const images = chargerImages()
  const maj = images.map((img) =>
    img.id === id ? { ...img, favori: !img.favori } : img
  )
  const succes = sauvegarderEnSecurite(CLE_IMAGES, maj)
  if (!succes) {
    throw new Error("Stockage local plein — impossible de modifier les favoris.")
  }
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
  const succes = sauvegarderEnSecurite(CLE_IMAGES, imagesMaj)
  if (!succes) {
    throw new Error("Stockage local plein — impossible de sauvegarder le commentaire.")
  }
  return imagesMaj
}

// ============================================================
// METTRE À JOUR N'IMPORTE QUEL CHAMP D'UNE IMAGE EXISTANTE
// (utilisé par exemple par la légende générée par IA, qui doit
// modifier l'image en place plutôt que d'en créer une nouvelle —
// contrairement à sauvegarderImage() qui fait toujours un unshift)
// ============================================================
export function mettreAJourImage(id, changements) {
  const images = chargerImages()
  const imagesMaj = images.map((img) =>
    img.id === id ? { ...img, ...changements } : img
  )
  const succes = sauvegarderEnSecurite(CLE_IMAGES, imagesMaj)
  if (!succes) {
    throw new Error("Stockage local plein — impossible de mettre à jour l'image.")
  }
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
  const succes = sauvegarderEnSecurite(CLE_IMAGES, imagesMaj)
  if (!succes) {
    throw new Error("Stockage local plein — impossible d'enregistrer la réaction.")
  }
  return imagesMaj
}