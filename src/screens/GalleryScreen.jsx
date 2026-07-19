import { useState, useEffect, useRef, useMemo } from 'react'
import { enregistrerVisite } from '../services/suivi'
import {
  chargerImages,
  sauvegarderImage,
  supprimerImage,
  toggleFavoriImage,
  fichierVersBase64,
  ajouterCommentaireImage,
  toggleReactionImage,
  mettreAJourImage,
  REACTIONS_DISPONIBLES,
} from '../services/images'
import { genererLegendeImage } from '../services/gemini'
import { chargerEntreesJournal, HUMEURS } from '../services/journal'
import { notifierErreur, notifierSucces } from '../services/notifications'
import {
  chargerAlbums,
  creerAlbum,
  supprimerAlbum,
  renommerAlbum,
  togglePhotoDansAlbum,
  retirerPhotoDeTousLesAlbums,
} from '../services/albums'

// ============================================================
// LIEN AVEC LE JOURNAL — journal.js n'exporte pas de fonction dédiée
// "entrée du jour", donc on la retrouve nous-même dans le tableau
// complet. HUMEURS, lui, vient bien de journal.js (source unique).
// ============================================================
function obtenirEntreeJournalDuJour(dateISO) {
  return chargerEntreesJournal().find((e) => e.date === dateISO) || null
}

const IconFleur = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    <path d="M12 9.6c0-2.4-1.6-4-3.2-4s-2 1.6-1.2 3.2c0.8 1.6 2.4 1.6 4.4 0.8z" fill="currentColor" opacity="0.85" />
    <path d="M14.4 12c2.4 0 4-1.6 4-3.2s-1.6-2-3.2-1.2c-1.6 0.8-1.6 2.4-0.8 4.4z" fill="currentColor" opacity="0.85" />
    <path d="M12 14.4c0 2.4 1.6 4 3.2 4s2-1.6 1.2-3.2c-0.8-1.6-2.4-1.6-4.4-0.8z" fill="currentColor" opacity="0.85" />
    <path d="M9.6 12c-2.4 0-4 1.6-4 3.2s1.6 2 3.2 1.2c1.6-0.8 1.6-2.4 0.8-4.4z" fill="currentColor" opacity="0.85" />
  </svg>
)
const IconBougie = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 3c.8 1.4 1.6 2.4 1.6 3.4 0 .9-.7 1.4-1.6 1.4s-1.6-.5-1.6-1.4C10.4 5.4 11.2 4.4 12 3z" fill="currentColor" />
    <rect x="9" y="9" width="6" height="11" rx="1" fill="currentColor" opacity="0.85" />
  </svg>
)
const IconLune = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="currentColor" />
  </svg>
)
const IconFeuille = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M5 19c0-8 6-14 14-14-1 9-7 14-14 14z" fill="currentColor" opacity="0.9" />
  </svg>
)
const IconRobot = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="6" y="9" width="12" height="10" rx="2.5" fill="currentColor" />
    <circle cx="9.5" cy="14" r="1.3" fill="#fff" />
    <circle cx="14.5" cy="14" r="1.3" fill="#fff" />
    <rect x="11" y="4" width="2" height="4" fill="currentColor" />
    <circle cx="12" cy="3.5" r="1.4" fill="currentColor" />
  </svg>
)
const IconNuage = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M7 17a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.6A4.2 4.2 0 0 1 17 17H7z" fill="currentColor" />
  </svg>
)
const IconCafe = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M6 9h11v5a5.5 5.5 0 0 1-5.5 5.5H11.5A5.5 5.5 0 0 1 6 14V9z" fill="currentColor" />
    <path d="M17 10.5h1.2a2 2 0 0 1 0 4H17" stroke="currentColor" strokeWidth="1.6" fill="none" />
  </svg>
)
const IconLivre = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5v-12z" fill="currentColor" opacity="0.9" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 0 1.5-1.5v-12z" fill="currentColor" opacity="0.65" />
  </svg>
)
const IconHibiscus = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <ellipse cx="12" cy="7.5" rx="2.6" ry="3.6" fill="currentColor" opacity="0.85" />
    <ellipse cx="16.5" cy="12" rx="3.6" ry="2.6" fill="currentColor" opacity="0.85" />
    <ellipse cx="12" cy="16.5" rx="2.6" ry="3.6" fill="currentColor" opacity="0.85" />
    <ellipse cx="7.5" cy="12" rx="3.6" ry="2.6" fill="currentColor" opacity="0.85" />
  </svg>
)
const IconChat = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="6" y="9" width="12" height="9" rx="4" fill="currentColor" />
    <circle cx="9.5" cy="13" r="1" fill="#fff" />
    <circle cx="14.5" cy="13" r="1" fill="#fff" />
  </svg>
)
const IconTulipe = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 13c-3-1-4-4-3-7 1.5 1 2.3 2 3 3.5 0.7-1.5 1.5-2.5 3-3.5 1 3 0 6-3 7z" fill="currentColor" />
    <rect x="11.3" y="13" width="1.4" height="7" fill="currentColor" opacity="0.7" />
  </svg>
)
const IconCroix = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const IconBulle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.3 8.3 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
)
const IconOeil = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)
const IconGuillemet = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M7 6c-2.8 1.6-4 4-4 6.8V18h6v-6H6.2C6.4 9.8 7.6 8.2 9.4 7L7 6zm10 0c-2.8 1.6-4 4-4 6.8V18h6v-6h-2.8c.2-2.2 1.4-3.8 3.2-5L17 6z" />
  </svg>
)
const IconEtincelle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" />
    <path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" fill="currentColor" opacity="0.7" />
  </svg>
)
const IconAlbum = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="13.5" r="2.6" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)
const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconCrayon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16.5 3.5a1.9 1.9 0 0 1 2.7 2.7L7 18.4l-3.6.8.8-3.6L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
)
const IconLivreJournal = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
)
const IconPile = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="6" y="3" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" opacity="0.5" />
    <rect x="4" y="6" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)
