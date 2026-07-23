import { useState, useEffect, useRef } from 'react'
import {
  chargerPersonnages,
  sauvegarderPersonnage,
  supprimerPersonnage,
  togglerFavoriPersonnage,
  creerPersonnageVide,
  creerPersonnageSecondaireVide,
  chargerMessagesPersonnage,
  sauvegarderMessagesPersonnage,
  reinitialiserConversationPersonnage,
  marquerNomConnu,
  CATEGORIES_PERSONNAGES,
  TRAITS_PERSONNAGE,
  calculerNiveauRelation,
  calculerScoreInitiative,
  mettreAJourRelationEtMemoire,
  DEFINITION_CHAPITRES,
} from '../services/personnages'

import { envoyerMessageAPersonnage, analyserRelationPersonnage } from '../services/gemini'
import { fichierVersBase64 } from '../services/images'
import { chargerParametres, FONDS_CHAT_DISPONIBLES } from '../services/parametres'
import { notifierErreur, notifierSucces } from '../services/notifications'

const IconCroix = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)
const IconCoeur = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M12 21s-7-4.4-9.5-8.5C0.7 8.8 2.2 5 6 5c2.1 0 3.5 1.2 4 2.3C10.5 6.2 11.9 5 14 5c3.8 0 5.3 3.8 3.5 7.5C19 16.6 12 21 12 21z" />
  </svg>
)
const IconRetour = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconEnvoi = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" />
  </svg>
)
const IconRefresh = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M21 2v6h-6M3 22v-6h6M3.5 9A9 9 0 0 1 21 6M20.5 15A9 9 0 0 1 3 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)
const IconCamera = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)
const IconImage = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="8.5" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.8" />
    <path d="M21 16l-5.2-5.2a1.5 1.5 0 0 0-2.1 0L4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconSmile = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="8.7" cy="10.2" r="1.1" fill="currentColor" />
    <circle cx="15.3" cy="10.2" r="1.1" fill="currentColor" />
    <path d="M7.8 14.2c1 1.4 2.4 2.1 4.2 2.1s3.2-.7 4.2-2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const IconEtoiles = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const IconCrayon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16.5 3.5a1.9 1.9 0 0 1 2.7 2.7L7 18.4l-3.6.8.8-3.6L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
)
const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconRecherche = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
    <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const IconDes = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="8" cy="8" r="1.3" fill="currentColor" />
    <circle cx="16" cy="8" r="1.3" fill="currentColor" />
    <circle cx="8" cy="16" r="1.3" fill="currentColor" />
    <circle cx="16" cy="16" r="1.3" fill="currentColor" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
  </svg>
)
const IconBulle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="currentColor" />
  </svg>
)

const EMOJIS_RAPIDES = ['😊', '😂', '❤️', '😍', '🥰', '😉', '😘', '😅', '😭', '😢', '😮', '🤔', '🔥', '✨', '👍', '💕']

const estAppareilTactile =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window)

function obtenirCategories(personnage) {
  if (!personnage) return []
  if (Array.isArray(personnage.categories) && personnage.categories.length) return personnage.categories
  if (personnage.categorie) return [personnage.categorie]
  return []
}
function libelleCategorie(id) {
  return CATEGORIES_PERSONNAGES.find((c) => c.id === id)?.label || id
}

function formaterCompteur(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

const EMOJIS_EMOTION = {
  détendu: '😌', heureux: '😊', joyeux: '😄', triste: '😔', énervé: '😤',
  jaloux: '😒', gêné: '😳', amoureux: '🥰', inquiet: '😟', nostalgique: '🥲',
  timide: '🙈', excité: '🤩', calme: '😐', blessé: '💔', confiant: '😏',
}
function emojiEmotion(emotion) {
  return EMOJIS_EMOTION[emotion?.toLowerCase?.()] || '💭'
}

function StylesAnimations() {
  return (
    <style>{`
      @keyframes yunaFadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes yunaCardIn { from { opacity: 0; transform: translateY(14px) scale(.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      @keyframes yunaMessageIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
      @keyframes yunaPopIn { from { opacity: 0; transform: scale(0.92) translateY(4px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      @keyframes yunaHeartBeat { 0%, 100% { transform: scale(1) } 30% { transform: scale(1.28) } 50% { transform: scale(1) } }
      @keyframes yunaGlowPulse { 0%, 100% { opacity: .55 } 50% { opacity: 1 } }
      @keyframes yunaModalIn { from { opacity: 0; transform: translateY(18px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }

      .yuna-fade-in { animation: yunaFadeIn .35s ease both; }
      .yuna-card-in { animation: yunaCardIn .4s cubic-bezier(.22,1,.36,1) both; }
      .yuna-message-in { animation: yunaMessageIn .28s ease-out both; }
      .yuna-pop-in { animation: yunaPopIn .18s ease-out both; }
      .yuna-heartbeat { animation: yunaHeartBeat .5s ease; }
      .yuna-glow-pulse { animation: yunaGlowPulse 2.4s ease-in-out infinite; }
      .yuna-modal-in { animation: yunaModalIn .28s cubic-bezier(.22,1,.36,1) both; }

      @media (prefers-reduced-motion: reduce) {
        .yuna-fade-in, .yuna-card-in, .yuna-message-in, .yuna-pop-in, .yuna-heartbeat, .yuna-glow-pulse, .yuna-modal-in {
          animation: none !important;
        }
      }
    `}</style>
  )
}

function AvatarPersonnage({ personnage, taille = 48, modifiable = false, onModifier }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: taille, height: taille }}>
      <div
        className="rounded-full w-full h-full transition-transform duration-300"
        style={{ boxShadow: `0 3px 10px ${personnage.couleur}45, 0 0 0 2.5px white` }}
      >
        {personnage.avatarUrl ? (
          <img src={personnage.avatarUrl} alt={personnage.nom} className="rounded-full object-cover w-full h-full" />
        ) : (
          <div
            className="rounded-full flex items-center justify-center w-full h-full text-white font-semibold"
            style={{ background: `linear-gradient(135deg, ${personnage.couleur}, color-mix(in srgb, ${personnage.couleur}, black 25%))`, fontSize: taille * 0.4 }}
          >
            {personnage.nom.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      {modifiable && (
        <button
          onClick={(e) => { e.stopPropagation(); onModifier?.() }}
          title="Changer la photo"
          aria-label="Changer la photo de profil"
          className="absolute -bottom-0.5 -right-0.5 rounded-full bg-espresso text-peony flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/50"
          style={{ width: Math.max(18, taille * 0.34), height: Math.max(18, taille * 0.34) }}
        >
          <IconCamera style={{ width: '55%', height: '55%' }} />
        </button>
      )}
    </div>
  )
}

function BarreProgression({ label, valeur, couleur, icone }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8.5px] text-espresso/45 flex items-center gap-1">{icone} {label}</span>
        <span className="text-[8.5px] font-semibold text-espresso/55">{Math.round(valeur)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-espresso/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.max(2, Math.min(100, valeur))}%`, background: couleur }}
        />
      </div>
    </div>
  )
}

function BandeauCarte({ personnage, children, hauteur = 'h-28' }) {
  const styleFond = !personnage.avatarUrl
    ? { background: `linear-gradient(135deg, ${personnage.couleur}, color-mix(in srgb, ${personnage.couleur}, black 30%))` }
    : {}

  return (
    <div className={`${hauteur} relative flex items-end p-3 overflow-hidden`} style={styleFond}>
      {personnage.avatarUrl && (
        <>
          <img src={personnage.avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${personnage.couleur}05 0%, ${personnage.couleur}30 55%, ${personnage.couleur}95 118%)` }} />
        </>
      )}
      <div className="relative z-10 w-full h-full flex items-end">{children}</div>
    </div>
  )
}

function PersonnagesScreen() {
  const [personnages, setPersonnages] = useState([])
  const [categoriesFiltre, setCategoriesFiltre] = useState([])
  const [recherche, setRecherche] = useState('')
  const [favorisDabord, setFavorisDabord] = useState(false)
  const [compteurMessages, setCompteurMessages] = useState({})

  const [personnageActif, setPersonnageActif] = useState(null)
  const [messages, setMessages] = useState([])
  const [saisie, setSaisie] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [enTrainDecrire, setEnTrainDecrire] = useState(false)

  const [photoEnAttente, setPhotoEnAttente] = useState(null)
  const [emojiPickerOuvert, setEmojiPickerOuvert] = useState(false)

  const [fondEcran] = useState(() => chargerParametres())

  const [afficherCreateur, setAfficherCreateur] = useState(false)
  const [personnageEnEdition, setPersonnageEnEdition] = useState(null)
  const [modeEdition, setModeEdition] = useState(false)

  const [afficherFiche, setAfficherFiche] = useState(false)

  const basDeListeRef = useRef(null)
  const inputAvatarRef = useRef(null)
  const inputAvatarRapideRef = useRef(null)
  const inputPhotoConversationRef = useRef(null)
  const zoneTexteRef = useRef(null)
  const personnagePourChangerPhotoRef = useRef(null)

  useEffect(() => {
    setPersonnages(chargerPersonnages())
  }, [])

  useEffect(() => {
    const compteurs = {}
    personnages.forEach((p) => {
      try {
        compteurs[p.id] = chargerMessagesPersonnage(p).length
      } catch {
        compteurs[p.id] = 0
      }
    })
    setCompteurMessages(compteurs)
  }, [personnages])

  useEffect(() => {
    basDeListeRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, enTrainDecrire])

  useEffect(() => {
    const champ = zoneTexteRef.current
    if (!champ) return
    champ.style.height = 'auto'
    champ.style.height = Math.min(champ.scrollHeight, 128) + 'px'
  }, [saisie])

  const personnagesFiltres = personnages
    .filter((p) => {
      const categoriesDuPersonnage = obtenirCategories(p)
      const correspondCategorie = categoriesFiltre.length === 0 ||
        categoriesDuPersonnage.some((c) => categoriesFiltre.includes(c))
      const correspondRecherche = p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(recherche.toLowerCase()))
      return correspondCategorie && correspondRecherche
    })
    .sort((a, b) => (favorisDabord ? (b.favori ? 1 : 0) - (a.favori ? 1 : 0) : 0))

  const toggleFiltreCategorie = (id) => {
    setCategoriesFiltre((actuelles) =>
      actuelles.includes(id) ? actuelles.filter((c) => c !== id) : [...actuelles, id]
    )
  }

  const ouvrirPersonnage = (personnage) => {
    setPersonnageActif(personnage)
    setMessages(chargerMessagesPersonnage(personnage))
    setPhotoEnAttente(null)
    setEmojiPickerOuvert(false)
  }

  const ouvrirPersonnageAleatoire = () => {
    const liste = personnagesFiltres.length > 0 ? personnagesFiltres : personnages
    if (liste.length === 0) return
    const choisi = liste[Math.floor(Math.random() * liste.length)]
    ouvrirPersonnage(choisi)
  }

  const retourALaGrille = () => {
    setPersonnageActif(null)
    setMessages([])
  }

  const toggleFavori = (e, id) => {
    e.stopPropagation()
    setPersonnages(togglerFavoriPersonnage(id))
  }

  const demanderChangementPhoto = (personnage) => {
    personnagePourChangerPhotoRef.current = personnage
    inputAvatarRapideRef.current?.click()
  }

  const gererChangementPhotoRapide = async (e) => {
    const fichier = e.target.files[0]
    const cible = personnagePourChangerPhotoRef.current
    e.target.value = ''
    if (!fichier || !cible) return
    const base64 = await fichierVersBase64(fichier)
    const personnageMaj = { ...cible, avatarUrl: base64 }
    const personnagesMaj = sauvegarderPersonnage(personnageMaj)
    setPersonnages(personnagesMaj)
    if (personnageActif?.id === cible.id) setPersonnageActif(personnageMaj)
  }

  const insererAsterisques = () => {
    const champ = zoneTexteRef.current
    if (!champ) return
    const debut = champ.selectionStart ?? saisie.length
    const fin = champ.selectionEnd ?? saisie.length
    const selection = saisie.slice(debut, fin)
    let nouveauTexte, positionCurseur
    if (selection) {
      nouveauTexte = saisie.slice(0, debut) + '*' + selection + '*' + saisie.slice(fin)
      positionCurseur = debut + selection.length + 2
    } else {
      nouveauTexte = saisie.slice(0, debut) + '**' + saisie.slice(fin)
      positionCurseur = debut + 1
    }
    setSaisie(nouveauTexte)
    requestAnimationFrame(() => { champ.focus(); champ.setSelectionRange(positionCurseur, positionCurseur) })
  }

  const insererEmoji = (emoji) => {
    const champ = zoneTexteRef.current
    const position = champ?.selectionStart ?? saisie.length
    const nouveauTexte = saisie.slice(0, position) + emoji + saisie.slice(position)
    setSaisie(nouveauTexte)
    requestAnimationFrame(() => { champ?.focus(); const p = position + emoji.length; champ?.setSelectionRange(p, p) })
  }

  const gererSelectionPhotoConversation = async (e) => {
    const fichier = e.target.files[0]
    e.target.value = ''
    if (!fichier) return
    const base64 = await fichierVersBase64(fichier)
    setPhotoEnAttente(base64)
  }
  const retirerPhotoEnAttente = () => setPhotoEnAttente(null)

  const envoyerMessage = async () => {
    if ((!saisie.trim() && !photoEnAttente) || envoiEnCours || !personnageActif) return
    const texteUtilisateur = saisie
    const image = photoEnAttente

    const patternPresentation = /je m'appelle|mon prénom est|je me nomme|je m'nomme/i
    if (patternPresentation.test(texteUtilisateur) && !personnageActif.connaitNomUtilisateur) {
      const personnagesMaj = marquerNomConnu(personnageActif.id, true)
      setPersonnages(personnagesMaj)
      const persoMaj = personnagesMaj.find((p) => p.id === personnageActif.id)
      if (persoMaj) setPersonnageActif(persoMaj)
    }

    const messageUtilisateur = {
      id: Date.now(), auteur: 'user', texte: texteUtilisateur, image,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }

    const nouveauxMessages = [...messages, messageUtilisateur]
    setMessages(nouveauxMessages)
    sauvegarderMessagesPersonnage(personnageActif.id, nouveauxMessages)
    setSaisie('')
    setPhotoEnAttente(null)
    setEmojiPickerOuvert(false)
    setEnvoiEnCours(true)
    setEnTrainDecrire(true)

    const historiquePourGemini = nouveauxMessages.slice(1).map((m) => ({
      ...m, auteur: m.auteur === 'personnage' ? 'model' : m.auteur,
    }))

    try {
      const reponseTexte = await envoyerMessageAPersonnage(historiquePourGemini, texteUtilisateur, personnageActif, image)

      setEnTrainDecrire(false)
      setEnvoiEnCours(false)

      const messagesAvecReponse = [...nouveauxMessages, {
        id: Date.now() + 1, auteur: 'personnage', texte: reponseTexte,
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]
      setMessages(messagesAvecReponse)
      sauvegarderMessagesPersonnage(personnageActif.id, messagesAvecReponse)

      if (messagesAvecReponse.length % 6 === 0) {
        analyserRelationPersonnage(personnageActif, messagesAvecReponse.slice(-6)).then((resultat) => {
          if (resultat) {
            const niveauAncien = calculerNiveauRelation(personnageActif.relation?.confiance ?? 20)
            const chapitreAncien = personnageActif.progression?.chapitreActuel ?? 1

            const personnagesMaj = mettreAJourRelationEtMemoire(personnageActif.id, resultat)
            setPersonnages(personnagesMaj)

            const persoMaj = personnagesMaj.find((p) => p.id === personnageActif.id)
            if (persoMaj) {
              setPersonnageActif(persoMaj)

              const niveauNouveau = calculerNiveauRelation(persoMaj.relation?.confiance ?? 20)
              const chapitreNouveau = persoMaj.progression?.chapitreActuel ?? 1

              if (chapitreNouveau > chapitreAncien) {
                const defChapitre = DEFINITION_CHAPITRES.find((c) => c.numero === chapitreNouveau)
                notifierSucces(`Nouveau chapitre débloqué avec ${persoMaj.nom} : ${defChapitre?.titre || `Chapitre ${chapitreNouveau}`}`)
              } else if (niveauNouveau !== niveauAncien) {
                notifierSucces(`Votre relation avec ${persoMaj.nom} a évolué : ${niveauNouveau}`)
              }
            }
          }
        })
      }
    } catch (erreur) {
      setEnTrainDecrire(false)
      setEnvoiEnCours(false)
      notifierErreur(erreur.message || "Le personnage n'a pas pu répondre. Réessaie.")
    }
  }

  const continuerHistoire = async () => {
    if (envoiEnCours || !personnageActif || messages.length === 0) return
    setEnvoiEnCours(true)
    setEnTrainDecrire(true)

    const historiquePourGemini = messages.slice(1).map((m) => ({
      ...m, auteur: m.auteur === 'personnage' ? 'model' : m.auteur,
    }))

    // Le message injecté dépend du profil d'initiative du personnage —
    // un personnage froid/réservé ne doit JAMAIS "prendre les devants"
    // juste parce qu'on a cliqué sur ce bouton.
    const scoreInitiative = calculerScoreInitiative(personnageActif.traits)
    const messageContinuer = scoreInitiative < 0
      ? `*Un moment passe. Décris brièvement ce que tu fais ou ressens dans la scène actuelle.
Réagis d'abord aux actions ou paroles récentes du joueur si nécessaire.
Ne répète jamais les mêmes gestes, pensées ou descriptions déjà utilisés.
Évite les boucles comme regarder son téléphone, regarder autour de soi, soupirer ou réfléchir sans fin.
Si le joueur est présent, reste conscient de lui même sans forcément parler.
Ne fais pas de long monologue intérieur. Maximum 2-3 phrases.
Tu n'inities pas une nouvelle conversation, mais tu continues naturellement la scène.*`
      : "*Continue la scène naturellement. Fais une action ou une réaction cohérente sans attendre la réponse du joueur. Ne répète aucune action déjà décrite.*"

    try {
      const reponseTexte = await envoyerMessageAPersonnage(
        historiquePourGemini,
        messageContinuer,
        personnageActif
      )

      setEnTrainDecrire(false)
      setEnvoiEnCours(false)

      const messagesAvecReponse = [...messages, {
        id: Date.now(), auteur: 'personnage', texte: reponseTexte,
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]
      setMessages(messagesAvecReponse)
      sauvegarderMessagesPersonnage(personnageActif.id, messagesAvecReponse)
    } catch (erreur) {
      setEnTrainDecrire(false)
      setEnvoiEnCours(false)
      notifierErreur(erreur.message || "Impossible de continuer l'histoire. Réessaie.")
    }
  }

  const gererToucheEntree = (e) => {
    if (estAppareilTactile) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (saisie.trim() || photoEnAttente) envoyerMessage()
      else continuerHistoire()
    }
  }

  const recommencerHistoire = () => {
    const confirme = window.confirm(`Recommencer complètement l'histoire avec ${personnageActif.nom} ? La relation, les souvenirs et tout ce qu'il/elle sait de toi seront effacés — vous repartirez en parfaits inconnus.`)
    if (!confirme) return
    const { messages: messagesReset, personnages: personnagesMaj } = reinitialiserConversationPersonnage(personnageActif)
    setMessages(messagesReset)
    setPersonnages(personnagesMaj)
    setPersonnageActif(personnagesMaj.find((p) => p.id === personnageActif.id))
  }

  const modifierMessagePersonnage = async (idMessage, nouveauTexte) => {
    const index = messages.findIndex((m) => m.id === idMessage)
    if (index === -1) return

    const messagesAvant = messages.slice(0, index)
    const messageModifie = { ...messages[index], texte: nouveauTexte, modifie: true }
    const nouveauxMessages = [...messagesAvant, messageModifie]

    setMessages(nouveauxMessages)
    sauvegarderMessagesPersonnage(personnageActif.id, nouveauxMessages)
    setEnvoiEnCours(true)
    setEnTrainDecrire(true)

    const historiquePourGemini = nouveauxMessages.slice(1).map((m) => ({
      ...m, auteur: m.auteur === 'personnage' ? 'model' : m.auteur,
    }))

    try {
      const reponseTexte = await envoyerMessageAPersonnage(historiquePourGemini, nouveauTexte, personnageActif)
      setEnTrainDecrire(false)
      setEnvoiEnCours(false)
      const messagesFinaux = [...nouveauxMessages, {
        id: Date.now(), auteur: 'personnage', texte: reponseTexte,
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]
      setMessages(messagesFinaux)
      sauvegarderMessagesPersonnage(personnageActif.id, messagesFinaux)
    } catch (erreur) {
      setEnTrainDecrire(false)
      setEnvoiEnCours(false)
      notifierErreur(erreur.message || "Le personnage n'a pas pu répondre.")
    }
  }

  const redemarrerApartirDe = (idMessage) => {
    const confirme = window.confirm("Redémarrer l'histoire à partir de ce message ? Tout ce qui suit sera effacé.")
    if (!confirme) return
    const index = messages.findIndex((m) => m.id === idMessage)
    if (index === -1) return
    const messagesConserves = messages.slice(0, index + 1)
    setMessages(messagesConserves)
    sauvegarderMessagesPersonnage(personnageActif.id, messagesConserves)
  }

  const ouvrirCreateur = (personnageAModifier = null) => {
    const base = personnageAModifier || creerPersonnageVide()
    setPersonnageEnEdition({ ...base, categories: obtenirCategories(base) })
    setModeEdition(!!personnageAModifier)
    setAfficherCreateur(true)
  }
  const fermerCreateur = () => {
    setAfficherCreateur(false)
    setPersonnageEnEdition(null)
    setModeEdition(false)
  }
  const modifierChampCreation = (champ, valeur) => setPersonnageEnEdition((ancien) => ({ ...ancien, [champ]: valeur }))
  const toggleCategorieEdition = (id) => {
    setPersonnageEnEdition((ancien) => {
      const actuelles = ancien.categories || []
      const nouvelles = actuelles.includes(id) ? actuelles.filter((c) => c !== id) : [...actuelles, id]
      return { ...ancien, categories: nouvelles }
    })
  }

  const toggleTraitEdition = (id) => {
    setPersonnageEnEdition((ancien) => {
      const actuels = ancien.traits || []
      const nouveaux = actuels.includes(id) ? actuels.filter((t) => t !== id) : [...actuels, id]
      return { ...ancien, traits: nouveaux }
    })
  }

  const ajouterPersonnageSecondaire = () => {
    setPersonnageEnEdition((a) => ({ ...a, personnagesSecondaires: [...(a.personnagesSecondaires || []), creerPersonnageSecondaireVide()] }))
  }
  const modifierPersonnageSecondaire = (id, champ, valeur) => {
    setPersonnageEnEdition((a) => ({
      ...a,
      personnagesSecondaires: (a.personnagesSecondaires || []).map((s) => s.id === id ? { ...s, [champ]: valeur } : s),
    }))
  }
  const supprimerPersonnageSecondaire = (id) => {
    setPersonnageEnEdition((a) => ({ ...a, personnagesSecondaires: (a.personnagesSecondaires || []).filter((s) => s.id !== id) }))
  }

  const gererUploadAvatar = async (e) => {
    const fichier = e.target.files[0]
    if (!fichier) return
    const base64 = await fichierVersBase64(fichier)
    modifierChampCreation('avatarUrl', base64)
  }
  const validerCreation = () => {
    const categoriesChoisies = personnageEnEdition.categories || []
    if (!personnageEnEdition.nom.trim() || !personnageEnEdition.sceneOuverture.trim() || categoriesChoisies.length === 0) {
      alert('Le nom, au moins une catégorie et la scène d\'ouverture sont obligatoires.')
      return
    }
    const personnageAEnregistrer = { ...personnageEnEdition, categories: categoriesChoisies, categorie: categoriesChoisies[0] }
    const personnagesMaj = sauvegarderPersonnage(personnageAEnregistrer)
    setPersonnages(personnagesMaj)
    if (personnageActif?.id === personnageAEnregistrer.id) setPersonnageActif(personnageAEnregistrer)
    fermerCreateur()
  }

  const supprimerPersonnageActuel = (e, personnage) => {
    e.stopPropagation()
    const messageConfirmation = personnage.origine === 'predefini'
      ? `${personnage.nom} est un personnage par défaut de l'app — le supprimer est définitif, il ne reviendra jamais automatiquement. Continuer ?`
      : `Supprimer définitivement ${personnage.nom} et sa conversation ?`
    const confirme = window.confirm(messageConfirmation)
    if (!confirme) return
    setPersonnages(supprimerPersonnage(personnage.id))
  }

  const styleFondConversation = (() => {
    if (fondEcran.fondEcranChat === 'personnalise' && fondEcran.fondEcranChatPerso) {
      return {
        backgroundImage: `linear-gradient(rgba(255,248,245,0.7), rgba(255,248,245,0.7)), url(${fondEcran.fondEcranChatPerso})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }
    }
    const preset = FONDS_CHAT_DISPONIBLES.find((f) => f.id === fondEcran.fondEcranChat)
    if (preset?.style && fondEcran.fondEcranChat !== 'defaut') return { background: preset.style }
    return { background: `linear-gradient(180deg, color-mix(in srgb, ${personnageActif?.couleur || '#C4688A'} 9%, var(--color-cream)) 0%, var(--color-cream) 320px)` }
  })()

  // ================================================================
  // ÉCRAN DE CONVERSATION
  // ================================================================
  if (personnageActif) {
    const saisieVide = !saisie.trim() && !photoEnAttente
    const niveauRelation = calculerNiveauRelation(personnageActif.relation?.confiance ?? 20)
    const affection = personnageActif.relation?.affection ?? 10

    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden" style={styleFondConversation}>
        <StylesAnimations />

        <input ref={inputPhotoConversationRef} type="file" accept="image/*" onChange={gererSelectionPhotoConversation} className="hidden" />
        <input ref={inputAvatarRapideRef} type="file" accept="image/*" onChange={gererChangementPhotoRapide} className="hidden" />

        {/* ===== HEADER CHAT ===== */}
        <div
          className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-3.5 bg-white/90 backdrop-blur-md border-b flex-shrink-0"
          style={{ borderColor: `${personnageActif.couleur}25` }}
        >
          <button onClick={retourALaGrille} aria-label="Retour à la liste des personnages" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40">
            <IconRetour style={{ width: '16px', height: '16px' }} className="text-espresso/60" />
          </button>
          <AvatarPersonnage personnage={personnageActif} taille={40} modifiable onModifier={() => demanderChangementPhoto(personnageActif)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-espresso truncate">{personnageActif.nom}</p>
              <span className="text-[12px] flex-shrink-0" title={`Se sent ${personnageActif.emotionActuelle || 'détendu'}`}>{emojiEmotion(personnageActif.emotionActuelle)}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: `${personnageActif.couleur}18`, color: personnageActif.couleur }}>
                {niveauRelation}
              </span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[9px] flex-shrink-0">💛</span>
                <div className="h-1 w-14 rounded-full bg-espresso/10 overflow-hidden flex-shrink-0">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, affection))}%`, background: personnageActif.couleur }} />
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => ouvrirCreateur(personnageActif)} aria-label="Modifier ce personnage" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40" title="Modifier ce personnage">
            <IconCrayon style={{ width: '14px', height: '14px' }} className="text-espresso/50" />
          </button>
          <button onClick={() => setAfficherFiche(true)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200 flex-shrink-0" title="Voir la fiche personnage">
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '14px', height: '14px' }} className="text-espresso/50">
              <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="8" y1="16" x2="12" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button onClick={recommencerHistoire} aria-label="Recommencer l'histoire" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40" title="Recommencer l'histoire">
            <IconRefresh style={{ width: '15px', height: '15px' }} className="text-espresso/50" />
          </button>
        </div>

        {/* ===== MESSAGES ===== */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-suave p-3 sm:p-4 md:p-6 flex flex-col gap-3">
          {messages.map((message, idx) => {
            const estUser = message.auteur === 'user'
            return (
              <div
                key={message.id}
                className={`yuna-message-in group flex items-end gap-2 ${estUser ? 'flex-row-reverse' : 'flex-row'}`}
                style={{ animationDelay: `${Math.min(idx, 6) * 25}ms` }}
              >
                {!estUser && <AvatarPersonnage personnage={personnageActif} taille={28} />}
                <div className={`flex flex-col ${estUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Photo envoyée"
                      className={`mb-1 max-w-[220px] max-h-[220px] object-cover rounded-2xl border shadow-sm ${estUser ? 'rounded-br-[6px]' : 'rounded-bl-[6px]'}`}
                      style={{ borderColor: `${personnageActif.couleur}30` }}
                    />
                  )}
                  {message.texte && (
                    <div
                      className={`px-4 py-2.5 text-[12px] leading-relaxed whitespace-pre-line break-words shadow-sm ${
                        estUser ? 'text-peony rounded-[20px] rounded-br-[5px]' : 'bg-white/95 backdrop-blur text-espresso border rounded-[20px] rounded-bl-[5px]'
                      }`}
                      style={estUser
                        ? { background: `linear-gradient(135deg, var(--color-espresso), color-mix(in srgb, var(--color-espresso), black 15%))` }
                        : { borderColor: `${personnageActif.couleur}25`, boxShadow: '0 3px 10px rgba(62,39,35,0.06)' }}
                    >
                      {message.texte.split(/(\*[^*]+\*)/g).map((morceau, i) =>
                        morceau.startsWith('*') && morceau.endsWith('*') && morceau.length > 1 ? (
                          <em key={i} className={estUser ? 'text-peony/70' : 'text-espresso/50'}>{morceau.slice(1, -1)}</em>
                        ) : (<span key={i}>{morceau}</span>)
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-0.5 px-1">
                    {message.heure && <span className="text-[8px] text-espresso/30">{message.heure}{message.modifie && ' · modifié'}</span>}
                    {estUser && (
                      <button
                        onClick={() => {
                          const nouveauTexte = window.prompt('Modifier ton message :', message.texte)
                          if (nouveauTexte && nouveauTexte.trim() && nouveauTexte !== message.texte) {
                            modifierMessagePersonnage(message.id, nouveauTexte.trim())
                          }
                        }}
                        className="text-[8px] text-espresso/30 hover:text-espresso/60 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 underline focus-visible:opacity-100"
                      >
                        modifier
                      </button>
                    )}
                    <button
                      onClick={() => redemarrerApartirDe(message.id)}
                      className="text-[8px] text-espresso/30 hover:text-espresso/60 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 underline focus-visible:opacity-100"
                    >
                      redémarrer ici
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {enTrainDecrire && (
            <div className="yuna-message-in flex items-end gap-2">
              <AvatarPersonnage personnage={personnageActif} taille={28} />
              <div className="bg-white/95 backdrop-blur border rounded-[20px] rounded-bl-[5px] px-4 py-3 flex gap-1.5 shadow-sm" style={{ borderColor: `${personnageActif.couleur}25` }}>
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: personnageActif.couleur, animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: personnageActif.couleur, animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: personnageActif.couleur, animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={basDeListeRef} />
        </div>

        {/* ===== SAISIE ===== */}
        <div className="flex-shrink-0 bg-white/95 backdrop-blur-md border-t" style={{ borderColor: `${personnageActif.couleur}25`, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {photoEnAttente && (
            <div className="yuna-pop-in flex items-center gap-2 px-3 sm:px-4 md:px-6 pt-3">
              <div className="relative">
                <img src={photoEnAttente} alt="À envoyer" className="w-14 h-14 object-cover rounded-xl border shadow-sm" style={{ borderColor: `${personnageActif.couleur}40` }} />
                <button onClick={retirerPhotoEnAttente} aria-label="Retirer la photo" className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-espresso text-peony flex items-center justify-center shadow">
                  <IconCroix style={{ width: '10px', height: '10px' }} />
                </button>
              </div>
              <span className="text-[10px] text-espresso/40">Photo prête à être envoyée</span>
            </div>
          )}

          {emojiPickerOuvert && (
            <div className="yuna-pop-in mx-3 sm:mx-4 md:mx-6 mt-3 mb-1 bg-cream border rounded-2xl p-2.5 grid grid-cols-8 gap-1" style={{ borderColor: `${personnageActif.couleur}30` }}>
              {EMOJIS_RAPIDES.map((emoji) => (
                <button key={emoji} onClick={() => insererEmoji(emoji)} className="text-[18px] rounded-lg py-1 hover:bg-white hover:scale-110 transition-all duration-150">
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-1 sm:gap-2 px-2 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3.5">
            <button onClick={() => inputPhotoConversationRef.current?.click()} title="Envoyer une photo" aria-label="Envoyer une photo" className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-espresso/45 hover:bg-espresso/5 hover:text-espresso/70 transition-colors duration-200">
              <IconImage style={{ width: '16px', height: '16px' }} />
            </button>
            <button
              onClick={() => setEmojiPickerOuvert((o) => !o)}
              title="Emojis"
              aria-label="Ouvrir les emojis"
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
              style={emojiPickerOuvert ? { background: `${personnageActif.couleur}20`, color: personnageActif.couleur } : undefined}
            >
              <IconSmile style={{ width: '16px', height: '16px' }} className={emojiPickerOuvert ? '' : 'text-espresso/45'} />
            </button>
            <button onClick={insererAsterisques} title="Ajouter une action *comme ceci*" aria-label="Ajouter une action" className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-espresso/45 hover:bg-espresso/5 hover:text-espresso/70 transition-colors duration-200">
              **
            </button>

            <textarea
              ref={zoneTexteRef}
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={gererToucheEntree}
              placeholder={`Réponds à ${personnageActif.nom}...`}
              disabled={envoiEnCours}
              rows={1}
              aria-label="Ton message"
              className="flex-1 min-w-0 bg-cream border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-[16px] md:text-[13px] text-espresso placeholder:text-espresso/40 outline-none transition-all duration-200 disabled:opacity-50 resize-none max-h-32 leading-relaxed focus:shadow-sm"
              style={{ borderColor: `${personnageActif.couleur}40`, minHeight: '46px' }}
            />

            {saisieVide ? (
              <button
                onClick={continuerHistoire}
                disabled={envoiEnCours || messages.length === 0}
                title="Rien à dire ? Laisse le personnage continuer la scène"
                aria-label="Laisser le personnage continuer l'histoire"
                className="h-11 px-2.5 sm:px-3.5 rounded-full flex items-center gap-1 sm:gap-1.5 flex-shrink-0 text-[9.5px] sm:text-[10.5px] font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-90 disabled:opacity-35 disabled:hover:translate-y-0 whitespace-nowrap shadow-sm"
                style={{ background: `${personnageActif.couleur}18`, color: personnageActif.couleur }}
              >
                <IconEtoiles style={{ width: '13px', height: '13px' }} className="flex-shrink-0" />
                <span className="hidden sm:inline">Continuer</span>
              </button>
            ) : (
              <button
                onClick={envoyerMessage}
                disabled={envoiEnCours}
                aria-label="Envoyer le message"
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:-translate-y-0.5 active:scale-90 disabled:opacity-35 disabled:hover:translate-y-0 shadow-md"
                style={{ background: `linear-gradient(135deg, ${personnageActif.couleur}, color-mix(in srgb, ${personnageActif.couleur}, black 20%))` }}
              >
                <IconEnvoi className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          <p className="sm:hidden text-center text-[8.5px] text-espresso/30 pb-1.5 -mt-1">
            {estAppareilTactile ? 'Astuce : entoure ton texte de * pour une action' : 'Entrée pour envoyer'}
          </p>
        </div>

        {/* MODAL FICHE PERSONNAGE */}
        {afficherFiche && (() => {
          const chapitreActuel = DEFINITION_CHAPITRES.find((c) => c.numero === personnageActif.progression?.chapitreActuel) || DEFINITION_CHAPITRES[0]
          const r = personnageActif.relation || {}
          const statsAffichees = [
            { label: 'Confiance', valeur: r.confiance ?? 20 }, { label: 'Affection', valeur: r.affection ?? 10 },
            { label: 'Respect', valeur: r.respect ?? 20 }, { label: 'Complicité', valeur: r.complicite ?? 10 },
            { label: 'Romance', valeur: r.romance ?? 0 }, { label: 'Jalousie', valeur: r.jalousie ?? 0 },
          ]
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-espresso/60 yuna-fade-in" onClick={() => setAfficherFiche(false)}>
              <div className="yuna-modal-in bg-white rounded-3xl w-full max-w-[520px] max-h-[85vh] overflow-y-auto scroll-suave p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <AvatarPersonnage personnage={personnageActif} taille={44} />
                    <div>
                      <p className="font-semibold text-espresso" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px' }}>{personnageActif.nom}</p>
                      <p className="text-[10px] text-espresso/45">Émotion actuelle : {personnageActif.emotionActuelle || 'détendu'}</p>
                    </div>
                  </div>
                  <button onClick={() => setAfficherFiche(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-espresso/5">
                    <IconCroix style={{ width: '16px', height: '16px' }} className="text-espresso/50" />
                  </button>
                </div>

                {/* Chapitre */}
                <div className="rounded-2xl p-4 mb-4" style={{ background: `${personnageActif.couleur}12` }}>
                  <p className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: personnageActif.couleur }}>
                    Chapitre {chapitreActuel.numero} sur {DEFINITION_CHAPITRES.length}
                  </p>
                  <p className="text-[14px] font-semibold text-espresso mt-0.5">{chapitreActuel.titre}</p>
                  <p className="text-[10.5px] text-espresso/55 mt-1">{chapitreActuel.objectif}</p>
                  <div className="h-1.5 rounded-full bg-espresso/10 overflow-hidden mt-2.5">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(chapitreActuel.numero / DEFINITION_CHAPITRES.length) * 100}%`, background: personnageActif.couleur }} />
                  </div>
                </div>

                {/* Statistiques de relation */}
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Votre relation</p>
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {statsAffichees.map((s) => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-espresso/55">{s.label}</span>
                        <span className="text-[10px] font-semibold text-espresso">{s.valeur}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-espresso/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.valeur}%`, background: personnageActif.couleur }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ce qu'il sait de toi */}
                {(personnageActif.faitsSurUtilisateur || []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Ce qu'il/elle sait de toi</p>
                    <div className="flex flex-col gap-1">
                      {personnageActif.faitsSurUtilisateur.map((f, i) => (
                        <p key={i} className="text-[11.5px] text-espresso bg-[#F0EEEB] rounded-lg px-3 py-1.5">{f}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Souvenirs importants (timeline) */}
                {(personnageActif.souvenirsImportants || []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Souvenirs marquants</p>
                    <div className="flex flex-col gap-2">
                      {[...personnageActif.souvenirsImportants].reverse().map((s, i) => (
                        <div key={i} className="border-l-2 pl-3" style={{ borderColor: personnageActif.couleur }}>
                          <p className="text-[11px] font-semibold text-espresso">{s.titre}</p>
                          <p className="text-[10px] text-espresso/55">{s.description}</p>
                          <p className="text-[9px] text-espresso/35 mt-0.5">{s.date} · {s.emotion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personnages secondaires */}
                {(personnageActif.personnagesSecondaires || []).length > 0 && (
                  <div>
                    <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Personnages de son entourage</p>
                    <div className="flex flex-col gap-1.5">
                      {personnageActif.personnagesSecondaires.map((s) => (
                        <div key={s.id} className="bg-[#F0EEEB] rounded-lg px-3 py-2">
                          <p className="text-[11px] font-semibold text-espresso">{s.nom} <span className="text-espresso/45 font-normal">— {s.role}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    )
  }

  // ================================================================
  // GRILLE DES PERSONNAGES (façon "Explorer")
  // ================================================================
  return (
    <div className="h-full min-h-0 w-full overflow-y-auto scroll-suave bg-cream">
      <StylesAnimations />
      <input ref={inputAvatarRapideRef} type="file" accept="image/*" onChange={gererChangementPhotoRapide} className="hidden" />
      <div className="px-3 sm:px-5 md:px-8 py-4 md:py-6 pb-10">

        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between mb-4 gap-3 yuna-fade-in">
          <div className="min-w-0">
            <h1 className="text-espresso font-semibold truncate" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '25px' }}>Personnages</h1>
            <p className="text-[10px] text-espresso/45 mt-0.5 truncate">
              {personnages.length} personnage{personnages.length > 1 ? 's' : ''}
              {personnages.some((p) => p.favori) && ` · ${personnages.filter((p) => p.favori).length} favori${personnages.filter((p) => p.favori).length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {personnages.length > 0 && (
              <button
                onClick={ouvrirPersonnageAleatoire}
                title="Ouvrir un personnage au hasard"
                aria-label="Ouvrir un personnage au hasard"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-espresso/10 hover:bg-espresso/5 transition-colors duration-200"
              >
                <IconDes style={{ width: '15px', height: '15px' }} className="text-espresso/60" />
              </button>
            )}
            <button
              onClick={() => ouvrirCreateur()}
              aria-label="Créer un personnage"
              className="flex items-center gap-1.5 bg-espresso text-peony rounded-full px-4 h-10 text-[11.5px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
            >
              <IconPlus style={{ width: '13px', height: '13px' }} />
              <span className="hidden sm:inline">Créer</span>
            </button>
          </div>
        </div>

        {/* ===== RECHERCHE ===== */}
        <div className="relative mb-4">
          <IconRecherche style={{ width: '14px', height: '14px' }} className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso/35 pointer-events-none" />
          <input
            type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un personnage..."
            aria-label="Rechercher un personnage"
            className="w-full bg-white border border-espresso/10 rounded-full pl-10 pr-9 py-3 text-[12px] text-espresso placeholder:text-espresso/35 outline-none focus:border-espresso/30 focus:shadow-sm transition-all duration-200"
          />
          {recherche && (
            <button onClick={() => setRecherche('')} aria-label="Effacer la recherche" className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-espresso/8 hover:bg-espresso/15 flex items-center justify-center transition-colors duration-150">
              <IconCroix style={{ width: '9px', height: '9px' }} className="text-espresso/50" />
            </button>
          )}
        </div>

        {/* ===== CATÉGORIES (style onglets) + FAVORIS ===== */}
        <div className="flex items-center gap-4 mb-5 overflow-x-auto pb-0 border-b border-espresso/10" style={{ scrollbarWidth: 'none', touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setCategoriesFiltre([])}
            className="flex-shrink-0 text-[12.5px] font-semibold pb-2.5 pt-0.5 transition-all duration-200 border-b-2 whitespace-nowrap"
            style={{ color: categoriesFiltre.length === 0 ? 'var(--color-espresso)' : 'rgba(62,39,35,0.4)', borderColor: categoriesFiltre.length === 0 ? 'var(--color-espresso)' : 'transparent' }}
          >
            Tous
          </button>
          {CATEGORIES_PERSONNAGES.map((cat) => {
            const actif = categoriesFiltre.includes(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggleFiltreCategorie(cat.id)}
                className="flex-shrink-0 text-[12.5px] font-semibold pb-2.5 pt-0.5 transition-all duration-200 border-b-2 whitespace-nowrap"
                style={{ color: actif ? 'var(--color-espresso)' : 'rgba(62,39,35,0.4)', borderColor: actif ? 'var(--color-espresso)' : 'transparent' }}
              >
                {cat.label}
              </button>
            )
          })}
          <button
            onClick={() => setFavorisDabord((v) => !v)}
            className="flex-shrink-0 flex items-center gap-1 ml-auto mb-1.5 rounded-full text-[10.5px] font-medium px-3 py-1.5 transition-all duration-200 active:scale-95"
            style={{ background: favorisDabord ? '#F4EBC8' : 'rgba(62,39,35,0.06)', color: favorisDabord ? '#8A6D1F' : 'rgba(62,39,35,0.55)' }}
            title="Afficher les favoris en premier"
          >
            <IconCoeur style={{ width: '10px', height: '10px' }} fill={favorisDabord ? '#8A6D1F' : 'none'} stroke="currentColor" strokeWidth="2" />
            <span className="hidden sm:inline">Favoris</span>
          </button>
        </div>

        {personnagesFiltres.length === 0 && (
          <div className="text-center py-16 yuna-fade-in">
            <p className="text-espresso/40 italic text-[12px] mb-3">
              {personnages.length === 0 ? "Tu n'as encore aucun personnage" : "Aucun personnage ne correspond à ta recherche"}
            </p>
            <button onClick={() => ouvrirCreateur()} className="text-[11px] font-semibold text-espresso underline underline-offset-2 hover:text-espresso/70">
              Créer ton premier personnage
            </button>
          </div>
        )}

        {/* ===== GRILLE DE CARTES ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
          {personnagesFiltres.map((personnage, index) => {
            const categoriesDuPersonnage = obtenirCategories(personnage)
            const compteur = compteurMessages[personnage.id] || 0
            return (
              <div
                key={personnage.id}
                onClick={() => ouvrirPersonnage(personnage)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrirPersonnage(personnage) } }}
                className="yuna-card-in group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] aspect-[3/4] border border-espresso/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40"
                style={{ animationDelay: `${Math.min(index, 11) * 40}ms`, background: 'white', boxShadow: '0 4px 14px rgba(62,39,35,0.08)' }}
              >
                {/* Fond */}
                {personnage.avatarUrl ? (
                  <img src={personnage.avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${personnage.couleur}, color-mix(in srgb, ${personnage.couleur}, black 30%))` }} />
                )}
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${personnage.couleur}00 0%, ${personnage.couleur}25 42%, color-mix(in srgb, ${personnage.couleur}, black 55%) 100%)` }} />

                {/* Compteur de messages */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/45 backdrop-blur-sm rounded-full pl-1.5 pr-2 py-1">
                  <IconBulle style={{ width: '10px', height: '10px' }} className="text-white/80" />
                  <span className="text-[9px] font-medium text-white/90">{formaterCompteur(compteur)}</span>
                </div>

                {/* Favori */}
                <button
                  onClick={(e) => { toggleFavori(e, personnage.id); e.currentTarget.classList.add('yuna-heartbeat') }}
                  aria-label={personnage.favori ? `Retirer ${personnage.nom} des favoris` : `Ajouter ${personnage.nom} aux favoris`}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-sm hover:bg-black/65 transition-colors duration-200"
                >
                  <IconCoeur style={{ width: '13px', height: '13px' }} fill={personnage.favori ? '#fff' : 'none'} stroke="#fff" strokeWidth="2" />
                </button>

                {/* Modifier / Supprimer */}
                <div className="absolute top-11 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 sm:group-active:opacity-100 transition-opacity duration-200">
                  <button onClick={(e) => { e.stopPropagation(); ouvrirCreateur(personnage) }} aria-label={`Modifier ${personnage.nom}`} className="w-7 h-7 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-sm hover:bg-black/65 transition-colors duration-200" title="Modifier">
                    <IconCrayon style={{ width: '11px', height: '11px' }} className="text-white" />
                  </button>
                  <button onClick={(e) => supprimerPersonnageActuel(e, personnage)} aria-label={`Supprimer ${personnage.nom}`} className="w-7 h-7 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-sm hover:bg-black/65 transition-colors duration-200" title="Supprimer">
                    <IconTrash style={{ width: '12px', height: '12px' }} className="text-white" />
                  </button>
                </div>

                {/* Texte */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
                  <p className="font-semibold text-white text-[13px] sm:text-[14.5px] leading-tight truncate" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{personnage.nom}</p>
                  <p className="text-[10px] sm:text-[10.5px] text-white/65 mt-1 leading-snug line-clamp-2 min-h-[26px]">{personnage.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {categoriesDuPersonnage.slice(0, 2).map((catId) => (
                      <span key={catId} className="inline-block text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-white/15 text-white/85">
                        {libelleCategorie(catId)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ================================================================
          MODALE DE CRÉATION / ÉDITION
          ================================================================ */}
      {afficherCreateur && personnageEnEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-espresso/60 backdrop-blur-sm yuna-fade-in" onClick={fermerCreateur}>
          <div className="yuna-modal-in bg-white rounded-3xl w-full max-w-[640px] max-h-[92vh] overflow-y-auto scroll-suave" onClick={(e) => e.stopPropagation()}>

            {/* En-tête sticky de la modale */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md flex items-center justify-between px-5 md:px-7 py-4 border-b border-espresso/8">
              <h2 className="text-espresso font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '21px' }}>
                {modeEdition ? 'Modifier le personnage' : 'Créer un personnage'}
              </h2>
              <button onClick={fermerCreateur} aria-label="Fermer" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso/40">
                <IconCroix style={{ width: '16px', height: '16px' }} className="text-espresso/50" />
              </button>
            </div>

            <div className="px-5 md:px-7 py-5">

              {/* Aperçu de carte */}
              <div className="mb-6">
                <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-2">Aperçu de la carte</p>
                <div className="w-full max-w-[210px] bg-white rounded-2xl overflow-hidden border border-espresso/10" style={{ boxShadow: '0 6px 18px rgba(62,39,35,0.1)' }}>
                  <BandeauCarte personnage={personnageEnEdition} hauteur="h-20"><span /></BandeauCarte>
                  <div className="p-3 -mt-7 relative">
                    <AvatarPersonnage personnage={personnageEnEdition} taille={46} />
                    <p className="font-semibold text-espresso mt-2 text-[13px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {personnageEnEdition.nom || 'Nom du personnage'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(personnageEnEdition.categories || []).length === 0 && <span className="text-[8px] text-espresso/30 italic">Aucune catégorie choisie</span>}
                      {(personnageEnEdition.categories || []).map((catId) => (
                        <span key={catId} className="text-[8px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: `${personnageEnEdition.couleur}18`, color: personnageEnEdition.couleur }}>
                          {libelleCategorie(catId)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== SECTION : Identité ===== */}
              <p className="text-[10px] font-semibold text-espresso/50 uppercase tracking-wide mb-3 pb-1.5 border-b border-espresso/8">Identité</p>

              <div className="flex items-center gap-3 mb-5">
                <AvatarPersonnage personnage={personnageEnEdition} taille={64} />
                <div>
                  <input ref={inputAvatarRef} type="file" accept="image/*" onChange={gererUploadAvatar} className="hidden" />
                  <button onClick={() => inputAvatarRef.current?.click()} className="text-[10.5px] font-medium text-espresso bg-[#F0EEEB] rounded-full px-3.5 py-1.5 hover:bg-espresso/10 transition-colors duration-200">
                    Choisir une image
                  </button>
                  <p className="text-[9px] text-espresso/35 mt-1">Cette photo remplace la couleur sur la carte</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Nom du personnage *</label>
                  <input type="text" value={personnageEnEdition.nom} onChange={(e) => modifierChampCreation('nom', e.target.value)} placeholder="Ex : Sofia"
                    className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors" />
                </div>
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Couleur</label>
                  <input type="color" value={personnageEnEdition.couleur} onChange={(e) => modifierChampCreation('couleur', e.target.value)} className="w-full h-11 rounded-xl mt-1 cursor-pointer border border-espresso/15" />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Catégories * (tu peux en choisir plusieurs)</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {CATEGORIES_PERSONNAGES.map((cat) => {
                    const choisie = (personnageEnEdition.categories || []).includes(cat.id)
                    return (
                      <button key={cat.id} type="button" onClick={() => toggleCategorieEdition(cat.id)}
                        className="flex items-center gap-1 rounded-full text-[11.5px] font-medium px-3.5 py-2 transition-all duration-200 border active:scale-95"
                        style={choisie ? { background: 'var(--color-espresso)', color: 'var(--color-peony)', borderColor: 'var(--color-espresso)' } : { background: '#F0EEEB', color: 'rgba(62,39,35,0.6)', borderColor: 'transparent' }}>
                        {choisie && <IconCheck style={{ width: '10px', height: '10px' }} />}
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mb-5">
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Traits de caractère (facultatif)</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {TRAITS_PERSONNAGE.map((trait) => {
                    const choisi = (personnageEnEdition.traits || []).includes(trait.id)
                    return (
                      <button
                        key={trait.id}
                        type="button"
                        onClick={() => toggleTraitEdition(trait.id)}
                        title={trait.description}
                        className="flex items-center gap-1 rounded-full text-[11px] font-medium px-3 py-1.5 transition-all duration-200 border active:scale-95"
                        style={choisi
                          ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }
                          : { background: '#F0EEEB', color: 'rgba(62,39,35,0.6)', borderColor: 'transparent' }}
                      >
                        {choisi && <IconCheck style={{ width: '10px', height: '10px' }} />}
                        {trait.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[9px] text-espresso/35 mt-1.5">Survole un trait pour voir sa description exacte</p>
              </div>

              <div className="mb-5">
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Description courte (affichée sur la carte)</label>
                <input type="text" value={personnageEnEdition.description} onChange={(e) => modifierChampCreation('description', e.target.value)} placeholder="Une phrase qui donne envie de cliquer"
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors" />
              </div>

              {/* ===== SECTION : Apparence & contexte ===== */}
              <p className="text-[10px] font-semibold text-espresso/50 uppercase tracking-wide mb-3 pb-1.5 border-b border-espresso/8">Apparence & contexte</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Âge</label>
                  <input type="text" value={personnageEnEdition.age || ''} onChange={(e) => modifierChampCreation('age', e.target.value)} placeholder="Ex : 21 ans"
                    className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors" />
                </div>
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Occupation</label>
                  <input type="text" value={personnageEnEdition.occupation || ''} onChange={(e) => modifierChampCreation('occupation', e.target.value)} placeholder="Ex : Étudiant"
                    className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors" />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Apparence physique</label>
                <input type="text" value={personnageEnEdition.apparence || ''} onChange={(e) => modifierChampCreation('apparence', e.target.value)} placeholder="Ex : Cheveux châtains, sourire chaleureux..."
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors" />
              </div>

              <div className="mb-5">
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Religion / spiritualité (facultatif)</label>
                <input type="text" value={personnageEnEdition.religion || ''} onChange={(e) => modifierChampCreation('religion', e.target.value)}
                  placeholder="Ex : Musulman pratiquant, utilise des expressions religieuses avec pudeur..."
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors" />
              </div>

              <div className="mb-5">
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Histoire / contexte</label>
                <textarea value={personnageEnEdition.histoire} onChange={(e) => modifierChampCreation('histoire', e.target.value)} placeholder="Le contexte complet de l'histoire, la situation, la relation avec l'utilisateur..." rows={5}
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors resize-y leading-relaxed" />
              </div>

              {/* ===== SECTION : Personnalité ===== */}
              <p className="text-[10px] font-semibold text-espresso/50 uppercase tracking-wide mb-3 pb-1.5 border-b border-espresso/8">Personnalité</p>

              <div className="mb-5">
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Personnalité (comment il/elle doit se comporter)</label>
                <textarea value={personnageEnEdition.personnalite} onChange={(e) => modifierChampCreation('personnalite', e.target.value)} placeholder="Ex : Timide au début, drôle une fois en confiance, protecteur..." rows={4}
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors resize-y leading-relaxed" />
              </div>

              <div className="mb-5">
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Style de communication</label>
                <textarea value={personnageEnEdition.styleCommunication || ''} onChange={(e) => modifierChampCreation('styleCommunication', e.target.value)}
                  placeholder="Vocabulaire, expressions habituelles, humour, façon de montrer l'affection/la colère/la tristesse..." rows={3}
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors resize-y leading-relaxed" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Ses valeurs</label>
                  <textarea value={personnageEnEdition.valeurs || ''} onChange={(e) => modifierChampCreation('valeurs', e.target.value)} rows={2}
                    className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors resize-y" />
                </div>
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Ses limites (ce qui le/la blesse)</label>
                  <textarea value={personnageEnEdition.limites || ''} onChange={(e) => modifierChampCreation('limites', e.target.value)} rows={2}
                    className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors resize-y" />
                </div>
              </div>
              <div className="mb-6">
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Ses objectifs personnels</label>
                <textarea value={personnageEnEdition.objectifsPersonnels || ''} onChange={(e) => modifierChampCreation('objectifsPersonnels', e.target.value)}
                  placeholder="Ce que le personnage recherche pour lui-même, indépendamment de toi..." rows={2}
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors resize-y" />
              </div>

              {/* ===== SECTION : Personnages secondaires ===== */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Personnages secondaires (famille, amis, rivaux...)</label>
                  <button type="button" onClick={ajouterPersonnageSecondaire} className="text-[10px] font-semibold text-espresso underline">+ Ajouter</button>
                </div>
                {(personnageEnEdition.personnagesSecondaires || []).map((s) => (
                  <div key={s.id} className="bg-[#F0EEEB] rounded-xl p-3 mb-2">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input value={s.nom} onChange={(e) => modifierPersonnageSecondaire(s.id, 'nom', e.target.value)} placeholder="Nom" className="bg-white rounded-lg px-2.5 py-1.5 text-[12px] outline-none border border-espresso/15" />
                      <input value={s.role} onChange={(e) => modifierPersonnageSecondaire(s.id, 'role', e.target.value)} placeholder="Rôle (frère, ami...)" className="bg-white rounded-lg px-2.5 py-1.5 text-[12px] outline-none border border-espresso/15" />
                    </div>
                    <textarea value={s.personnalite} onChange={(e) => modifierPersonnageSecondaire(s.id, 'personnalite', e.target.value)} placeholder="Sa personnalité" rows={2} className="w-full bg-white rounded-lg px-2.5 py-1.5 text-[12px] outline-none border border-espresso/15 mb-2 resize-y" />

                    <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Traits (facultatif, mais recommandé)</label>
                    <div className="flex flex-wrap gap-1 mt-1 mb-2">
                      {TRAITS_PERSONNAGE.map((trait) => {
                        const choisi = (s.traits || []).includes(trait.id)
                        return (
                          <button
                            key={trait.id}
                            type="button"
                            onClick={() => {
                              const traitsActuels = s.traits || []
                              const nouveaux = choisi ? traitsActuels.filter((t) => t !== trait.id) : [...traitsActuels, trait.id]
                              modifierPersonnageSecondaire(s.id, 'traits', nouveaux)
                            }}
                            title={trait.description}
                            className="text-[10px] px-2 py-1 rounded-full border transition-colors duration-150"
                            style={choisi
                              ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }
                              : { background: '#fff', color: 'rgba(62,39,35,0.6)', borderColor: 'transparent' }}
                          >
                            {trait.label}
                          </button>
                        )
                      })}
                    </div>

                    <textarea value={s.lienAvecPrincipal} onChange={(e) => modifierPersonnageSecondaire(s.id, 'lienAvecPrincipal', e.target.value)} placeholder="Son lien avec le personnage principal" rows={2} className="w-full bg-white rounded-lg px-2.5 py-1.5 text-[12px] outline-none border border-espresso/15 mb-2 resize-y" />
                    <button type="button" onClick={() => supprimerPersonnageSecondaire(s.id)} className="text-[10px] text-red-500">Supprimer</button>
                  </div>
                ))}
              </div>

              {/* ===== SECTION : Scène d'ouverture ===== */}
              <p className="text-[10px] font-semibold text-espresso/50 uppercase tracking-wide mb-3 pb-1.5 border-b border-espresso/8">Scène d'ouverture</p>
              <div className="mb-2">
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Le premier message qui lance l'histoire *</label>
                <textarea value={personnageEnEdition.sceneOuverture} onChange={(e) => modifierChampCreation('sceneOuverture', e.target.value)} placeholder="Le tout premier message, celui qui lance l'histoire" rows={5}
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors resize-y leading-relaxed" />
              </div>
            </div>

            {/* Pied sticky avec bouton d'enregistrement */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-5 md:px-7 py-4 border-t border-espresso/8">
              <button onClick={validerCreation} className="w-full rounded-xl py-3.5 text-[13px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]">
                {modeEdition ? 'Enregistrer les modifications' : 'Créer le personnage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonnagesScreen