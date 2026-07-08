import { useState, useEffect, useRef } from 'react'
import { IconHeart } from '../components/Icons'
import {
  chargerImages,
  sauvegarderImage,
  toggleFavoriImage,
  fichierVersBase64,
} from '../services/images'

// ============================================================
// ICÔNES SVG — une par "mood" (ambiance) de photo
// Chacune est un petit composant réutilisable, dessiné à la main
// en SVG plutôt qu'importé d'une librairie, pour rester léger.
// ============================================================
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

// ============================================================
// DONNÉES PAR DÉFAUT (affichées la toute première fois, avant que
// l'utilisateur ait ajouté ses propres photos)
// Note : les couleurs "bg" ci-dessous sont VOLONTAIREMENT variées
// d'une photo à l'autre (identité visuelle propre à chaque image),
// elles ne suivent pas le thème global de l'app — c'est normal.
// ============================================================
const imagesInitiales = [
  { id: '1', titre: 'Ambiance florale', mood: 'Floral', texte: '"Les matins fleuris appartiennent à celles qui savent les voir."', sous: "Yuna · Aujourd'hui", source: 'yuna', favori: true, bg: 'linear-gradient(135deg, #D4869A, #E8B4C4)', Icone: IconFleur, url: null },
  { id: '2', titre: 'Soirée bougies', mood: 'Cosy', texte: '"Une bougie suffit pour illuminer toute une nuit."', sous: 'Moi · Hier', source: 'moi', favori: false, bg: 'linear-gradient(135deg, #C4917A, #D4A891)', Icone: IconBougie, url: null },
  { id: '3', titre: 'Nuit étoilée', mood: 'Nuit', texte: '"Les étoiles brillent pour celles qui osent lever les yeux."', sous: 'Yuna · 20 juin', source: 'yuna', favori: true, bg: 'linear-gradient(135deg, #6B4F5E, #9B7A8C)', Icone: IconLune, url: null },
  { id: '4', titre: 'Nature zen', mood: 'Nature', texte: '"Il y a une magie dans les choses qui poussent doucement."', sous: 'Moi · 19 juin', source: 'moi', favori: false, bg: 'linear-gradient(135deg, #8B9E7A, #A8B894)', Icone: IconFeuille, url: null },
  { id: '5', titre: 'Portrait Yuna', mood: 'Illustration', texte: '"Chaque intelligence a son âme."', sous: 'Yuna · 17 juin', source: 'yuna', favori: true, bg: 'linear-gradient(135deg, #3E2723, #6B4037)', Icone: IconRobot, url: null },
  { id: '6', titre: 'Nuages doux', mood: 'Dreamy', texte: '"Les nuages n\'ont pas de forme fixe."', sous: 'Yuna · 16 juin', source: 'yuna', favori: false, bg: 'linear-gradient(135deg, #B49AAE, #C8B2C4)', Icone: IconNuage, url: null },
  { id: '7', titre: 'Lumière de novembre', mood: 'Lifestyle', texte: '"Les jours ordinaires sont les plus précieux."', sous: 'Moi · 15 juin', source: 'moi', favori: false, bg: 'linear-gradient(135deg, #C4A882, #D4B896)', Icone: IconCafe, url: null },
  { id: '8', titre: 'Coin lecture', mood: 'Aesthetic', texte: '"Un livre, une tisane, et le monde s\'efface."', sous: 'Yuna · 14 juin', source: 'yuna', favori: false, bg: 'linear-gradient(135deg, #E8B4C4, #F4C9D6)', Icone: IconLivre, url: null },
  { id: '9', titre: 'Rituel du soir', mood: 'Calme', texte: '"Le soir appartient à celles qui savent ralentir."', sous: 'Moi · 13 juin', source: 'moi', favori: false, bg: 'linear-gradient(135deg, #9B7A8C, #B49AAE)', Icone: IconHibiscus, url: null },
  { id: '10', titre: 'Café du matin', mood: 'Lifestyle', texte: '"Un bon café, une bonne journée."', sous: 'Moi · 12 juin', source: 'moi', favori: true, bg: 'linear-gradient(135deg, #C4917A, #B49A7A)', Icone: IconCafe, url: null },
]