const IconGrille = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)
// Cœur local, fiable — remplace l'ancien import IconHeart dont on ne
// connaissait pas l'implémentation exacte. currentColor garantit que
// la couleur suit toujours className/style, sans mauvaise surprise.
const IconCoeur = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 21s-7-4.4-9.5-8.5C0.7 8.8 2.2 5 6 5c2.1 0 3.5 1.2 4 2.3C10.5 6.2 11.9 5 14 5c3.8 0 5.3 3.8 3.5 7.5C19 16.6 12 21 12 21z" />
  </svg>
)
const IconRecherche = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const IconTri = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconTelechargement = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 3v13m0 0l-4.5-4.5M12 16l4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const IconPartage = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)
const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)
const IconPlay = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
)
const IconPause = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
)
const IconCamera = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const imagesInitiales = [
  // { id: '1', titre: 'Ambiance florale', mood: 'Floral', texte: '"Les matins fleuris appartiennent à celles qui savent les voir."', sous: "Yuna · Aujourd'hui", source: 'yuna', favori: true, bg: 'linear-gradient(135deg, #D4869A, #E8B4C4)', Icone: IconFleur, url: null },
  // { id: '2', titre: 'Soirée bougies', mood: 'Cosy', texte: '"Une bougie suffit pour illuminer toute une nuit."', sous: 'Moi · Hier', source: 'moi', favori: false, bg: 'linear-gradient(135deg, #C4917A, #D4A891)', Icone: IconBougie, url: null },
  // { id: '3', titre: 'Nuit étoilée', mood: 'Nuit', texte: '"Les étoiles brillent pour celles qui osent lever les yeux."', sous: 'Yuna · 20 juin', source: 'yuna', favori: true, bg: 'linear-gradient(135deg, #6B4F5E, #9B7A8C)', Icone: IconLune, url: null },
  // { id: '4', titre: 'Nature zen', mood: 'Nature', texte: '"Il y a une magie dans les choses qui poussent doucement."', sous: 'Moi · 19 juin', source: 'moi', favori: false, bg: 'linear-gradient(135deg, #8B9E7A, #A8B894)', Icone: IconFeuille, url: null },
  // { id: '5', titre: 'Portrait Yuna', mood: 'Illustration', texte: '"Chaque intelligence a son âme."', sous: 'Yuna · 17 juin', source: 'yuna', favori: true, bg: 'linear-gradient(135deg, #3E2723, #6B4037)', Icone: IconRobot, url: null },
  // { id: '6', titre: 'Nuages doux', mood: 'Dreamy', texte: '"Les nuages n\'ont pas de forme fixe."', sous: 'Yuna · 16 juin', source: 'yuna', favori: false, bg: 'linear-gradient(135deg, #B49AAE, #C8B2C4)', Icone: IconNuage, url: null },
  // { id: '7', titre: 'Lumière de novembre', mood: 'Lifestyle', texte: '"Les jours ordinaires sont les plus précieux."', sous: 'Moi · 15 juin', source: 'moi', favori: false, bg: 'linear-gradient(135deg, #C4A882, #D4B896)', Icone: IconCafe, url: null },
  // { id: '8', titre: 'Coin lecture', mood: 'Aesthetic', texte: '"Un livre, une tisane, et le monde s\'efface."', sous: 'Yuna · 14 juin', source: 'yuna', favori: false, bg: 'linear-gradient(135deg, #E8B4C4, #F4C9D6)', Icone: IconLivre, url: null },
  // { id: '9', titre: 'Rituel du soir', mood: 'Calme', texte: '"Le soir appartient à celles qui savent ralentir."', sous: 'Moi · 13 juin', source: 'moi', favori: false, bg: 'linear-gradient(135deg, #9B7A8C, #B49AAE)', Icone: IconHibiscus, url: null },
  // { id: '10', titre: 'Café du matin', mood: 'Lifestyle', texte: '"Un bon café, une bonne journée."', sous: 'Moi · 12 juin', source: 'moi', favori: true, bg: 'linear-gradient(135deg, #C4917A, #B49A7A)', Icone: IconCafe, url: null },
]

const iconeParMood = {
  'Floral': IconFleur, 'Cosy': IconBougie, 'Nuit': IconLune,
  'Nature': IconFeuille, 'Illustration': IconRobot, 'Dreamy': IconNuage,
  'Lifestyle': IconCafe, 'Aesthetic': IconLivre, 'Calme': IconHibiscus,
  'Photo': IconFleur,
}

const moods = [
  { label: 'Douceur', valeur: 78 },
  { label: 'Inspirant', valeur: 64 },
  { label: 'Drôle', valeur: 45 },
  { label: 'Aesthetic', valeur: 90 },
]

const reactionsDecoratives = [
  { texte: 'magnifique !! 😍', date: 'il y a 2h', coeurs: 3 },
  { texte: 'jadore cette ambiance', date: 'il y a 5h', coeurs: 2 },
  { texte: 'tellement apaisant ✨', date: 'hier', coeurs: 4 },
]

const OPTIONS_TRI = [
  { id: 'recent', label: 'Récentes' },
  { id: 'ancien', label: 'Anciennes' },
  { id: 'alpha', label: 'A → Z' },
  { id: 'favoris', label: 'Favoris d\'abord' },
]

// ============================================================
// PHOTO DU JOUR — choisie de façon déterministe (même photo mise en
// avant toute la journée, change le lendemain), même principe que
// citationDuJour dans JournalScreen.
// ============================================================
function choisirPhotoDuJour(images, dateISO) {
  if (images.length === 0) return null
  let hash = 0
  for (const c of dateISO) hash = (hash * 31 + c.charCodeAt(0)) % 997
  return images[hash % images.length]
}

