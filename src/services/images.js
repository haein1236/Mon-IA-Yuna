// Clé de stockage pour les images dans localStorage
const CLE_IMAGES = 'yuna-galerie-images'

// ===== CHARGER TOUTES LES IMAGES =====
// Retourne le tableau de toutes les images sauvegardées
export function chargerImages() {
  const donnees = localStorage.getItem(CLE_IMAGES)
  if (!donnees) return []
  return JSON.parse(donnees)
}

// ===== SAUVEGARDER UNE IMAGE =====
// Ajoute une image au début du tableau (les plus récentes en premier)
export function sauvegarderImage(image) {
  const images = chargerImages()
  // unshift = ajoute au début du tableau
  images.unshift(image)
  localStorage.setItem(CLE_IMAGES, JSON.stringify(images))
}

// ===== SUPPRIMER UNE IMAGE =====
export function supprimerImage(id) {
  const images = chargerImages()
  const imagesFiltrees = images.filter((img) => img.id !== id)
  localStorage.setItem(CLE_IMAGES, JSON.stringify(imagesFiltrees))
}

// ===== BASCULER FAVORI =====
export function toggleFavoriImage(id) {
  const images = chargerImages()
  const maj = images.map((img) =>
    img.id === id ? { ...img, favori: !img.favori } : img
  )
  localStorage.setItem(CLE_IMAGES, JSON.stringify(maj))
  return maj
}

// ===== CONVERTIR UN FICHIER EN BASE64 =====
// Transforme un fichier image en texte base64 pour le stocker dans localStorage
// C'est une promesse (async) car la lecture du fichier prend un peu de temps
export function fichierVersBase64(fichier) {
  return new Promise((resolve, reject) => {

    // FileReader = outil natif du navigateur pour lire des fichiers locaux
    const lecteur = new FileReader()

    // Quand la lecture est terminée, on retourne le résultat
    lecteur.onload = () => resolve(lecteur.result)

    // Si erreur de lecture
    lecteur.onerror = () => reject(new Error('Erreur de lecture du fichier'))

    // Lance la lecture du fichier en base64 (data URL)
    lecteur.readAsDataURL(fichier)
  })
}

// ===== GÉNÉRER UNE URL D'IMAGE POLLINATIONS =====
// Pollinations AI génère des images à partir d'un texte, totalement gratuit
// On encode le texte pour qu'il soit valide dans une URL
export function genererUrlImageIA(description) {
  // encodeURIComponent transforme les espaces et accents en caractères URL valides
  const descriptionEncodee = encodeURIComponent(description)
  // L'URL Pollinations génère une image à partir de la description
  // width/height = dimensions de l'image générée
  // nologo = sans filigrane
  return `https://image.pollinations.ai/prompt/${descriptionEncodee}?width=512&height=512&nologo=true`
}

// ============================================================
// AJOUTER/MODIFIER UN COMMENTAIRE PERSONNEL SUR UNE IMAGE
// Permet d'écrire un petit mot à propos d'une photo (comme une
// légende Instagram), affiché dans la visionneuse plein écran.
// ⚠️ Vérifie que CLE_IMAGES correspond bien au nom de la clé
// utilisée par le reste de ce fichier (chargerImages/sauvegarderImage)
// ============================================================
export function ajouterCommentaireImage(id, commentaire) {
  const images = chargerImages()
  const imagesMaj = images.map((img) =>
    img.id === id ? { ...img, commentairePerso: commentaire } : img
  )
  localStorage.setItem(CLE_IMAGES, JSON.stringify(imagesMaj))
  return imagesMaj
}