// Correspondance mood → icône (nécessaire car les fonctions ne peuvent
// pas être stockées telles quelles en JSON dans localStorage — on les
// "rattache" à nouveau après le chargement, à partir du texte "mood")
const iconeParMood = {
  'Floral': IconFleur, 'Cosy': IconBougie, 'Nuit': IconLune,
  'Nature': IconFeuille, 'Illustration': IconRobot, 'Dreamy': IconNuage,
  'Lifestyle': IconCafe, 'Aesthetic': IconLivre, 'Calme': IconHibiscus,
  'Photo': IconFleur,
}

// Barres de progression décoratives ("ambiance" générale de la galerie)
const moods = [
  { label: 'Douceur', valeur: 78 },
  { label: 'Inspirant', valeur: 64 },
  { label: 'Drôle', valeur: 45 },
  { label: 'Aesthetic', valeur: 90 },
]

// Réactions décoratives affichées en bas de page
const reactions = [
  { texte: 'magnifique !! 😍', date: 'il y a 2h', coeurs: 3 },
  { texte: 'jadore cette ambiance', date: 'il y a 5h', coeurs: 2 },
  { texte: 'tellement apaisant ✨', date: 'hier', coeurs: 4 },
]

function GalleryScreen() {

  const [filtreActif, setFiltreActif] = useState('tout') // 'tout' | 'favoris' | 'yuna'
  const [images, setImages] = useState([])
  const [heure] = useState(new Date()) // capturée une seule fois au montage, pour l'horloge décorative
  const inputFichierRef = useRef(null)

  // ===== CHARGEMENT AU DÉMARRAGE =====
  useEffect(() => {
    const imagesSauvegardees = chargerImages()
    if (imagesSauvegardees.length === 0) {
      setImages(imagesInitiales)
    } else {
      const imagesAvecIcones = imagesSauvegardees.map((img) => ({
        ...img,
        Icone: iconeParMood[img.mood] || IconFleur,
      }))
      setImages(imagesAvecIcones)
    }
  }, [])

  const imagesFiltrees = images.filter((img) => {
    if (filtreActif === 'favoris') return img.favori
    if (filtreActif === 'yuna')    return img.source === 'yuna'
    return true
  })

  const toggleFavori = (id) => {
    const imagesSauvegardees = chargerImages()
    if (imagesSauvegardees.length === 0) {
      setImages((old) => old.map((img) => img.id === id ? { ...img, favori: !img.favori } : img))
      return
    }
    const imagesMaj = toggleFavoriImage(id)
    setImages(imagesMaj.map((img) => ({ ...img, Icone: iconeParMood[img.mood] || IconFleur })))
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

  const totalFavoris = images.filter((i) => i.favori).length
  const totalYuna    = images.filter((i) => i.source === 'yuna').length

  const h = String(heure.getHours() % 12 || 12).padStart(2, '0')
  const m = String(heure.getMinutes()).padStart(2, '0')
  const s = String(heure.getSeconds()).padStart(2, '0')

  return (
    <div className="h-full w-full overflow-y-auto bg-cream" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full">

        {/* ===== BANNIÈRE (couleurs déjà branchées au thème) ===== */}
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
            {/* RESPONSIVE : titre plus petit sur mobile (text-[26px]), taille normale dès "md:" */}
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

        {/* RESPONSIVE : padding latéral réduit sur mobile (px-4) */}
        <div className="px-4 md:px-10 pb-14">

          <div className="pt-16 pb-7">
            <div className="flex items-start gap-3 border-l-2 pl-4" style={{ borderColor: 'var(--color-accent)' }}>
              <p className="italic text-espresso/70 text-[14px] md:text-[15px] leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                "Chaque image est un instant qu'on a voulu garder pour toujours." <span style={{ color: 'var(--color-accent)' }}>♡</span>
              </p>
            </div>
          </div>

          {/* ============================================================
              SECTION FEATURED (cercle décoratif + 3 premières photos)
              RESPONSIVE : empilé verticalement sur mobile (flex-col),
              côte à côte à partir de "sm:" (flex-row)
              ============================================================ */}
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

            {/* RESPONSIVE : 3 colonnes gardées même sur mobile (images assez petites
                pour rester lisibles à 3, évite un empilement trop long) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 flex-1 w-full">
              {images.slice(0, 3).map((img) => (
                <div
                  key={img.id}
                  className="relative rounded-2xl overflow-hidden"
                  style={{ height: '90px', background: img.bg, border: '3px solid var(--color-cream)', boxShadow: '0 6px 16px rgba(62,39,35,0.15)' }}
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

          {/* ============================================================
              WIDGETS HORLOGE + MOOD
              RESPONSIVE : empilés en 1 colonne sur mobile, 3 colonnes
              (1 horloge + 2 pour le widget mood) à partir de "sm:"
              ============================================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="rounded-2xl border border-espresso/10 bg-espresso/[0.03] px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
              <span className="text-espresso/45 text-[10.5px] uppercase tracking-[0.08em]">Maintenant</span>
              <span className="font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', color: 'var(--color-accent)' }}>
                {h}:{m}:{s}
              </span>
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-espresso/10 bg-espresso/[0.03] px-5 sm:px-6 py-4 sm:py-5">
              {/* RESPONSIVE : 2 colonnes sur mobile au lieu de 4, plus lisible */}
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

          {/* ============================================================
              LIENS RAPIDES (Favoris / Récemment ajoutées / De Yuna)
              flex-wrap déjà présent → passe naturellement à la ligne sur
              mobile sans modification nécessaire ici
              ============================================================ */}
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

          {/* ===== UPLOAD + FILTRES ===== */}
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
              GRILLE PRINCIPALE DES IMAGES
              RESPONSIVE (le point le plus important de cet écran) :
              - mobile (par défaut)  : 2 colonnes
              - "sm:" (≥640px)       : 3 colonnes
              - "md:" (≥768px)       : 5 colonnes (comme la version desktop d'origine)
              On utilise maintenant les classes Tailwind grid-cols-X au lieu
              d'un style inline "gridTemplateColumns" fixe, car les classes
              Tailwind savent changer selon la largeur d'écran — un style
              inline, non.
              ============================================================ */}
          <div className="mb-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3.5">
            {imagesFiltrees.map((img) => (
              <div
                key={img.id}
                className="rounded-2xl overflow-hidden bg-espresso cursor-pointer transition-all duration-300"
                style={{ boxShadow: '0 4px 16px rgba(62,39,35,0.15)' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 22px rgba(62,39,35,0.25)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(62,39,35,0.15)' }}
              >
                {/* RESPONSIVE : hauteur d'image réduite sur mobile (120px vs 160px)
                    pour que 2 colonnes tiennent bien sans écran trop long à scroller */}
                <div className="relative h-[120px] sm:h-[160px]" style={{ background: img.bg }}>
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
                    onClick={() => toggleFavori(img.id)}
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

                  {/* RESPONSIVE : citation masquée sur mobile (line-clamp évite
                      un texte tronqué illisible sur les petites cartes 2-colonnes) */}
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

          {/* ============================================================
              RÉACTIONS DÉCORATIVES
              RESPONSIVE : empilées en 1 colonne sur mobile, 3 colonnes
              à partir de "sm:"
              ============================================================ */}
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
              {reactions.map((r, i) => (
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
    </div>
  )
}

export default GalleryScreen