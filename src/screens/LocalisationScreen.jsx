import { useState, useEffect, useRef } from 'react'
import {
  chargerDernierePosition,
  sauvegarderPosition,
  obtenirPositionActuelle,
  obtenirAdresseApprox,
  chargerHistoriquePositions,
  chargerLieuxFavoris,
  sauvegarderLieuFavori,
  supprimerLieuFavori,
  modifierLieuFavori,
  calculerDistanceKm,
  publierPositionPartagee,
  chargerPositionsAmis,
  definirPartageActif,
} from '../services/localisation'
import {
  envoyerDemandeAmi,
  repondreDemandeAmi,
  chargerDemandesRecues,
  chargerMesAmis,
  obtenirMonProfil,
} from '../services/amis'
import { notifierErreur, notifierSucces } from '../services/notifications'

// ============================================================
// ICÔNES
// ============================================================
const IconPin = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)
const IconRefresh = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M21 2v6h-6M3 22v-6h6M3.5 9A9 9 0 0 1 21 6M20.5 15A9 9 0 0 1 3 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconCopier = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)
const IconPartager = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)
const IconItineraire = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 19l6-14 4 8 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconEtoile = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7L2 9.2l7.1-.6L12 2z" />
  </svg>
)
const IconHistorique = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)
const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)
const IconEdit = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 20h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
)
const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 12l5.5 5.5L20 6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconX = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const IconVitesse = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 21a9 9 0 1 1 9-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M12 12l4.5-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)
const IconMontagne = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M3 19l6.5-11L14 15l2.5-3.5L21 19H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
)
const IconClock = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

// ============================================================
// PETITS UTILITAIRES
// ============================================================

function vibrer(duree = 8) {
  if (navigator.vibrate) navigator.vibrate(duree)
}

function evaluerPrecision(metres) {
  if (metres <= 20) return { texte: 'Excellente', couleur: '#3E8E5A', emoji: '🟢' }
  if (metres <= 100) return { texte: 'Bonne', couleur: '#C99A2E', emoji: '🟡' }
  return { texte: 'Faible', couleur: '#C6564B', emoji: '🔴' }
}