// ============================================================
// ESTIMATION DE L'ESPACE DE STOCKAGE UTILISÉ par les photos
// (localStorage a généralement une limite de 5-10 Mo par domaine ;
// on estime prudemment 5 Mo pour avertir avant que ça sature).
// ============================================================
function estimerStockage() {
  try {
    const donnees = localStorage.getItem('yuna-galerie-images') || ''
    const octets = new Blob([donnees]).size
    const quotaEstime = 5 * 1024 * 1024
    return { octets, pourcentage: Math.min(100, Math.round((octets / quotaEstime) * 100)) }
  } catch {
    return { octets: 0, pourcentage: 0 }
  }
}
function formaterTaille(octets) {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`
}

function formaterDateISO(date) {
  return date.toISOString().slice(0, 10)
}

// GalleryScreen accepte un callback optionnel onOuvrirJournal(dateISO)
// pour naviguer vers la page Journal à une date précise, si ton
// système de navigation le permet. Sans ce prop, le lien "Ce jour-là
// dans ton journal" affiche l'info mais sans bouton de navigation.
function GalleryScreen({ onOuvrirJournal } = {}) {

  const [filtreActif, setFiltreActif] = useState('tout')
  const [images, setImages] = useState([])
  const [heure] = useState(new Date())
  const inputFichierRef = useRef(null)
  const [indexOuvert, setIndexOuvert] = useState(null)
  const [commentaireEnEdition, setCommentaireEnEdition] = useState('')
  const [erreurCommentaire, setErreurCommentaire] = useState('')
  const [panneauOuvert, setPanneauOuvert] = useState(false)

  // ===== RECHERCHE & TRI =====
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState('recent')
  const [afficherTri, setAfficherTri] = useState(false)

  // ===== ALBUMS =====
  const [albums, setAlbums] = useState(() => chargerAlbums())
  const [afficherGestionAlbums, setAfficherGestionAlbums] = useState(false)
  const [nouveauNomAlbum, setNouveauNomAlbum] = useState('')
  const [albumEnEdition, setAlbumEnEdition] = useState(null)
  const [nomEdition, setNomEdition] = useState('')
  const [afficherPickerAlbum, setAfficherPickerAlbum] = useState(false)

  // ===== MODE PILE (swipe) =====
  const [modeAffichage, setModeAffichage] = useState('grille')
  const [pileIndex, setPileIndex] = useState(0)
  const pileSwipeDebut = useRef(null)

  // ===== LÉGENDE IA =====
  const [legendeEnCours, setLegendeEnCours] = useState(null)

  // ===== DIAPORAMA =====
  const [diaporamaActif, setDiaporamaActif] = useState(false)
  const diaporamaRef = useRef(null)

  // ===== UPLOAD =====
  const [uploadEnCours, setUploadEnCours] = useState(false)

  const positionSwipeDebut = useRef(null)

  useEffect(() => {
    const imagesSauvegardees = chargerImages()
    if (imagesSauvegardees.length === 0) {
      setImages(imagesInitiales)
    } else {
      const imagesAvecIcones = imagesSauvegardees.map((img) => ({ ...img, Icone: iconeParMood[img.mood] || IconFleur }))
      setImages(imagesAvecIcones)
    }
  }, [])

  // ===== FILTRAGE + RECHERCHE + TRI =====
  const imagesFiltrees = useMemo(() => {
    let resultat = images.filter((img) => {
      if (filtreActif === 'favoris') return img.favori
      if (filtreActif === 'yuna')    return img.source === 'yuna'
      if (filtreActif.startsWith('album:')) {
        const album = albums.find((a) => a.id === filtreActif.slice(6))
        return album ? album.photoIds.includes(img.id) : false
      }
      return true
    })

    const q = recherche.trim().toLowerCase()
    if (q) {
      resultat = resultat.filter((img) =>
        (img.titre || '').toLowerCase().includes(q) ||
        (img.mood || '').toLowerCase().includes(q) ||
        (img.texte || '').toLowerCase().includes(q) ||
        (img.commentairePerso || '').toLowerCase().includes(q)
      )
    }

    resultat = [...resultat]
    if (tri === 'recent') resultat.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    else if (tri === 'ancien') resultat.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    else if (tri === 'alpha') resultat.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''))
    else if (tri === 'favoris') resultat.sort((a, b) => (b.favori ? 1 : 0) - (a.favori ? 1 : 0))

    return resultat
  }, [images, filtreActif, albums, recherche, tri])

  useEffect(() => {
    if (indexOuvert === null) return
    const gererClavier = (e) => {
      if (e.key === 'ArrowRight') allerImageSuivante()
      if (e.key === 'ArrowLeft') allerImagePrecedente()
      if (e.key === 'Escape') setIndexOuvert(null)
    }
    window.addEventListener('keydown', gererClavier)
    return () => window.removeEventListener('keydown', gererClavier)
  }, [indexOuvert, imagesFiltrees])

  // Quand on change d'image dans la visionneuse, on recharge son
  // commentaire ET on referme les panneaux (évite de laisser un
  // panneau ouvert avec le contenu de l'image précédente affiché)
  useEffect(() => {
    if (indexOuvert === null) return
    const img = imagesFiltrees[indexOuvert]
    setCommentaireEnEdition(img?.commentairePerso || '')
    setErreurCommentaire('')
    setPanneauOuvert(false)
    setAfficherPickerAlbum(false)
  }, [indexOuvert])

  // Réinitialise la pile quand on change de filtre ou de mode
  useEffect(() => {
    setPileIndex(0)
  }, [filtreActif, modeAffichage])

  // ===== DIAPORAMA — avance automatiquement toutes les 3.5s tant
  // que la visionneuse est ouverte et le diaporama actif. S'arrête
  // proprement si la visionneuse se ferme.
  useEffect(() => {
    if (diaporamaActif && indexOuvert !== null) {
      diaporamaRef.current = setInterval(() => {
        setIndexOuvert((i) => (i === null ? null : (i + 1) % imagesFiltrees.length))
      }, 3500)
    } else {
      clearInterval(diaporamaRef.current)
    }
    return () => clearInterval(diaporamaRef.current)
  }, [diaporamaActif, indexOuvert, imagesFiltrees.length])

  useEffect(() => {
    if (indexOuvert === null) setDiaporamaActif(false)
  }, [indexOuvert])

  useEffect(() => {
  enregistrerVisite('galerie')
  }, [])

  const toggleFavori = (id) => {
    const imagesSauvegardees = chargerImages()
    if (imagesSauvegardees.length === 0) {
      setImages((old) => old.map((img) => img.id === id ? { ...img, favori: !img.favori } : img))
      return
    }
    const imagesMaj = toggleFavoriImage(id)
    setImages(imagesMaj.map((img) => ({ ...img, Icone: iconeParMood[img.mood] || IconFleur })))
  }

  const toggleReaction = (id, emoji) => {
    try {
      const imagesMaj = toggleReactionImage(id, emoji)
      setImages(imagesMaj.map((img) => ({ ...img, Icone: iconeParMood[img.mood] || IconFleur })))
    } catch (erreur) {
      console.error('Erreur réaction :', erreur)
    }
  }

  // ============================================================
  // UPLOAD — corrigé : si le stockage est plein (QuotaExceededError),
  // on avertit clairement au lieu de laisser planter silencieusement
  // en pleine boucle, et on garde les photos déjà uploadées avec succès.
  // ============================================================
  const handleUpload = async (e) => {
    const fichiers = Array.from(e.target.files)
    if (fichiers.length === 0) return

    setUploadEnCours(true)
    const nouvellesImages = []
    let erreurStockage = false

    for (const fichier of fichiers) {
      try {
        const base64 = await fichierVersBase64(fichier)
        const nouvelleImage = {
          id: `${Date.now()}-${Math.random()}`,
          titre: fichier.name.replace(/\.[^/.]+$/, ''),
          mood: 'Photo',
          texte: '"Un instant que j\'ai voulu garder."',
          sous: `Moi · ${new Date().toLocaleDateString('fr-FR')}`,
          source: 'moi',
          favori: false,
          url: base64,
          bg: 'linear-gradient(135deg, #c9cdf4, #ebe4fb)',
          Icone: IconFleur,
          date: new Date().toISOString(),
        }
        sauvegarderImage(nouvelleImage)
        nouvellesImages.push(nouvelleImage)
      } catch (erreur) {
        console.error('Erreur upload photo :', erreur)
        if (erreur.name === 'QuotaExceededError') {
          erreurStockage = true
          break
        }
      }
    }

    if (nouvellesImages.length > 0) {
      setImages((old) => [...nouvellesImages, ...old])
    }
    if (erreurStockage) {
      notifierErreur('Stockage plein ! Supprime quelques photos pour libérer de la place avant d\'en ajouter d\'autres.')
    } else if (nouvellesImages.length > 0) {
      notifierSucces(`${nouvellesImages.length} photo${nouvellesImages.length > 1 ? 's' : ''} ajoutée${nouvellesImages.length > 1 ? 's' : ''} ✨`)
    }
    setUploadEnCours(false)
    e.target.value = ''
  }

  const allerImageSuivante = () => {
    if (indexOuvert === null) return
    setIndexOuvert((i) => (i + 1) % imagesFiltrees.length)
  }

  const allerImagePrecedente = () => {
    if (indexOuvert === null) return
    setIndexOuvert((i) => (i - 1 + imagesFiltrees.length) % imagesFiltrees.length)
  }

  const gererDebutSwipe = (e) => {
    positionSwipeDebut.current = e.touches[0].clientX
  }

  const gererFinSwipe = (e) => {
    if (positionSwipeDebut.current === null) return
    const positionFin = e.changedTouches[0].clientX
    const distance = positionFin - positionSwipeDebut.current
    if (distance > 50) allerImagePrecedente()
    else if (distance < -50) allerImageSuivante()
    positionSwipeDebut.current = null
  }

  const sauvegarderCommentaire = () => {
    if (indexOuvert === null) return
    try {
      const img = imagesFiltrees[indexOuvert]
      const imagesMaj = ajouterCommentaireImage(img.id, commentaireEnEdition)
      setImages(imagesMaj.map((i) => ({ ...i, Icone: iconeParMood[i.mood] || IconFleur })))
      setErreurCommentaire('')
    } catch (erreur) {
      console.error('Erreur sauvegarde commentaire :', erreur)
      if (erreur.name === 'QuotaExceededError') {
        setErreurCommentaire("Stockage plein ! Supprime quelques photos pour libérer de la place.")
      } else {
        setErreurCommentaire("Le mot n'a pas pu être enregistré. Réessaie.")
      }
    }
  }

  // ============================================================
  // LÉGENDE GÉNÉRÉE PAR YUNA (IA)
  // ============================================================
  const genererLegende = async (image) => {
    setLegendeEnCours(image.id)
    try {
      const legende = await genererLegendeImage(image)
      mettreAJourImage(image.id, { texte: legende })
      setImages((old) => old.map((i) => i.id === image.id ? { ...i, texte: legende } : i))
      notifierSucces('Légende générée par Yuna ✨')
    } catch (erreur) {
      notifierErreur(erreur.message || "Impossible de générer une légende pour l'instant")
    } finally {
      setLegendeEnCours(null)
    }
  }

  // ============================================================
  // SUPPRESSION D'UNE PHOTO — la fonction existait déjà dans
  // images.js mais n'était jamais utilisée nulle part. On la
  // branche enfin, avec confirmation et nettoyage des albums.
  // ============================================================
  const supprimerPhotoActuelle = (image) => {
    if (!window.confirm(`Supprimer définitivement "${image.titre}" ? Cette action est irréversible.`)) return
    supprimerImage(image.id)
    setAlbums(retirerPhotoDeTousLesAlbums(image.id))
    setImages((old) => old.filter((i) => i.id !== image.id))
    setIndexOuvert(null)
    notifierSucces('Photo supprimée')
  }

  // ============================================================
  // TÉLÉCHARGEMENT & PARTAGE
  // ============================================================
  const telechargerPhoto = (image) => {
    if (!image.url) {
      notifierErreur("Cette image n'a pas de fichier à télécharger")
      return
    }
    const lien = document.createElement('a')
    lien.href = image.url
    lien.download = `${(image.titre || 'photo').replace(/[^a-z0-9]/gi, '-')}.jpg`
    lien.click()
  }

  const partagerPhoto = async (image) => {
    try {
      if (image.url && navigator.canShare) {
        const reponse = await fetch(image.url)
        const blob = await reponse.blob()
        const fichier = new File([blob], `${image.titre || 'photo'}.jpg`, { type: blob.type })
        if (navigator.canShare({ files: [fichier] })) {
          await navigator.share({ files: [fichier], title: image.titre, text: image.texte })
          return
        }
      }
      if (navigator.share) {
        await navigator.share({ title: image.titre, text: image.texte })
        return
      }
      await navigator.clipboard.writeText(image.texte || image.titre)
      notifierSucces('Légende copiée 📋')
    } catch (erreur) {
      if (erreur.name !== 'AbortError') notifierErreur("Impossible de partager cette photo pour l'instant")
    }
  }

  // ============================================================
  // ALBUMS
  // ============================================================
  const creerNouvelAlbum = () => {
    if (!nouveauNomAlbum.trim()) return
    setAlbums(creerAlbum(nouveauNomAlbum))
    setNouveauNomAlbum('')
  }
  const lancerEditionAlbum = (album) => { setAlbumEnEdition(album.id); setNomEdition(album.nom) }
  const validerEditionAlbum = () => {
    if (!nomEdition.trim()) { setAlbumEnEdition(null); return }
    setAlbums(renommerAlbum(albumEnEdition, nomEdition))
    setAlbumEnEdition(null)
  }
  const supprimerAlbumActuel = (albumId) => {
    if (!window.confirm('Supprimer cet album ? Les photos elles-mêmes ne seront pas supprimées.')) return
    setAlbums(supprimerAlbum(albumId))
    if (filtreActif === `album:${albumId}`) setFiltreActif('tout')
  }

  // ============================================================
  // MODE PILE (swipe façon cartes)
  // ============================================================
  const pileImage = imagesFiltrees[pileIndex]
  const pileAimer = () => {
    if (!pileImage) return
    toggleFavori(pileImage.id)
    setPileIndex((i) => i + 1)
  }
  const pilePasser = () => setPileIndex((i) => i + 1)
  const pileRecommencer = () => setPileIndex(0)

  const gererDebutSwipePile = (e) => { pileSwipeDebut.current = e.touches[0].clientX }
  const gererFinSwipePile = (e) => {
    if (pileSwipeDebut.current === null) return
    const distance = e.changedTouches[0].clientX - pileSwipeDebut.current
    if (distance > 60) pileAimer()
    else if (distance < -60) pilePasser()
    pileSwipeDebut.current = null
  }

  const totalFavoris = images.filter((i) => i.favori).length
  const totalYuna    = images.filter((i) => i.source === 'yuna').length

  const h = String(heure.getHours() % 12 || 12).padStart(2, '0')
  const m = String(heure.getMinutes()).padStart(2, '0')
  const s = String(heure.getSeconds()).padStart(2, '0')

  const photoDuJour = useMemo(() => choisirPhotoDuJour(images, formaterDateISO(new Date())), [images])
  const stockage = useMemo(() => estimerStockage(), [images])
  const stockageCouleur = stockage.pourcentage > 85 ? '#C6564B' : stockage.pourcentage > 60 ? '#C99A2E' : 'var(--color-accent)'

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto scroll-suave bg-cream" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .anim-pop { animation: popIn 0.25s ease-out both; }
      `}</style>

      {/* Input caché partagé pour l'ajout de photos depuis la grille */}
      <input ref={inputFichierRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />

      <div className="w-full">

        <div
          className="relative w-full overflow-hidden"
          style={{
            height: '190px',
            background: 'linear-gradient(135deg, var(--color-peony-light) 0%, var(--color-peony) 55%, color-mix(in srgb, var(--color-peony), var(--color-accent) 35%) 100%)',
          }}
        >
          <svg className="absolute inset-0 opacity-25 w-full h-full">
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.4" fill="var(--color-espresso)" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>

          <span className="absolute top-8 right-[8%] text-lg opacity-50 animate-float">✦</span>
          <span className="absolute top-20 right-[5%] text-sm opacity-40 animate-float" style={{ animationDelay: '0.6s' }}>⋆</span>

          <div className="absolute top-6 right-8 flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'color-mix(in srgb, var(--color-espresso) 8%, transparent)' }}>
            <span className="text-espresso/50 text-[10px]">Modifié à l'instant</span>
          </div>

          <div className="absolute bottom-10 left-6 md:left-10">
            <h1 className="text-espresso font-light flex items-center gap-2 text-[26px] md:text-[36px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Ma <em className="italic">Galerie</em> <span className="text-xl md:text-2xl">✨</span>
            </h1>
          </div>

          <div
            className="absolute -bottom-10 left-6 md:left-10 rounded-full flex items-center justify-center animate-float"
            style={{
              width: '78px', height: '78px',
              background: 'radial-gradient(circle at 35% 30%, var(--color-cream), var(--color-peony-light))',
              border: '4px solid var(--color-cream)',
              boxShadow: '0 8px 18px rgba(62,39,35,0.18)', fontSize: '36px', zIndex: 3,
            }}
          >
            🐇
          </div>
        </div>

        <div className="px-4 md:px-10 pb-14">

          <div className="pt-16 pb-7">
            <div className="flex items-start gap-3 border-l-2 pl-4" style={{ borderColor: 'var(--color-accent)' }}>
              <p className="italic text-espresso/70 text-[14px] md:text-[15px] leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                "Chaque image est un instant qu'on a voulu garder pour toujours." <span style={{ color: 'var(--color-accent)' }}>♡</span>
              </p>
            </div>
          </div>

          {/* ===== PHOTO DU JOUR ===== */}
          {photoDuJour && (
            <button
              onClick={() => setIndexOuvert(imagesFiltrees.indexOf(photoDuJour) !== -1 ? imagesFiltrees.indexOf(photoDuJour) : 0)}
              className="w-full flex items-center gap-3 rounded-2xl p-3 mb-6 text-left transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: 'color-mix(in srgb, var(--color-accent) 8%, white)', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)' }}
            >
              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: photoDuJour.bg }}>
                {photoDuJour.url ? (
                  <img src={photoDuJour.url} alt={photoDuJour.titre} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {photoDuJour.Icone && <photoDuJour.Icone style={{ width: '18px', height: '18px' }} className="text-cream/95" />}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <IconCamera style={{ width: '10px', height: '10px' }} className="text-accent" />
                  <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-accent)' }}>Photo du jour</span>
                </div>
                <p className="text-[12.5px] font-semibold text-espresso truncate" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{photoDuJour.titre}</p>
              </div>
              <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: 'var(--color-accent)' }}>Voir →</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                width: '110px', height: '110px',
                background: 'linear-gradient(135deg, var(--color-peony), color-mix(in srgb, var(--color-peony), var(--color-accent) 35%))',
                border: '5px dashed color-mix(in srgb, var(--color-cream) 80%, transparent)',
                boxShadow: '0 6px 20px rgba(62,39,35,0.15)',
              }}
            >
              <IconTulipe style={{ width: '36px', height: '36px' }} className="text-espresso" />
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 flex-1 w-full">
              {images.slice(0, 3).map((img) => (
                <div
                  key={img.id}
                  className="relative rounded-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                  style={{ height: '90px', background: img.bg, border: '3px solid var(--color-cream)', boxShadow: '0 6px 16px rgba(62,39,35,0.15)' }}
                  onClick={() => setIndexOuvert(imagesFiltrees.indexOf(img))}
                >
                  {img.url ? (
                    <img src={img.url} alt={img.titre} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {img.Icone && <img.Icone style={{ width: '26px', height: '26px' }} className="text-cream/90" />}
                    </div>
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(62,39,35,0.45), transparent 55%)' }} />
                  <p className="absolute bottom-1.5 left-2 text-[9px] text-cream/90 italic truncate right-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {img.titre}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="rounded-2xl border border-espresso/10 bg-espresso/[0.03] px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between transition-all duration-300 hover:border-espresso/20 hover:shadow-[0_6px_18px_rgba(62,39,35,0.08)]">
              <span className="text-espresso/45 text-[10.5px] uppercase tracking-[0.08em]">Maintenant</span>
              <span className="font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', color: 'var(--color-accent)' }}>
                {h}:{m}:{s}
              </span>
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-espresso/10 bg-espresso/[0.03] px-5 sm:px-6 py-4 sm:py-5 transition-all duration-300 hover:border-espresso/20 hover:shadow-[0_6px_18px_rgba(62,39,35,0.08)]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-3">
                {moods.map((mo) => (
                  <div key={mo.label}>
                    <div className="text-[10px] text-espresso/55 mb-1.5">{mo.label}</div>
                    <div className="h-1.5 rounded-full bg-espresso/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${mo.valeur}%`, background: 'linear-gradient(90deg, var(--color-accent), var(--color-peony))' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== RECHERCHE ===== */}
          <div className="relative mb-4">
            <IconRecherche style={{ width: '14px', height: '14px' }} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso/35" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par titre, mood ou mot-clé..."
              className="w-full bg-white border border-espresso/10 rounded-full pl-9 pr-4 py-2.5 text-[12px] text-espresso placeholder:text-espresso/35 outline-none focus:border-espresso/30 transition-colors duration-200"
            />
          </div>

          {/* ===== FILTRES : tout / favoris / yuna / albums ===== */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 flex-wrap">
            <button
              onClick={() => setFiltreActif(filtreActif === 'favoris' ? 'tout' : 'favoris')}
              className="flex items-center gap-2 text-[11px] sm:text-[12px] cursor-pointer rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                border: filtreActif === 'favoris' ? '1.5px solid var(--color-accent)' : '1px solid rgba(62,39,35,0.1)',
                background: filtreActif === 'favoris' ? 'var(--color-peony-light)' : 'transparent',
                color: filtreActif === 'favoris' ? 'var(--color-accent)' : 'rgba(62,39,35,0.7)',
              }}
            >
              <IconCoeur style={{ width: '11px', height: '11px' }} className="text-accent" />
              Favoris ({totalFavoris})
            </button>

            <button
              onClick={() => setFiltreActif(filtreActif === 'yuna' ? 'tout' : 'yuna')}
              className="flex items-center gap-2 text-[11px] sm:text-[12px] cursor-pointer rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                border: filtreActif === 'yuna' ? '1.5px solid var(--color-espresso)' : '1px solid rgba(62,39,35,0.1)',
                background: filtreActif === 'yuna' ? 'var(--color-espresso)' : 'transparent',
                color: filtreActif === 'yuna' ? 'var(--color-peony)' : 'rgba(62,39,35,0.7)',
              }}
            >
              🤖 De Yuna ({totalYuna})
            </button>

            {albums.map((a) => (
              <button
                key={a.id}
                onClick={() => setFiltreActif(filtreActif === `album:${a.id}` ? 'tout' : `album:${a.id}`)}
                className="flex items-center gap-1.5 text-[11px] sm:text-[12px] cursor-pointer rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  border: filtreActif === `album:${a.id}` ? `1.5px solid ${a.couleur}` : '1px solid rgba(62,39,35,0.1)',
                  background: filtreActif === `album:${a.id}` ? a.couleur : 'transparent',
                  color: filtreActif === `album:${a.id}` ? '#fff' : 'rgba(62,39,35,0.7)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: filtreActif === `album:${a.id}` ? '#fff' : a.couleur }} />
                {a.nom} ({a.photoIds.length})
              </button>
            ))}

            <button
              onClick={() => setAfficherGestionAlbums(true)}
              className="flex items-center gap-1.5 text-[11px] sm:text-[12px] cursor-pointer rounded-full border border-dashed border-espresso/25 px-3.5 sm:px-4 py-2 sm:py-2.5 text-espresso/50 hover:border-espresso/45 hover:text-espresso/70 transition-all duration-200"
            >
              <IconAlbum style={{ width: '12px', height: '12px' }} />
              Albums
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 mb-6 flex-wrap">
            <button
              onClick={() => inputFichierRef.current?.click()}
              disabled={uploadEnCours}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-[10.5px] sm:text-[11px] font-medium transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: 'var(--color-espresso)', color: 'var(--color-peony)', border: 'none' }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {uploadEnCours ? 'Ajout en cours...' : 'Ajouter des images'}
            </button>

            {/* ===== Tri ===== */}
            <div className="relative">
              <button
                onClick={() => setAfficherTri((o) => !o)}
                className="flex items-center gap-1.5 rounded-full text-[10.5px] sm:text-[11px] font-medium px-3.5 sm:px-4 py-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 border border-espresso/15"
                style={{ color: 'rgba(62,39,35,0.7)' }}
              >
                <IconTri style={{ width: '11px', height: '11px' }} />
                {OPTIONS_TRI.find((o) => o.id === tri)?.label}
              </button>
              {afficherTri && (
                <div className="anim-pop absolute top-full left-0 mt-1.5 bg-white border border-espresso/10 rounded-2xl p-1.5 z-10 min-w-[150px]" style={{ boxShadow: '0 10px 24px rgba(62,39,35,0.12)' }}>
                  {OPTIONS_TRI.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => { setTri(o.id); setAfficherTri(false) }}
                      className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-xl text-[11px] hover:bg-[#F0EEEB] transition-colors duration-150"
                      style={{ color: tri === o.id ? 'var(--color-accent)' : 'rgba(62,39,35,0.7)', fontWeight: tri === o.id ? 600 : 400 }}
                    >
                      {tri === o.id && <IconCheck style={{ width: '10px', height: '10px' }} />}
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ===== Bascule Grille / Mode pile ===== */}
            <div className="ml-auto flex items-center gap-1 rounded-full border border-espresso/10 p-1">
              <button
                onClick={() => setModeAffichage('grille')}
                title="Vue grille"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ background: modeAffichage === 'grille' ? 'var(--color-espresso)' : 'transparent', color: modeAffichage === 'grille' ? 'var(--color-peony)' : 'rgba(62,39,35,0.5)' }}
              >
                <IconGrille style={{ width: '13px', height: '13px' }} />
              </button>
              <button
                onClick={() => setModeAffichage('pile')}
                title="Mode pile (swipe)"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ background: modeAffichage === 'pile' ? 'var(--color-espresso)' : 'transparent', color: modeAffichage === 'pile' ? 'var(--color-peony)' : 'rgba(62,39,35,0.5)' }}
              >
                <IconPile style={{ width: '13px', height: '13px' }} />
              </button>
            </div>
          </div>

          {imagesFiltrees.length === 0 && (
            <p className="italic text-espresso/40 text-center py-16" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {recherche ? 'Aucune photo ne correspond à ta recherche' : 'Aucune image dans cette catégorie'}
            </p>
          )}

          {/* ============================================================
              VUE GRILLE
              ============================================================ */}
          {modeAffichage === 'grille' && imagesFiltrees.length > 0 && (
            <div className="mb-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-4">
              {imagesFiltrees.map((img, i) => (
                <div
                  key={img.id}
                  onClick={() => setIndexOuvert(i)}
                  className="group rounded-2xl overflow-hidden bg-espresso cursor-pointer transition-all duration-300 hover:-translate-y-1"
                  style={{ boxShadow: '0 4px 16px rgba(62,39,35,0.15)' }}
                >
                  <div className="relative h-[120px] sm:h-[160px] md:h-[200px] lg:h-[180px] overflow-hidden" style={{ background: img.bg }}>
                    {img.url ? (
                      <img
                        src={img.url}
                        alt={img.titre}
                        className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out group-hover:scale-110"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-110">
                        {img.Icone && <img.Icone style={{ width: '22px', height: '22px' }} className="text-cream/95" />}
                      </div>
                    )}

                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(62,39,35,0.5), transparent 60%)' }} />

                    {img.source === 'yuna' && (
                      <div className="absolute top-1.5 left-2 rounded-full bg-espresso text-peony text-[7.5px] sm:text-[8.5px] font-medium px-1.5 sm:px-2 py-0.5">
                        Yuna
                      </div>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavori(img.id) }}
                      className="absolute top-1.5 right-2 flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95"
                      style={{
                        width: '22px', height: '22px',
                        background: 'color-mix(in srgb, var(--color-cream) 92%, transparent)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)', border: 'none',
                      }}
                      title={img.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <IconCoeur
                        style={{ width: '11px', height: '11px' }}
                        className={img.favori ? 'text-accent' : 'text-accent/30'}
                      />
                    </button>

                    {img.reactions?.length > 0 && (
                      <div className="absolute bottom-2 right-2 bg-espresso/70 rounded-full px-1.5 py-0.5 text-[10px] z-10">
                        {img.reactions.slice(0, 3).join('')}
                      </div>
                    )}

                    <p className="hidden sm:block absolute bottom-2 left-2.5 right-2.5 text-[9px] text-cream/90 italic leading-snug transition-opacity duration-200 group-hover:opacity-0" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {img.texte}
                    </p>

                    <div className="hidden sm:flex absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                      <span
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium text-cream"
                        style={{ background: 'color-mix(in srgb, var(--color-accent) 88%, transparent)' }}
                      >
                        <IconOeil style={{ width: '12px', height: '12px' }} />
                        Voir la photo
                      </span>
                    </div>
                  </div>

                  <div className="bg-cream px-2.5 sm:px-3 py-1.5 sm:py-2">
                    <span
                      className="inline-block text-[7.5px] sm:text-[8px] font-medium uppercase tracking-[0.06em] rounded-full px-1.5 py-0.5"
                      style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--color-accent)' }}
                    >
                      {img.mood}
                    </span>
                    <p className="font-semibold text-espresso mt-1 overflow-hidden whitespace-nowrap text-ellipsis text-[11px] sm:text-[12px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {img.titre}
                    </p>
                    <p className="text-[7.5px] sm:text-[8.5px] text-espresso/45 mt-0.5">{img.sous}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============================================================
              VUE "MODE PILE" — swipe façon cartes.
              ============================================================ */}
          {modeAffichage === 'pile' && imagesFiltrees.length > 0 && (
            <div className="mb-10 flex flex-col items-center">
              {pileImage ? (
                <>
                  <div
                    className="relative w-full max-w-[300px] h-[400px]"
                    onTouchStart={gererDebutSwipePile}
                    onTouchEnd={gererFinSwipePile}
                  >
                    {imagesFiltrees.slice(pileIndex + 1, pileIndex + 3).map((img, idx) => (
                      <div
                        key={img.id}
                        className="absolute inset-0 rounded-3xl"
                        style={{
                          transform: `scale(${0.94 - idx * 0.05}) translateY(${(idx + 1) * 10}px)`,
                          zIndex: 1 - idx,
                          background: img.bg,
                          opacity: 0.55,
                        }}
                      />
                    ))}

                    <div
                      key={pileImage.id}
                      className="anim-pop absolute inset-0 rounded-3xl overflow-hidden cursor-pointer"
                      style={{ zIndex: 5, background: pileImage.bg, boxShadow: '0 14px 32px rgba(62,39,35,0.25)' }}
                      onClick={() => setIndexOuvert(imagesFiltrees.indexOf(pileImage))}
                    >
                      {pileImage.url ? (
                        <img src={pileImage.url} alt={pileImage.titre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {pileImage.Icone && <pileImage.Icone style={{ width: '54px', height: '54px' }} className="text-cream/90" />}
                        </div>
                      )}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(62,39,35,0.65), transparent 55%)' }} />
                      <div className="absolute bottom-4 left-4 right-4 text-cream">
                        <span
                          className="inline-block text-[8px] font-medium uppercase tracking-wide rounded-full px-2 py-0.5 mb-1.5"
                          style={{ background: 'rgba(255,255,255,0.2)' }}
                        >
                          {pileImage.mood}
                        </span>
                        <p className="text-[16px] font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{pileImage.titre}</p>
                        <p className="text-[10px] opacity-70 mt-0.5">{pileImage.sous}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 mt-6">
                    <button
                      onClick={pilePasser}
                      title="Passer"
                      className="w-12 h-12 rounded-full bg-white border border-espresso/15 flex items-center justify-center hover:-translate-y-0.5 transition-transform duration-200 active:scale-90"
                      style={{ boxShadow: '0 4px 12px rgba(62,39,35,0.1)' }}
                    >
                      <IconCroix style={{ width: '16px', height: '16px' }} className="text-espresso/50" />
                    </button>
                    <button
                      onClick={pileAimer}
                      title="Ajouter aux favoris"
                      className="w-14 h-14 rounded-full flex items-center justify-center hover:-translate-y-0.5 transition-transform duration-200 active:scale-90"
                      style={{ background: 'var(--color-accent)', boxShadow: '0 6px 18px rgba(62,39,35,0.2)' }}
                    >
                      <IconCoeur style={{ width: '20px', height: '20px' }} className="text-white" />
                    </button>
                  </div>
                  <p className="text-[9.5px] text-espresso/35 mt-3">{pileIndex + 1} / {imagesFiltrees.length} · glisse ou utilise les boutons</p>
                </>
              ) : (
                <div className="text-center py-16">
                  <p className="italic text-espresso/40 mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Tu as vu toutes les photos ✨</p>
                  <button onClick={pileRecommencer} className="text-[11px] font-semibold text-espresso underline underline-offset-2">Recommencer</button>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-espresso/10 bg-espresso/[0.03] p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="rounded-full flex items-center justify-center animate-float"
                style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, var(--color-peony-light), var(--color-peony))' }}
              >
                <IconChat style={{ width: '20px', height: '20px' }} className="text-espresso" />
              </div>
              <div>
                <p className="text-espresso/70 text-[12px] sm:text-[13px] italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {totalFavoris} images préférées · {totalYuna} envoyées par Yuna
                </p>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IconCoeur key={i} style={{ width: '12px', height: '12px' }} className="text-accent" />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-espresso/10">
              {reactionsDecoratives.map((r, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-cream border border-espresso/8 px-4 py-4 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(62,39,35,0.1)]"
                >
                  <IconGuillemet style={{ width: '16px', height: '16px' }} className="opacity-40 text-accent" />
                  <p className="text-[12px] text-espresso/70 leading-relaxed italic flex-1">{r.texte}</p>
                  <div className="flex items-center gap-2.5 pt-3 border-t border-espresso/8">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--color-peony-light)', border: '2px solid var(--color-peony)' }}
                    >
                      <span className="text-[12px]">💌</span>
                    </div>
                    <span className="flex-1 text-[9.5px] text-espresso/35">{r.date}</span>
                    <span className="flex items-center gap-1 text-[9.5px]" style={{ color: 'var(--color-accent)' }}>
                      <IconCoeur style={{ width: '9px', height: '9px' }} className="text-accent" />
                      {r.coeurs}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== JAUGE DE STOCKAGE ===== */}
          {images.length > 0 && (
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-1 rounded-full bg-espresso/8 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stockage.pourcentage}%`, background: stockageCouleur }} />
              </div>
              <span className="text-[9px] text-espresso/35 flex-shrink-0">{formaterTaille(stockage.octets)} utilisés</span>
            </div>
          )}

          <footer className="text-center pt-10 pb-4 mt-10 border-t border-espresso/[0.08]">
            <div className="text-espresso/30 text-[10px] tracking-[0.3em] mb-2">✦ ── ✦ ── ✦</div>
            <p className="italic text-espresso/40" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '12px' }}>
              "Le monde fleurit pour celles qui savent regarder."
            </p>
          </footer>
        </div>
      </div>

      {/* ============================================================
          GESTION DES ALBUMS
          ============================================================ */}
      {afficherGestionAlbums && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60" onClick={() => setAfficherGestionAlbums(false)}>
          <div className="bg-white rounded-3xl w-full max-w-[420px] max-h-[80vh] overflow-y-auto scroll-suave p-6 anim-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-espresso font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px' }}>Mes albums</h2>
              <button onClick={() => setAfficherGestionAlbums(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-espresso/5">
                <IconCroix style={{ width: '14px', height: '14px' }} className="text-espresso/50" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                value={nouveauNomAlbum}
                onChange={(e) => setNouveauNomAlbum(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && creerNouvelAlbum()}
                placeholder="Nom du nouvel album..."
                className="flex-1 bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso outline-none border border-espresso/15 focus:border-espresso"
              />
              <button onClick={creerNouvelAlbum} className="rounded-xl px-3.5 text-[11px] font-semibold text-peony bg-espresso">Créer</button>
            </div>

            {albums.length === 0 ? (
              <p className="text-[11px] text-espresso/40 italic text-center py-6">Aucun album pour l'instant</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {albums.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-[#F0EEEB]">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: a.couleur }} />
                    {albumEnEdition === a.id ? (
                      <input
                        value={nomEdition}
                        onChange={(e) => setNomEdition(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && validerEditionAlbum()}
                        onBlur={validerEditionAlbum}
                        autoFocus
                        className="flex-1 bg-white rounded-lg px-2 py-1 text-[11.5px] text-espresso outline-none border border-espresso/20"
                      />
                    ) : (
                      <span className="flex-1 text-[11.5px] text-espresso">{a.nom}</span>
                    )}
                    <span className="text-[9.5px] text-espresso/40">{a.photoIds.length}</span>
                    <button onClick={() => lancerEditionAlbum(a)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white">
                      <IconCrayon style={{ width: '10px', height: '10px' }} className="text-espresso/40" />
                    </button>
                    <button onClick={() => supprimerAlbumActuel(a.id)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white">
                      <IconCroix style={{ width: '10px', height: '10px' }} className="text-espresso/40" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          VISIONNEUSE PLEIN ÉCRAN
          ============================================================ */}
      {indexOuvert !== null && imagesFiltrees[indexOuvert] && (() => {
        const imageActuelle = imagesFiltrees[indexOuvert]
        const reactionsActives = imageActuelle.reactions || []
        const dateImageISO = imageActuelle.date ? imageActuelle.date.slice(0, 10) : null
        const entreeJournalLiee = dateImageISO ? obtenirEntreeJournalDuJour(dateImageISO) : null
        const humeurJournal = entreeJournalLiee ? HUMEURS.find((hu) => hu.id === entreeJournalLiee.humeur) : null

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90"
            onClick={() => setIndexOuvert(null)}
          >
            <button
              onClick={() => setIndexOuvert(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200 z-20"
            >
              <IconCroix style={{ width: '18px', height: '18px' }} className="text-white" />
            </button>

            {/* ===== Diaporama ===== */}
            <button
              onClick={(e) => { e.stopPropagation(); setDiaporamaActif((d) => !d) }}
              title={diaporamaActif ? 'Mettre en pause' : 'Lancer le diaporama'}
              className="absolute top-4 left-1/2 -translate-x-1/2 md:top-6 flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3 py-1.5 text-[10.5px] font-medium text-white transition-colors duration-200 z-20"
            >
              {diaporamaActif ? <IconPause style={{ width: '11px', height: '11px' }} /> : <IconPlay style={{ width: '11px', height: '11px' }} />}
              {diaporamaActif ? 'Diaporama en cours' : 'Diaporama'}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); allerImagePrecedente() }}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors duration-200 z-20"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); allerImageSuivante() }}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors duration-200 z-20"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <div className="absolute top-4 left-4 md:top-6 md:left-6 text-white/60 text-[11px] font-medium z-20">
              {indexOuvert + 1} / {imagesFiltrees.length}
            </div>

            <div
              className="w-full max-w-[900px] h-[92dvh] md:h-auto md:max-h-[92dvh] bg-espresso rounded-3xl overflow-hidden flex flex-col md:flex-row anim-pop"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative w-full md:w-[62%] flex-shrink-0 h-[38dvh] md:h-auto md:max-h-[92dvh] flex items-center justify-center overflow-hidden"
                style={{ background: imageActuelle.bg }}
                onTouchStart={gererDebutSwipe}
                onTouchEnd={gererFinSwipe}
              >
                {imageActuelle.url ? (
                  <img
                    src={imageActuelle.url}
                    alt={imageActuelle.titre}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  imageActuelle.Icone && <imageActuelle.Icone style={{ width: '70px', height: '70px' }} className="text-cream/90" />
                )}

                {imageActuelle.source === 'yuna' && (
                  <div className="absolute top-4 left-4 rounded-full bg-espresso/80 text-peony text-[10px] font-medium px-3 py-1">
                    🤖 Yuna
                  </div>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); allerImagePrecedente() }}
                  className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); allerImageSuivante() }}
                  className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 min-h-0 p-5 md:p-6 overflow-y-auto scroll-suave flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] uppercase tracking-[0.1em] text-peony/50 border border-peony/20 rounded-full px-2.5 py-1">
                    {imageActuelle.mood}
                  </span>
                </div>

                <h2 className="text-peony font-semibold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px' }}>
                  {imageActuelle.titre}
                </h2>

                <p className="italic text-peony/70 text-[12.5px] leading-relaxed mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {imageActuelle.texte}
                </p>

                {/* ===== Actions rapides : légende IA, télécharger, partager ===== */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <button
                    onClick={() => genererLegende(imageActuelle)}
                    disabled={legendeEnCours === imageActuelle.id}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold text-espresso transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ background: 'var(--color-peony)' }}
                  >
                    <IconEtincelle style={{ width: '11px', height: '11px' }} />
                    {legendeEnCours === imageActuelle.id ? 'Yuna réfléchit...' : 'Légende par Yuna'}
                  </button>
                  {imageActuelle.url && (
                    <button
                      onClick={() => telechargerPhoto(imageActuelle)}
                      title="Télécharger"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-peony/70 hover:text-peony hover:bg-white/10 transition-colors duration-200"
                    >
                      <IconTelechargement style={{ width: '13px', height: '13px' }} />
                    </button>
                  )}
                  <button
                    onClick={() => partagerPhoto(imageActuelle)}
                    title="Partager"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-peony/70 hover:text-peony hover:bg-white/10 transition-colors duration-200"
                  >
                    <IconPartage style={{ width: '13px', height: '13px' }} />
                  </button>
                </div>

                {imageActuelle.commentairePerso && (
                  <p className="text-[10.5px] text-peony/50 italic mb-4 pb-4 border-b border-peony/10">
                    💬 "{imageActuelle.commentairePerso}"
                  </p>
                )}

                {/* ===== Lien avec le Journal du même jour ===== */}
                {entreeJournalLiee && (
                  <div className="mb-4 pb-4 border-b border-peony/10">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <IconLivreJournal style={{ width: '11px', height: '11px' }} className="text-peony/40" />
                      <p className="text-[9px] text-peony/40 uppercase tracking-wide">Ce jour-là, dans ton journal</p>
                    </div>
                    <div className="flex items-start gap-2">
                      {humeurJournal && <span className="text-[15px] flex-shrink-0">{humeurJournal.emoji}</span>}
                      <p className="text-[11px] text-peony/60 italic leading-relaxed line-clamp-2">
                        {entreeJournalLiee.pensees || 'Pas de pensée notée ce jour-là'}
                      </p>
                    </div>
                    {onOuvrirJournal && (
                      <button
                        onClick={() => onOuvrirJournal(dateImageISO)}
                        className="mt-2 text-[10px] font-semibold text-peony underline underline-offset-2"
                      >
                        Ouvrir cette page du journal
                      </button>
                    )}
                  </div>
                )}

                {reactionsActives.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-4">
                    {reactionsActives.map((r) => (
                      <span key={r} className="text-[16px]">{r}</span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex flex-col gap-2">
                  <button
                    onClick={() => setPanneauOuvert(!panneauOuvert)}
                    className="flex items-center justify-center gap-2 rounded-full py-2.5 text-[12px] font-semibold border border-peony/30 text-peony transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5"
                  >
                    <IconBulle style={{ width: '14px', height: '14px' }} />
                    {panneauOuvert ? 'Fermer' : 'Commenter et réagir'}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setAfficherPickerAlbum((o) => !o)}
                      className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-[12px] font-semibold border border-peony/30 text-peony transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5"
                    >
                      <IconAlbum style={{ width: '13px', height: '13px' }} />
                      Ajouter à un album
                    </button>

                    {afficherPickerAlbum && (
                      <div className="anim-pop absolute bottom-full left-0 right-0 mb-2 bg-espresso border border-peony/20 rounded-2xl p-2 max-h-48 overflow-y-auto scroll-suave z-10">
                        {albums.length === 0 ? (
                          <p className="text-[10.5px] text-peony/40 italic px-2 py-2">Aucun album — crée-en un via "Albums" dans les filtres</p>
                        ) : (
                          albums.map((a) => {
                            const dedans = a.photoIds.includes(imageActuelle.id)
                            return (
                              <button
                                key={a.id}
                                onClick={() => setAlbums(togglePhotoDansAlbum(a.id, imageActuelle.id))}
                                className="w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors duration-150"
                              >
                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: a.couleur }} />
                                <span className="flex-1 text-[11px] text-peony">{a.nom}</span>
                                {dedans && <IconCheck style={{ width: '12px', height: '12px' }} className="text-peony" />}
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleFavori(imageActuelle.id)}
                    className="flex items-center justify-center gap-2 rounded-full py-2.5 text-[12px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: imageActuelle.favori ? 'var(--color-accent)' : 'transparent',
                      border: `1.5px solid var(--color-accent)`,
                      color: imageActuelle.favori ? '#fff' : 'var(--color-accent)',
                    }}
                  >
                    <IconCoeur style={{ width: '14px', height: '14px' }} className={imageActuelle.favori ? 'text-white' : 'text-accent'} />
                    {imageActuelle.favori ? 'Dans tes favoris' : 'Ajouter aux favoris'}
                  </button>

                  <button
                    onClick={() => supprimerPhotoActuelle(imageActuelle)}
                    className="flex items-center justify-center gap-1.5 rounded-full py-2 text-[10.5px] font-medium text-peony/40 hover:text-red-300 transition-colors duration-200"
                  >
                    <IconTrash style={{ width: '11px', height: '11px' }} />
                    Supprimer cette photo
                  </button>
                </div>

                {panneauOuvert && (
                  <div className="mt-3 pt-4 border-t border-peony/15 anim-pop">

                    <div
                      className="rounded-r-xl px-3.5 py-2.5 mb-4 text-[10.5px] leading-relaxed text-peony/70 italic"
                      style={{ background: 'rgba(255,255,255,0.05)', borderLeft: '3px solid var(--color-accent)' }}
                    >
                      Une réaction rapide, ou un petit mot — ce que tu ressens face à cette image 🌸
                    </div>

                    <label className="text-[9px] text-peony/40 uppercase tracking-wide block mb-2">
                      Réagis à cette image
                    </label>
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                      {REACTIONS_DISPONIBLES.map((emoji) => {
                        const estActive = reactionsActives.includes(emoji)
                        return (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(imageActuelle.id, emoji)}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[16px] transition-all duration-200 hover:scale-110 active:scale-95"
                            style={{
                              background: estActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)',
                            }}
                          >
                            {emoji}
                          </button>
                        )
                      })}
                    </div>

                    <label className="text-[9px] text-peony/40 uppercase tracking-wide block mb-2">
                      💬 Ton petit mot sur cette photo
                    </label>
                    <textarea
                      value={commentaireEnEdition}
                      onChange={(e) => setCommentaireEnEdition(e.target.value)}
                      placeholder="Écris ce que cette image représente pour toi..."
                      rows={3}
                      className="w-full bg-white/5 border border-peony/20 rounded-xl px-3 py-2.5 text-base md:text-[12px] text-peony placeholder:text-peony/30 outline-none transition-all duration-200 resize-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                    />
                    <button
                      onClick={sauvegarderCommentaire}
                      className="mt-2 text-[10.5px] font-semibold text-espresso bg-peony rounded-full px-4 py-1.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                    >
                      Enregistrer le mot
                    </button>

                    {erreurCommentaire && (
                      <p className="text-[10px] text-red-300 mt-2">{erreurCommentaire}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default GalleryScreen