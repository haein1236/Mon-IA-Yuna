import { useState, useEffect, useRef } from 'react'
import { IconHeart } from '../components/Icons'
import {
  chargerImages,
  sauvegarderImage,
  toggleFavoriImage,
  fichierVersBase64,
  ajouterCommentaireImage,
  toggleReactionImage,
  REACTIONS_DISPONIBLES,
} from '../services/images'

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
// Icône bulle de commentaire, pour le bouton qui ouvre le panneau
const IconBulle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.3 8.3 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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

function GalleryScreen() {

  const [filtreActif, setFiltreActif] = useState('tout')
  const [images, setImages] = useState([])
  const [heure] = useState(new Date())
  const inputFichierRef = useRef(null)
  const [indexOuvert, setIndexOuvert] = useState(null)
  const [commentaireEnEdition, setCommentaireEnEdition] = useState('')
  const [erreurCommentaire, setErreurCommentaire] = useState('')

  // ============================================================
  // NOUVEAU : le panneau commentaire/réactions est maintenant replié
  // par défaut. "panneauOuvert" contrôle son affichage — on l'ouvre
  // via un bouton dédié plutôt que de toujours l'afficher, ce qui
  // laisse plus de place à l'image et rend l'interface moins chargée.
  // ============================================================
  const [panneauOuvert, setPanneauOuvert] = useState(false)

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

  const imagesFiltrees = images.filter((img) => {
    if (filtreActif === 'favoris') return img.favori
    if (filtreActif === 'yuna')    return img.source === 'yuna'
    return true
  })

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
  // commentaire ET on referme le panneau (évite de laisser le
  // panneau ouvert avec le texte de l'image précédente affiché)
  useEffect(() => {
    if (indexOuvert === null) return
    const img = imagesFiltrees[indexOuvert]
    setCommentaireEnEdition(img?.commentairePerso || '')
    setErreurCommentaire('')
    setPanneauOuvert(false)
  }, [indexOuvert])

  const toggleFavori = (id) => {
    const imagesSauvegardees = chargerImages()
    if (imagesSauvegardees.length === 0) {
      setImages((old) => old.map((img) => img.id === id ? { ...img, favori: !img.favori } : img))
      return
    }
    const imagesMaj = toggleFavoriImage(id)
    setImages(imagesMaj.map((img) => ({ ...img, Icone: iconeParMood[img.mood] || IconFleur })))
  }

  // ============================================================
  // NOUVEAU : basculer une réaction (emoji) sur l'image ouverte
  // ============================================================
  const toggleReaction = (id, emoji) => {
    try {
      const imagesMaj = toggleReactionImage(id, emoji)
      setImages(imagesMaj.map((img) => ({ ...img, Icone: iconeParMood[img.mood] || IconFleur })))
    } catch (erreur) {
      console.error('Erreur réaction :', erreur)
    }
  }

  const handleUpload = async (e) => {
    const fichiers = Array.from(e.target.files)
    if (fichiers.length === 0) return

    const nouvellesImages = []
    for (const fichier of fichiers) {
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
        bg: 'linear-gradient(135deg, #F4C9D6, #FBE4EB)',
        Icone: IconFleur,
        date: new Date().toISOString(),
      }
      sauvegarderImage(nouvelleImage)
      nouvellesImages.push(nouvelleImage)
    }
    setImages((old) => [...nouvellesImages, ...old])
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
        setErreurCommentaire("Stockage plein ! Supprime quelques photos dans Paramètres pour libérer de la place.")
      } else {
        setErreurCommentaire("Le mot n'a pas pu être enregistré. Réessaie.")
      }
    }
  }

  const totalFavoris = images.filter((i) => i.favori).length
  const totalYuna    = images.filter((i) => i.source === 'yuna').length

  const h = String(heure.getHours() % 12 || 12).padStart(2, '0')
  const m = String(heure.getMinutes()).padStart(2, '0')
  const s = String(heure.getSeconds()).padStart(2, '0')

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto scroll-suave bg-cream" style={{ fontFamily: "'DM Sans', sans-serif" }}>
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
                  className="relative rounded-2xl overflow-hidden cursor-pointer"
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
            <div className="rounded-2xl border border-espresso/10 bg-espresso/[0.03] px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
              <span className="text-espresso/45 text-[10.5px] uppercase tracking-[0.08em]">Maintenant</span>
              <span className="font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', color: 'var(--color-accent)' }}>
                {h}:{m}:{s}
              </span>
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-espresso/10 bg-espresso/[0.03] px-5 sm:px-6 py-4 sm:py-5">
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

          <div className="flex items-center gap-2 sm:gap-3 mb-6 flex-wrap">
            <button
              onClick={() => setFiltreActif(filtreActif === 'favoris' ? 'tout' : 'favoris')}
              className="flex items-center gap-2 text-[11px] sm:text-[12px] cursor-pointer rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 transition-all duration-200"
              style={{
                border: filtreActif === 'favoris' ? '1.5px solid var(--color-accent)' : '1px solid rgba(62,39,35,0.1)',
                background: filtreActif === 'favoris' ? 'var(--color-peony-light)' : 'transparent',
                color: filtreActif === 'favoris' ? 'var(--color-accent)' : 'rgba(62,39,35,0.7)',
              }}
            >
              <span style={{ color: 'var(--color-accent)' }}>❤</span>
              Favoris ({totalFavoris})
            </button>

            <button
              onClick={() => {
                setImages((old) => [...old].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)))
                setFiltreActif('tout')
              }}
              className="flex items-center gap-2 text-[11px] sm:text-[12px] cursor-pointer rounded-full border border-espresso/10 px-3.5 sm:px-4 py-2 sm:py-2.5 transition-all duration-200 hover:border-espresso/30"
              style={{ color: 'rgba(62,39,35,0.7)' }}
            >
              <span>🕘</span>
              Récemment ajoutées
            </button>

            <button
              onClick={() => setFiltreActif(filtreActif === 'yuna' ? 'tout' : 'yuna')}
              className="flex items-center gap-2 text-[11px] sm:text-[12px] cursor-pointer rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 transition-all duration-200"
              style={{
                border: filtreActif === 'yuna' ? '1.5px solid var(--color-espresso)' : '1px solid rgba(62,39,35,0.1)',
                background: filtreActif === 'yuna' ? 'var(--color-espresso)' : 'transparent',
                color: filtreActif === 'yuna' ? 'var(--color-peony)' : 'rgba(62,39,35,0.7)',
              }}
            >
              🤖 De Yuna ({totalYuna})
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 mb-6 flex-wrap">
            <input ref={inputFichierRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />

            <button
              onClick={() => inputFichierRef.current?.click()}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-[10.5px] sm:text-[11px] font-medium transition-all duration-200 hover:opacity-90"
              style={{ background: 'var(--color-espresso)', color: 'var(--color-peony)', border: 'none' }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Ajouter des images
            </button>

            {[
              { id: 'tout', label: 'Tout' },
              { id: 'favoris', label: '♡ Favoris' },
              { id: 'yuna', label: 'Yuna' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltreActif(f.id)}
                className="rounded-full text-[10.5px] sm:text-[11px] font-medium px-3.5 sm:px-4 py-2 cursor-pointer transition-all duration-200"
                style={{
                  border: filtreActif === f.id ? '1.5px solid var(--color-espresso)' : '1px solid rgba(62,39,35,0.15)',
                  background: filtreActif === f.id ? 'var(--color-espresso)' : 'transparent',
                  color: filtreActif === f.id ? 'var(--color-peony)' : 'rgba(62,39,35,0.6)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {imagesFiltrees.length === 0 && (
            <p className="italic text-espresso/40 text-center py-16" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Aucune image dans cette catégorie
            </p>
          )}

          {/* ============================================================
              GRILLE PRINCIPALE — CORRIGÉE POUR TABLETTE
              AVANT : "sm:grid-cols-3 lg:grid-cols-5" — sur une tablette
              (souvent entre 768px et 1024px), on tombait directement à
              3 colonnes serrées avec des images restées à taille "sm"
              (160px de haut), ce qui donnait des vignettes ressenties
              comme trop petites vu l'espace réellement disponible.
              APRÈS : palier "md" ajouté spécifiquement pour tablette
              (3 colonnes mais BEAUCOUP plus hautes, 200px), et "xl"
              repousse le passage à 5 colonnes aux vrais grands écrans
              desktop — chaque palier a maintenant une taille d'image
              proportionnée à l'espace réel de l'appareil.
              ============================================================ */}
          <div className="mb-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-4">
            {imagesFiltrees.map((img, i) => (
              <div
                key={img.id}
                onClick={() => setIndexOuvert(i)}
                className="rounded-2xl overflow-hidden bg-espresso cursor-pointer transition-all duration-300"
                style={{ boxShadow: '0 4px 16px rgba(62,39,35,0.15)' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 22px rgba(62,39,35,0.25)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(62,39,35,0.15)' }}
              >
                {/* Hauteur d'image progressive : 120px mobile → 160px petit
                    écran → 200px tablette (md) → 180px grand écran (lg+),
                    où plus de colonnes compensent une hauteur un peu moindre */}
                <div className="relative h-[120px] sm:h-[160px] md:h-[200px] lg:h-[180px]" style={{ background: img.bg }}>
                  {img.url ? (
                    <img src={img.url} alt={img.titre} className="absolute inset-0 w-full h-full" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
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
                    <svg viewBox="0 0 24 24" style={{ width: '11px', height: '11px' }}>
                      <path
                        d="M12 21s-7-4.4-9.5-8.5C0.7 8.8 2.2 5 6 5c2.1 0 3.5 1.2 4 2.3C10.5 6.2 11.9 5 14 5c3.8 0 5.3 3.8 3.5 7.5C19 16.6 12 21 12 21z"
                        fill={img.favori ? 'var(--color-accent)' : 'none'}
                        stroke="var(--color-accent)"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </button>

                  {/* Aperçu des réactions déjà posées, en bas à droite */}
                  {img.reactions?.length > 0 && (
                    <div className="absolute bottom-2 right-2 bg-espresso/70 rounded-full px-1.5 py-0.5 text-[10px]">
                      {img.reactions.slice(0, 3).join('')}
                    </div>
                  )}

                  <p className="hidden sm:block absolute bottom-2 left-2.5 right-2.5 text-[9px] text-cream/90 italic leading-snug" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {img.texte}
                  </p>
                </div>

                <div className="bg-cream px-2.5 sm:px-3 py-1.5 sm:py-2">
                  <p className="text-[7.5px] sm:text-[8px] uppercase tracking-[0.06em] text-espresso/45">{img.mood}</p>
                  <p className="font-semibold text-espresso mt-0.5 overflow-hidden whitespace-nowrap text-ellipsis text-[11px] sm:text-[12px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {img.titre}
                  </p>
                  <p className="text-[7.5px] sm:text-[8.5px] text-espresso/45 mt-0.5">{img.sous}</p>
                </div>
              </div>
            ))}
          </div>

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
                    <svg key={i} viewBox="0 0 24 24" style={{ width: '12px', height: '12px' }}>
                      <path d="M12 21s-7-4.4-9.5-8.5C0.7 8.8 2.2 5 6 5c2.1 0 3.5 1.2 4 2.3C10.5 6.2 11.9 5 14 5c3.8 0 5.3 3.8 3.5 7.5C19 16.6 12 21 12 21z" fill="var(--color-accent)" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-espresso/10">
              {reactionsDecoratives.map((r, i) => (
                <div key={i} className="rounded-xl bg-cream px-4 py-3.5">
                  <p className="text-[12px] text-espresso/70">{r.texte}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9.5px] text-espresso/35">{r.date}</span>
                    <span className="flex items-center gap-1 text-[9.5px]" style={{ color: 'var(--color-accent)' }}>
                      <svg viewBox="0 0 24 24" style={{ width: '9px', height: '9px' }}>
                        <path d="M12 21s-7-4.4-9.5-8.5C0.7 8.8 2.2 5 6 5c2.1 0 3.5 1.2 4 2.3C10.5 6.2 11.9 5 14 5c3.8 0 5.3 3.8 3.5 7.5C19 16.6 12 21 12 21z" fill="var(--color-accent)" />
                      </svg>
                      {r.coeurs}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="text-center pt-10 pb-4 mt-10 border-t border-espresso/[0.08]">
            <div className="text-espresso/30 text-[10px] tracking-[0.3em] mb-2">✦ ── ✦ ── ✦</div>
            <p className="italic text-espresso/40" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '12px' }}>
              "Le monde fleurit pour celles qui savent regarder."
            </p>
          </footer>
        </div>
      </div>

      {/* ============================================================
          VISIONNEUSE PLEIN ÉCRAN — commentaire/réactions en PANNEAU
          AVANT : la zone commentaire était toujours visible sous
          l'image, prenant de la place et se retrouvant mal positionnée
          sur petits écrans.
          APRÈS : un bouton "💬 Commenter" ouvre/ferme un panneau
          dédié (comme un tiroir), qui contient à la fois le champ de
          texte ET la barre de réactions emoji. Fermé par défaut, donc
          l'image a toute la place à l'ouverture de la visionneuse.
          ============================================================ */}
      {indexOuvert !== null && imagesFiltrees[indexOuvert] && (() => {
        const imageActuelle = imagesFiltrees[indexOuvert]
        const reactionsActives = imageActuelle.reactions || []

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
              className="w-full max-w-[900px] max-h-[92vh] bg-espresso rounded-3xl overflow-hidden flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ===== Zone image — swipe posé uniquement ici ===== */}
              <div
                className="relative w-full md:w-[62%] flex-shrink-0 flex items-center justify-center max-h-[55vh] md:max-h-[92vh]"
                style={{ background: imageActuelle.bg, minHeight: '220px' }}
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

              {/* ===== Zone infos — compacte, avec bouton pour ouvrir le panneau ===== */}
              <div className="flex-1 min-h-0 p-5 md:p-6 overflow-y-auto scroll-suave flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] uppercase tracking-[0.1em] text-peony/50 border border-peony/20 rounded-full px-2.5 py-1">
                    {imageActuelle.mood}
                  </span>
                </div>

                <h2 className="text-peony font-semibold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px' }}>
                  {imageActuelle.titre}
                </h2>

                <p className="italic text-peony/70 text-[12.5px] leading-relaxed mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {imageActuelle.texte}
                </p>

                {/* Aperçu du dernier commentaire, si présent, même
                    quand le panneau est fermé */}
                {imageActuelle.commentairePerso && (
                  <p className="text-[10.5px] text-peony/50 italic mb-4 pb-4 border-b border-peony/10">
                    💬 "{imageActuelle.commentairePerso}"
                  </p>
                )}

                {/* Aperçu des réactions déjà posées */}
                {reactionsActives.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-4">
                    {reactionsActives.map((r) => (
                      <span key={r} className="text-[16px]">{r}</span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex flex-col gap-2">
                  {/* ===== BOUTON qui ouvre/ferme le panneau ===== */}
                  <button
                    onClick={() => setPanneauOuvert(!panneauOuvert)}
                    className="flex items-center justify-center gap-2 rounded-full py-2.5 text-[12px] font-semibold border border-peony/30 text-peony transition-all duration-200 hover:bg-white/5"
                  >
                    <IconBulle style={{ width: '14px', height: '14px' }} />
                    {panneauOuvert ? 'Fermer' : 'Commenter et réagir'}
                  </button>

                  <button
                    onClick={() => toggleFavori(imageActuelle.id)}
                    className="flex items-center justify-center gap-2 rounded-full py-2.5 text-[12px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: imageActuelle.favori ? 'var(--color-accent)' : 'transparent',
                      border: `1.5px solid var(--color-accent)`,
                      color: imageActuelle.favori ? '#fff' : 'var(--color-accent)',
                    }}
                  >
                    <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                      <path
                        d="M12 21s-7-4.4-9.5-8.5C0.7 8.8 2.2 5 6 5c2.1 0 3.5 1.2 4 2.3C10.5 6.2 11.9 5 14 5c3.8 0 5.3 3.8 3.5 7.5C19 16.6 12 21 12 21z"
                        fill={imageActuelle.favori ? '#fff' : 'none'}
                        stroke={imageActuelle.favori ? '#fff' : 'var(--color-accent)'}
                        strokeWidth="1.8"
                      />
                    </svg>
                    {imageActuelle.favori ? 'Dans tes favoris' : 'Ajouter aux favoris'}
                  </button>
                </div>

                {/* ============================================================
                    PANNEAU COMMENTAIRE + RÉACTIONS — affiché seulement
                    si panneauOuvert est vrai. Contient le champ de texte
                    ET la rangée d'emojis de réaction, dans une seule
                    zone dédiée et bien délimitée (fond légèrement
                    contrasté pour bien la distinguer du reste).
                    ============================================================ */}
                {panneauOuvert && (
                  <div className="mt-3 pt-4 border-t border-peony/15">

                    <label className="text-[9px] text-peony/40 uppercase tracking-wide block mb-2">
                      Réagis à cette image
                    </label>
                    <div className="flex items-center gap-2 mb-5">
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
                      Ton petit mot sur cette photo
                    </label>
                    <textarea
                      value={commentaireEnEdition}
                      onChange={(e) => setCommentaireEnEdition(e.target.value)}
                      placeholder="Écris ce que cette image représente pour toi..."
                      rows={3}
                      className="w-full bg-white/5 border border-peony/20 rounded-xl px-3 py-2.5 text-[12px] text-peony placeholder:text-peony/30 outline-none focus:border-peony/50 transition-colors duration-200 resize-none"
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