function tempsEcoule(dateISO) {
  const diffMin = Math.round((Date.now() - new Date(dateISO).getTime()) / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  return `il y a ${Math.round(diffH / 24)} j`
}

function formaterDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

// ============================================================
// STYLES D'ANIMATION PARTAGÉS
// ============================================================
function StylesAnimations() {
  return (
    <style>{`
      @keyframes yunaFadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes yunaSlideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      @keyframes yunaScaleIn { from { opacity: 0; transform: scale(.94) } to { opacity: 1; transform: scale(1) } }
      @keyframes yunaBadgeDrop { from { opacity: 0; transform: translateY(-8px) scale(.92) } to { opacity: 1; transform: translateY(0) scale(1) } }
      @keyframes yunaShimmer { 0% { background-position: -300% 0 } 100% { background-position: 300% 0 } }
      @keyframes yunaRipple { to { transform: scale(4); opacity: 0 } }
      @keyframes yunaPulseSoft { 0%, 100% { opacity: 1 } 50% { opacity: .5 } }
      @keyframes yunaPulseRing { 0% { box-shadow: 0 0 0 0 rgba(62,79,58,.18) } 100% { box-shadow: 0 0 0 10px rgba(62,79,58,0) } }

      .yuna-fade-in { animation: yunaFadeIn .4s ease both; }
      .yuna-slide-up { animation: yunaSlideUp .38s cubic-bezier(.22,1,.36,1) both; }
      .yuna-scale-in { animation: yunaScaleIn .3s cubic-bezier(.22,1,.36,1) both; }
      .yuna-badge-drop { animation: yunaBadgeDrop .35s cubic-bezier(.22,1,.36,1) both; }
      .yuna-shimmer { background-image: linear-gradient(90deg, #ECE7DE 25%, #F6F3ED 37%, #ECE7DE 63%); background-size: 400% 100%; animation: yunaShimmer 1.6s ease infinite; }
      .yuna-pulse-soft { animation: yunaPulseSoft 2.2s ease-in-out infinite; }
      .yuna-pulse-ring { animation: yunaPulseRing 1.6s ease-out infinite; }

      @media (prefers-reduced-motion: reduce) {
        .yuna-fade-in, .yuna-slide-up, .yuna-scale-in, .yuna-badge-drop, .yuna-shimmer, .yuna-pulse-soft, .yuna-pulse-ring {
          animation: none !important;
        }
      }
    `}</style>
  )
}

function CarteInfo({ icon: Icon, iconColor = '#6B5B4B', label, className = '', children }) {
  return (
    <div className={`yuna-slide-up bg-white rounded-2xl border border-espresso/10 p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {Icon && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: iconColor + '1A' }}>
            <Icon style={{ width: '11px', height: '11px', color: iconColor }} />
          </div>
        )}
        <p className="text-[9px] text-espresso/40 uppercase tracking-wide">{label}</p>
      </div>
      {children}
    </div>
  )
}

function BoutonAction({ icon: Icon, label, onClick, accent, ariaLabel }) {
  const [ripples, setRipples] = useState([])
  const ref = useRef(null)

  const declencherRipple = (e) => {
    const bouton = ref.current
    if (!bouton) return
    const rect = bouton.getBoundingClientRect()
    const taille = Math.max(rect.width, rect.height) * 1.4
    const x = e.clientX - rect.left - taille / 2
    const y = e.clientY - rect.top - taille / 2
    const id = Date.now() + Math.random()
    setRipples((r) => [...r, { id, x, y, taille }])
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 550)
  }

  const gerer = (e) => {
    declencherRipple(e)
    vibrer()
    onClick()
  }

  return (
    <button
      ref={ref}
      onClick={gerer}
      aria-label={ariaLabel || label}
      title={label}
      className="relative overflow-hidden flex flex-col items-center gap-2 bg-white rounded-2xl border border-espresso/10 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40"
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-espresso/10 pointer-events-none"
          style={{ left: r.x, top: r.y, width: r.taille, height: r.taille, animation: 'yunaRipple .55s ease-out forwards' }}
        />
      ))}
      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: accent + '1A' }}>
        <Icon style={{ width: '16px', height: '16px', color: accent }} />
      </div>
      <span className="text-[10px] font-medium text-espresso/60">{label}</span>
    </button>
  )
}

function LocalisationScreen() {
  const [position, setPosition] = useState(() => chargerDernierePosition())
  const [adresse, setAdresse] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  const [centreCarte, setCentreCarte] = useState(null)

  const [historique, setHistorique] = useState([])
  const [lieuxFavoris, setLieuxFavoris] = useState([])
  const [nomNouveauFavori, setNomNouveauFavori] = useState('')
  const [afficherFormFavori, setAfficherFormFavori] = useState(false)

  const [favoriEnEdition, setFavoriEnEdition] = useState(null)
  const [favoriEnSuppression, setFavoriEnSuppression] = useState(null)

  const [actualisationAuto, setActualisationAuto] = useState(false)
  const intervalleRef = useRef(null)

  // Nouveaux états pour le système d'amis
  const [monProfil, setMonProfil] = useState(null)
  const [codeAmiSaisi, setCodeAmiSaisi] = useState('')
  const [demandes, setDemandes] = useState([])
  const [amis, setAmis] = useState([])
  const [positionsAmis, setPositionsAmis] = useState([])
  const [partageActif, setPartageActif] = useState(true)
  const [messageAmi, setMessageAmi] = useState('')

  // Charger profil et données amis au montage
  useEffect(() => {
    obtenirMonProfil().then(setMonProfil)
    chargerDemandesRecues().then(setDemandes)
    chargerMesAmis().then(setAmis)
    chargerPositionsAmis().then(setPositionsAmis)
  }, [])

  const localiser = async (silencieux = false) => {
    setChargement(true)
    if (!silencieux) setErreur('')
    try {
      const pos = await obtenirPositionActuelle()
      setPosition(pos)
      setCentreCarte(pos)
      sauvegarderPosition(pos)
      await publierPositionPartagee(pos)
      setHistorique(chargerHistoriquePositions())

      const adresseTrouvee = await obtenirAdresseApprox(pos.latitude, pos.longitude)
      setAdresse(adresseTrouvee)
    } catch (e) {
      if (!silencieux) setErreur(e.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    setHistorique(chargerHistoriquePositions())
    setLieuxFavoris(chargerLieuxFavoris())
    if (!position) {
      localiser()
    } else {
      setCentreCarte(position)
      obtenirAdresseApprox(position.latitude, position.longitude).then(setAdresse)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (actualisationAuto) {
      intervalleRef.current = setInterval(() => localiser(true), 2 * 60 * 1000)
    } else {
      clearInterval(intervalleRef.current)
    }
    return () => clearInterval(intervalleRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualisationAuto])

  const gererAjoutAmi = async () => {
    try {
      const pseudo = await envoyerDemandeAmi(codeAmiSaisi)
      setMessageAmi(`Demande envoyée à ${pseudo} !`)
      setCodeAmiSaisi('')
    } catch (e) {
      setMessageAmi(e.message)
    }
  }

  const gererReponseDemande = async (id, accepter) => {
    await repondreDemandeAmi(id, accepter)
    setDemandes(await chargerDemandesRecues())
    setAmis(await chargerMesAmis())
  }

  const toggleMonPartage = async () => {
    const nouveauStatut = !partageActif
    setPartageActif(nouveauStatut)
    await definirPartageActif(nouveauStatut)
  }

  const centre = centreCarte || position
  const urlCarte = centre
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${centre.longitude - 0.01}%2C${centre.latitude - 0.01}%2C${centre.longitude + 0.01}%2C${centre.latitude + 0.01}&layer=mapnik&marker=${centre.latitude}%2C${centre.longitude}`
    : null

  const centrerSur = (point) => {
    vibrer()
    setCentreCarte(point)
  }

  const copierCoordonnees = async () => {
    if (!position) return
    const texte = `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
    try {
      await navigator.clipboard.writeText(texte)
      notifierSucces('Coordonnées copiées 📋')
    } catch {
      notifierErreur('Impossible de copier automatiquement — coordonnées : ' + texte)
    }
  }

  const partagerPosition = async () => {
    if (!position) return
    const lien = `https://www.google.com/maps?q=${position.latitude},${position.longitude}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ma position', text: 'Voici où je suis :', url: lien })
      } catch {
        // annulé par l'utilisateur
      }
    } else {
      await navigator.clipboard.writeText(lien)
      notifierSucces('Lien de position copié 📋')
    }
  }

  const ouvrirItineraire = (lat, lon) => {
    vibrer()
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank')
  }

  const copierAdresse = async () => {
    if (!adresse) return
    try {
      await navigator.clipboard.writeText(adresse)
      notifierSucces('Adresse copiée 📋')
    } catch {
      notifierErreur("Impossible de copier l'adresse automatiquement.")
    }
  }

  const partagerAdresse = async () => {
    if (!adresse) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mon adresse', text: adresse })
      } catch {
        // annulé par l'utilisateur
      }
    } else {
      await navigator.clipboard.writeText(adresse)
      notifierSucces('Adresse copiée 📋')
    }
  }

  const enregistrerFavori = () => {
    if (!nomNouveauFavori.trim() || !position) return
    const lieux = sauvegarderLieuFavori({
      nom: nomNouveauFavori.trim(),
      latitude: position.latitude,
      longitude: position.longitude,
    })
    setLieuxFavoris(lieux)
    setNomNouveauFavori('')
    setAfficherFormFavori(false)
    vibrer(12)
    notifierSucces(`"${nomNouveauFavori.trim()}" ajouté à tes lieux favoris ⭐`)
  }

  const retirerFavori = (e, id) => {
    e.stopPropagation()
    setFavoriEnSuppression(id)
    vibrer(10)
    setTimeout(() => {
      setLieuxFavoris(supprimerLieuFavori(id))
      setFavoriEnSuppression(null)
      notifierSucces('Lieu favori supprimé')
    }, 220)
  }

  const commencerEdition = (e, lieu) => {
    e.stopPropagation()
    setFavoriEnEdition({ id: lieu.id, nom: lieu.nom })
  }

  const annulerEdition = (e) => {
    e?.stopPropagation()
    setFavoriEnEdition(null)
  }

  const confirmerEdition = (e) => {
    e.stopPropagation()
    if (!favoriEnEdition?.nom.trim()) return
    setLieuxFavoris(modifierLieuFavori(favoriEnEdition.id, favoriEnEdition.nom.trim()))
    setFavoriEnEdition(null)
    notifierSucces('Lieu favori renommé')
  }

  const precisionInfo = position ? evaluerPrecision(position.precision) : null

  const labelCarte = (() => {
    if (!centreCarte || !position) return 'Position actuelle'
    if (centreCarte.latitude === position.latitude && centreCarte.longitude === position.longitude) return 'Position actuelle'
    const favoriCorrespondant = lieuxFavoris.find(
      (l) => l.latitude === centreCarte.latitude && l.longitude === centreCarte.longitude
    )
    if (favoriCorrespondant) return favoriCorrespondant.nom
    const amiCorrespondant = positionsAmis.find(
      (p) => p.latitude === centreCarte.latitude && p.longitude === centreCarte.longitude
    )
    if (amiCorrespondant) {
      const amiInfo = amis.find((a) => a.id === amiCorrespondant.user_id)
      return amiInfo ? `Position de ${amiInfo.pseudo}` : 'Position ami'
    }
    return "Point de l'historique"
  })()

  const sousTitre = (() => {
    if (chargement && !position) return 'Recherche de ta position en cours…'
    if (adresse) return `Actuellement près de ${adresse.split(',').slice(0, 2).join(',')}`
    return 'Retrouve facilement tes positions et tes lieux favoris.'
  })()

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto scroll-suave bg-cream">
      <StylesAnimations />
      <div className="px-4 sm:px-6 md:px-8 py-6 md:py-8 max-w-[1100px] mx-auto">

        {/* ===== EN-TÊTE ===== */}
        <div className="flex items-center gap-3 mb-2 yuna-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-espresso/8 flex items-center justify-center flex-shrink-0 shadow-sm">
            <IconPin style={{ width: '20px', height: '20px' }} className="text-espresso" />
          </div>
          <div className="min-w-0">
            <h1 className="text-espresso font-semibold flex items-center gap-1.5" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px' }}>
              📍 Localisation
            </h1>
            <p className="text-[10.5px] text-espresso/45 truncate">{sousTitre}</p>
          </div>
        </div>

        {erreur && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 yuna-scale-in">
            <p className="text-[11.5px] text-red-600">{erreur}</p>
          </div>
        )}

        {position ? (
          <div className="lg:grid lg:grid-cols-[1.45fr_1fr] lg:gap-5 lg:items-start">
            {/* ===== COLONNE GAUCHE : carte + actions rapides ===== */}
            <div className="lg:sticky lg:top-6 flex flex-col gap-3 mb-3 lg:mb-0">
              <div className="yuna-scale-in bg-white rounded-3xl border border-espresso/10 overflow-hidden relative shadow-md">
                <iframe
                  key={urlCarte}
                  title="Carte de ma position"
                  src={urlCarte}
                  className="w-full h-[280px] sm:h-[340px] lg:h-[440px] yuna-fade-in"
                  style={{ border: 'none' }}
                  loading="lazy"
                />

                <div key={labelCarte + centreCarte?.latitude} className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-md yuna-badge-drop">
                  <IconPin style={{ width: '10px', height: '10px' }} className="text-espresso/70 flex-shrink-0" />
                  <span className="text-[10.5px] font-semibold text-espresso truncate max-w-[140px]">{labelCarte}</span>
                </div>

                {chargement && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-full shadow-md yuna-fade-in">
                    <IconRefresh style={{ width: '11px', height: '11px' }} className="text-espresso/60 animate-spin" />
                    <span className="text-[9.5px] text-espresso/55">Mise à jour…</span>
                  </div>
                )}

                {centreCarte && position && (centreCarte.latitude !== position.latitude || centreCarte.longitude !== position.longitude) && (
                  <button
                    onClick={() => centrerSur(position)}
                    className="absolute bottom-3 right-3 text-[10.5px] font-semibold text-espresso bg-white/90 backdrop-blur rounded-full px-3 py-1.5 shadow-md hover:bg-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40"
                  >
                    Revenir à ma position
                  </button>
                )}
              </div>

              {/* Actions rapides */}
              <div className="grid grid-cols-3 gap-2">
                <BoutonAction icon={IconCopier} label="Copier" ariaLabel="Copier mes coordonnées" onClick={copierCoordonnees} accent="#6B5B4B" />
                <BoutonAction icon={IconPartager} label="Partager" ariaLabel="Partager ma position" onClick={partagerPosition} accent="#3E6E8E" />
                <BoutonAction icon={IconItineraire} label="Itinéraire" ariaLabel="Lancer un itinéraire vers ma position" onClick={() => ouvrirItineraire(position.latitude, position.longitude)} accent="#3E8E5A" />
              </div>

              <div className="hidden lg:block">
                <button
                  onClick={() => { vibrer(10); localiser() }}
                  disabled={chargement}
                  aria-label="Actualiser ma position"
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[12px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${chargement ? 'yuna-pulse-ring' : ''}`}
                >
                  <IconRefresh style={{ width: '14px', height: '14px' }} className={chargement ? 'animate-spin' : ''} />
                  {chargement ? 'Localisation en cours...' : 'Actualiser ma position'}
                </button>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actualisationAuto}
                      onChange={(e) => setActualisationAuto(e.target.checked)}
                      className="accent-espresso"
                    />
                    <span className="text-[10.5px] text-espresso/50">Actualiser automatiquement toutes les 2 minutes</span>
                  </label>
                  {actualisationAuto && (
                    <span className="flex items-center gap-1 text-[9.5px] font-semibold text-[#3E8E5A] yuna-fade-in">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3E8E5A] yuna-pulse-soft" />
                      En direct
                    </span>
                  )}
                </div>
                {!chargement && (
                  <p className="text-center text-[9.5px] text-espresso/35 mt-2">Actualisée {tempsEcoule(position.date)}</p>
                )}

                {/* ===== BLOCS AMIS (DESKTOP) ===== */}
                {monProfil && (
                  <div className="bg-white rounded-2xl border border-espresso/10 p-4 mt-5 yuna-slide-up">
                    <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1">Mon code ami — partage-le pour être ajouté</p>
                    <p className="text-[16px] font-bold text-espresso tracking-wider">{monProfil.code_ami}</p>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-espresso/10 p-4 mt-3 yuna-slide-up">
                  <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Ajouter un ami par son code</p>
                  <div className="flex gap-2">
                    <input value={codeAmiSaisi} onChange={(e) => setCodeAmiSaisi(e.target.value)} placeholder="Ex : SAKI-4821"
                      className="flex-1 bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] outline-none border border-espresso/15" />
                    <button onClick={gererAjoutAmi} className="bg-espresso text-peony rounded-xl px-4 text-[11px] font-semibold hover:-translate-y-0.5 transition-transform">Ajouter</button>
                  </div>
                  {messageAmi && <p className="text-[10.5px] text-espresso/50 mt-2">{messageAmi}</p>}
                </div>

                {demandes.length > 0 && (
                  <div className="bg-white rounded-2xl border border-espresso/10 p-4 mt-3 yuna-slide-up">
                    <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Demandes reçues</p>
                    {demandes.map((d) => (
                      <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-espresso/5 last:border-0">
                        <span className="text-[12px] text-espresso font-medium">{d.profils_publics?.pseudo}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => gererReponseDemande(d.id, true)} className="text-[10px] bg-espresso text-peony rounded-full px-3 py-1 font-medium">Accepter</button>
                          <button onClick={() => gererReponseDemande(d.id, false)} className="text-[10px] text-espresso/40 hover:text-espresso">Refuser</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-espresso/10 p-4 mt-3 yuna-slide-up">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] text-espresso/40 uppercase tracking-wide">Mes amis ({amis.length})</p>
                    <button onClick={toggleMonPartage} className="text-[9px] font-semibold px-2.5 py-1 rounded-full transition-colors" style={{ background: partageActif ? '#4ade80' : '#F0EEEB', color: partageActif ? '#1a3a1a' : '#3E2723' }}>
                      {partageActif ? 'Je partage ma position' : 'Partage désactivé'}
                    </button>
                  </div>
                  {amis.length === 0 && <p className="text-[10.5px] text-espresso/35 italic">Aucun ami pour l'instant</p>}
                  {amis.map((ami) => {
                    const pos = positionsAmis.find((p) => p.user_id === ami.id)
                    return (
                      <div
                        key={ami.id}
                        onClick={() => pos && centrerSur(pos)}
                        className={`flex items-center justify-between py-2 border-b border-espresso/5 last:border-0 ${pos ? 'cursor-pointer hover:bg-[#F0EEEB]/50 px-2 rounded-lg transition-colors' : ''}`}
                      >
                        <span className="text-[12px] text-espresso font-medium">{ami.pseudo}</span>
                        <span className="text-[9.5px] text-espresso/40">{pos ? `Vu ${new Date(pos.mis_a_jour_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Aucune position partagée'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ===== COLONNE DROITE : informations détaillées ===== */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                <CarteInfo icon={IconPin} iconColor="#6B5B4B" label="Coordonnées">
                  <p className="text-[13px] text-espresso font-medium tabular-nums">
                    {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full mt-2"
                    style={{ background: precisionInfo.couleur + '1A', color: precisionInfo.couleur }}
                  >
                    <span className={precisionInfo.texte === 'Excellente' ? 'yuna-pulse-soft' : ''}>{precisionInfo.emoji}</span>
                    {precisionInfo.texte} (~{position.precision} m)
                  </span>
                </CarteInfo>
                <CarteInfo icon={IconClock} iconColor="#6B5B4B" label="Dernière mise à jour">
                  <p className="text-[13px] text-espresso font-medium">
                    {new Date(position.date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[10px] text-espresso/45 mt-1.5">{tempsEcoule(position.date)}</p>
                </CarteInfo>
              </div>

              {(position.vitesse != null || position.altitude != null) && (
                <div className="grid grid-cols-2 gap-3">
                  {position.vitesse != null && (
                    <CarteInfo icon={IconVitesse} iconColor="#3E6E8E" label="Vitesse">
                      <p className="text-[13px] text-espresso font-medium">{position.vitesse} km/h</p>
                    </CarteInfo>
                  )}
                  {position.altitude != null && (
                    <CarteInfo icon={IconMontagne} iconColor="#7A5EA8" label="Altitude">
                      <p className="text-[13px] text-espresso font-medium">{position.altitude} m</p>
                    </CarteInfo>
                  )}
                </div>
              )}

              {adresse && (
                <CarteInfo icon={IconPin} iconColor="#6B5B4B" label="Adresse approximative">
                  <p className="text-[12.5px] text-espresso leading-relaxed mb-2.5">{adresse}</p>
                  <div className="flex gap-3">
                    <button onClick={copierAdresse} className="text-[10px] font-semibold text-espresso/55 hover:text-espresso underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40 rounded transition-colors">
                      Copier
                    </button>
                    <button onClick={partagerAdresse} className="text-[10px] font-semibold text-espresso/55 hover:text-espresso underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40 rounded transition-colors">
                      Partager
                    </button>
                  </div>
                </CarteInfo>
              )}

              {/* ===== LIEUX FAVORIS ===== */}
              <div className="yuna-slide-up bg-white rounded-2xl border border-espresso/10 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] text-espresso/40 uppercase tracking-wide">Lieux favoris</p>
                  <button
                    onClick={() => setAfficherFormFavori((a) => !a)}
                    className="text-[10.5px] font-semibold text-espresso underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40 rounded"
                  >
                    {afficherFormFavori ? 'Annuler' : '+ Enregistrer ici'}
                  </button>
                </div>

                {afficherFormFavori && (
                  <div className="flex gap-2 mb-3 yuna-scale-in">
                    <input
                      value={nomNouveauFavori}
                      onChange={(e) => setNomNouveauFavori(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && enregistrerFavori()}
                      placeholder="Ex : Maison, Travail..."
                      aria-label="Nom du nouveau lieu favori"
                      autoFocus
                      className="flex-1 min-w-0 bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso outline-none border border-espresso/15 focus:border-espresso transition-colors"
                    />
                    <button onClick={enregistrerFavori} className="flex-shrink-0 rounded-xl px-3.5 text-[11px] font-semibold text-peony bg-espresso hover:-translate-y-0.5 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                      Ajouter
                    </button>
                  </div>
                )}

                {lieuxFavoris.length === 0 ? (
                  <p className="text-[10.5px] text-espresso/35 italic">Aucun lieu favori enregistré</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {lieuxFavoris.map((lieu) => {
                      const distance = calculerDistanceKm(position.latitude, position.longitude, lieu.latitude, lieu.longitude)
                      const enEdition = favoriEnEdition?.id === lieu.id
                      const enSuppression = favoriEnSuppression === lieu.id
                      return (
                        <div
                          key={lieu.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => !enEdition && centrerSur(lieu)}
                          onKeyDown={(e) => { if (!enEdition && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); centrerSur(lieu) } }}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40 ${enSuppression ? 'opacity-0 scale-95 -translate-x-2' : 'opacity-100 scale-100'} ${enEdition ? 'bg-[#F0EEEB]' : 'hover:bg-[#F0EEEB]'}`}
                        >
                          <div className="w-7 h-7 rounded-full bg-[#F4EBC8] flex items-center justify-center flex-shrink-0">
                            <IconEtoile style={{ width: '12px', height: '12px' }} className="text-[#C99A2E]" fill="currentColor" />
                          </div>

                          {enEdition ? (
                            <input
                              autoFocus
                              value={favoriEnEdition.nom}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setFavoriEnEdition((f) => ({ ...f, nom: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') confirmerEdition(e); if (e.key === 'Escape') annulerEdition(e) }}
                              aria-label="Renommer ce lieu favori"
                              className="flex-1 min-w-0 bg-white rounded-lg px-2 py-1 text-[11.5px] text-espresso outline-none border border-espresso/20 focus:border-espresso"
                            />
                          ) : (
                            <div className="flex-1 min-w-0">
                              <p className="text-[11.5px] font-medium text-espresso truncate">{lieu.nom}</p>
                              <p className="text-[9.5px] text-espresso/45">
                                {formaterDistance(distance)} de toi · ajouté {tempsEcoule(new Date(lieu.id).toISOString())}
                              </p>
                            </div>
                          )}

                          {enEdition ? (
                            <>
                              <button onClick={confirmerEdition} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40" title="Valider" aria-label="Valider le renommage">
                                <IconCheck style={{ width: '13px', height: '13px' }} className="text-[#3E8E5A]" />
                              </button>
                              <button onClick={annulerEdition} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40" title="Annuler" aria-label="Annuler le renommage">
                                <IconX style={{ width: '13px', height: '13px' }} className="text-espresso/40" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); vibrer(); ouvrirItineraire(lieu.latitude, lieu.longitude) }}
                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40"
                                title="Itinéraire"
                                aria-label={`Itinéraire vers ${lieu.nom}`}
                              >
                                <IconItineraire style={{ width: '12px', height: '12px' }} className="text-espresso/50" />
                              </button>
                              <button onClick={(e) => commencerEdition(e, lieu)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40" title="Modifier" aria-label={`Renommer ${lieu.nom}`}>
                                <IconEdit style={{ width: '12px', height: '12px' }} className="text-espresso/45" />
                              </button>
                              <button onClick={(e) => retirerFavori(e, lieu.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40" title="Supprimer" aria-label={`Supprimer ${lieu.nom}`}>
                                <IconTrash style={{ width: '12px', height: '12px' }} className="text-espresso/40" />
                              </button>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ===== HISTORIQUE ===== */}
              {historique.length > 1 && (
                <div className="yuna-slide-up bg-white rounded-2xl border border-espresso/10 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <IconHistorique style={{ width: '13px', height: '13px' }} className="text-espresso/40" />
                    <p className="text-[9px] text-espresso/40 uppercase tracking-wide">Historique des positions</p>
                  </div>
                  <div className="relative max-h-56 overflow-y-auto scroll-suave pl-1">
                    <div className="absolute left-[10px] top-2 bottom-2 w-px bg-espresso/10" />
                    {historique.slice(0, 15).map((pos, i) => {
                      const distance = calculerDistanceKm(position.latitude, position.longitude, pos.latitude, pos.longitude)
                      return (
                        <button
                          key={pos.date + i}
                          onClick={() => centrerSur(pos)}
                          className="relative w-full text-left flex items-start py-1.5 group focus-visible:outline-none"
                        >
                          <span className="relative z-10 mt-1.5 w-3 h-3 rounded-full bg-white border-2 border-espresso/25 group-hover:border-espresso/70 transition-colors duration-150 flex-shrink-0" />
                          <div className="flex-1 min-w-0 ml-3 rounded-lg px-2 py-1 group-hover:bg-[#F0EEEB] transition-colors duration-150 group-focus-visible:ring-2 group-focus-visible:ring-espresso/40">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10.5px] font-medium text-espresso/70 flex items-center gap-1">
                                📍 {new Date(pos.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[9.5px] text-espresso/35 flex-shrink-0">{tempsEcoule(pos.date)}</span>
                            </div>
                            <p className="text-[9.5px] text-espresso/45 mt-0.5">
                              {distance === 0 ? 'Position actuelle' : `${formaterDistance(distance)} de ta position actuelle`}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===== ÉCRAN DE CHARGEMENT ===== */
          chargement ? (
            <div className="flex flex-col gap-3 yuna-fade-in" aria-busy="true" aria-label="Recherche de ta position en cours">
              <div className="yuna-shimmer rounded-3xl h-[280px] sm:h-[340px]" />
              <div className="grid grid-cols-3 gap-2">
                <div className="yuna-shimmer rounded-2xl h-20" />
                <div className="yuna-shimmer rounded-2xl h-20" />
                <div className="yuna-shimmer rounded-2xl h-20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="yuna-shimmer rounded-2xl h-16" />
                <div className="yuna-shimmer rounded-2xl h-16" />
              </div>
            </div>
          ) : (
            !erreur && (
              <p className="text-center text-espresso/40 italic py-16 text-[12px]">
                Aucune position enregistrée pour l'instant
              </p>
            )
          )
        )}

        {/* CONTRÔLES MOBILES ET BLOCS AMIS SUR PETITS ÉCRANS */}
        <div className={position ? 'lg:hidden mt-5' : 'mt-5'}>
          <div className="max-w-[420px] mx-auto lg:max-w-none">
            <button
              onClick={() => { vibrer(10); localiser() }}
              disabled={chargement}
              aria-label="Actualiser ma position"
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[12px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${chargement ? 'yuna-pulse-ring' : ''}`}
            >
              <IconRefresh style={{ width: '14px', height: '14px' }} className={chargement ? 'animate-spin' : ''} />
              {chargement ? 'Localisation en cours...' : 'Actualiser ma position'}
            </button>

            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={actualisationAuto}
                  onChange={(e) => setActualisationAuto(e.target.checked)}
                  className="accent-espresso"
                />
                <span className="text-[10.5px] text-espresso/50">Actualiser automatiquement toutes les 2 minutes</span>
              </label>
              {actualisationAuto && (
                <span className="flex items-center gap-1 text-[9.5px] font-semibold text-[#3E8E5A] yuna-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3E8E5A] yuna-pulse-soft" />
                  En direct
                </span>
              )}
            </div>
            {position && !chargement && (
              <p className="text-center text-[9.5px] text-espresso/35 mt-2">Actualisée {tempsEcoule(position.date)}</p>
            )}

            {/* ===== BLOCS AMIS (MOBILE) ===== */}
            {monProfil && (
              <div className="bg-white rounded-2xl border border-espresso/10 p-4 mt-5">
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1">Mon code ami — partage-le pour être ajouté</p>
                <p className="text-[16px] font-bold text-espresso tracking-wider">{monProfil.code_ami}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-espresso/10 p-4 mt-3">
              <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Ajouter un ami par son code</p>
              <div className="flex gap-2">
                <input value={codeAmiSaisi} onChange={(e) => setCodeAmiSaisi(e.target.value)} placeholder="Ex : SAKI-4821"
                  className="flex-1 bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] outline-none border border-espresso/15" />
                <button onClick={gererAjoutAmi} className="bg-espresso text-peony rounded-xl px-4 text-[11px] font-semibold">Ajouter</button>
              </div>
              {messageAmi && <p className="text-[10.5px] text-espresso/50 mt-2">{messageAmi}</p>}
            </div>

            {demandes.length > 0 && (
              <div className="bg-white rounded-2xl border border-espresso/10 p-4 mt-3">
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Demandes reçues</p>
                {demandes.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-espresso/5 last:border-0">
                    <span className="text-[12px] text-espresso font-medium">{d.profils_publics?.pseudo}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => gererReponseDemande(d.id, true)} className="text-[10px] bg-espresso text-peony rounded-full px-3 py-1 font-medium">Accepter</button>
                      <button onClick={() => gererReponseDemande(d.id, false)} className="text-[10px] text-espresso/40">Refuser</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-espresso/10 p-4 mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide">Mes amis ({amis.length})</p>
                <button onClick={toggleMonPartage} className="text-[9px] font-semibold px-2.5 py-1 rounded-full" style={{ background: partageActif ? '#4ade80' : '#F0EEEB', color: partageActif ? '#1a3a1a' : '#3E2723' }}>
                  {partageActif ? 'Je partage ma position' : 'Partage désactivé'}
                </button>
              </div>
              {amis.length === 0 && <p className="text-[10.5px] text-espresso/35 italic">Aucun ami pour l'instant</p>}
              {amis.map((ami) => {
                const pos = positionsAmis.find((p) => p.user_id === ami.id)
                return (
                  <div
                    key={ami.id}
                    onClick={() => pos && centrerSur(pos)}
                    className={`flex items-center justify-between py-2 border-b border-espresso/5 last:border-0 ${pos ? 'cursor-pointer hover:bg-[#F0EEEB]/50 px-2 rounded-lg' : ''}`}
                  >
                    <span className="text-[12px] text-espresso font-medium">{ami.pseudo}</span>
                    <span className="text-[9.5px] text-espresso/40">{pos ? `Vu ${new Date(pos.mis_a_jour_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Aucune position partagée'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocalisationScreen