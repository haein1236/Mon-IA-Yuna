import { useState, useEffect, useRef } from 'react'
import { chargerPersonnages, sauvegarderPersonnage, supprimerPersonnage, togglerFavoriPersonnage, creerPersonnageVide, chargerMessagesPersonnage, sauvegarderMessagesPersonnage, reinitialiserConversationPersonnage, CATEGORIES_PERSONNAGES, TRAITS_PERSONNAGE, calculerNiveauRelation, mettreAJourRelation } from '../services/personnages'
import { envoyerMessageAPersonnage, analyserRelationPersonnage } from '../services/gemini'
import { fichierVersBase64 } from '../services/images'
import { chargerParametres, FONDS_CHAT_DISPONIBLES } from '../services/parametres'
import { notifierErreur } from '../services/notifications'

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

function AvatarPersonnage({ personnage, taille = 48, modifiable = false, onModifier }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: taille, height: taille }}>
      {personnage.avatarUrl ? (
        <img src={personnage.avatarUrl} alt={personnage.nom} className="rounded-full object-cover w-full h-full ring-2 ring-white shadow-sm" />
      ) : (
        <div
          className="rounded-full flex items-center justify-center w-full h-full text-white font-semibold ring-2 ring-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${personnage.couleur}, color-mix(in srgb, ${personnage.couleur}, black 25%))`, fontSize: taille * 0.4 }}
        >
          {personnage.nom.charAt(0).toUpperCase()}
        </div>
      )}
      {modifiable && (
        <button
          onClick={(e) => { e.stopPropagation(); onModifier?.() }}
          title="Changer la photo"
          className="absolute -bottom-0.5 -right-0.5 rounded-full bg-espresso text-peony flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-110 active:scale-95"
          style={{ width: Math.max(18, taille * 0.34), height: Math.max(18, taille * 0.34) }}
        >
          <IconCamera style={{ width: '55%', height: '55%' }} />
        </button>
      )}
    </div>
  )
}

function BandeauCarte({ personnage, children }) {
  return (
    <div className="h-16 relative flex items-end p-3 overflow-hidden" style={!personnage.avatarUrl ? { background: `linear-gradient(135deg, ${personnage.couleur}, color-mix(in srgb, ${personnage.couleur}, black 20%))` } : undefined}>
      {personnage.avatarUrl && (
        <>
          <img src={personnage.avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${personnage.couleur}10 0%, ${personnage.couleur}95 115%)` }} />
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
    basDeListeRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, enTrainDecrire])

  useEffect(() => {
    const champ = zoneTexteRef.current
    if (!champ) return
    champ.style.height = 'auto'
    champ.style.height = Math.min(champ.scrollHeight, 128) + 'px'
  }, [saisie])

  const personnagesFiltres = personnages.filter((p) => {
    const categoriesDuPersonnage = obtenirCategories(p)
    const correspondCategorie = categoriesFiltre.length === 0 ||
      categoriesDuPersonnage.some((c) => categoriesFiltre.includes(c))
    const correspondRecherche = p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(recherche.toLowerCase()))
    return correspondCategorie && correspondRecherche
  })

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

  // ============================================================
  // EMOJIS — confirmés fonctionnels : insère l'emoji choisi dans le
  // champ de texte, à la position actuelle du curseur
  // ============================================================
  const insererEmoji = (emoji) => {
    const champ = zoneTexteRef.current
    const position = champ?.selectionStart ?? saisie.length
    const nouveauTexte = saisie.slice(0, position) + emoji + saisie.slice(position)
    setSaisie(nouveauTexte)
    requestAnimationFrame(() => { champ?.focus(); const p = position + emoji.length; champ?.setSelectionRange(p, p) })
  }

  // ============================================================
  // PHOTO JOINTE — confirmée fonctionnelle : stockée en base64,
  // affichée en aperçu, puis VRAIMENT transmise à Gemini (voir
  // envoyerMessage ci-dessous, 4ème argument imageBase64)
  // ============================================================
  const gererSelectionPhotoConversation = async (e) => {
    const fichier = e.target.files[0]
    e.target.value = ''
    if (!fichier) return
    const base64 = await fichierVersBase64(fichier)
    setPhotoEnAttente(base64)
  }
  const retirerPhotoEnAttente = () => setPhotoEnAttente(null)

  // ============================================================
  // ENVOYER UN MESSAGE — try/catch GARANTI
  // Peu importe ce qui se passe (Gemini échoue, les 3 secours
  // échouent aussi, timeout dépassé...), le "finally" implicite via
  // le catch remet TOUJOURS envoiEnCours/enTrainDecrire à false —
  // l'interface ne peut plus jamais rester bloquée sur "..." pour
  // toujours, contrairement à avant.
  // ============================================================
  const envoyerMessage = async () => {
    if ((!saisie.trim() && !photoEnAttente) || envoiEnCours || !personnageActif) return
    const texteUtilisateur = saisie
    const image = photoEnAttente

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
      // ⬅️ CONFIRMÉ : "image" (la photo en base64) est bien transmise
      // en 4ème argument — le personnage voit VRAIMENT la photo
      const reponseTexte = await envoyerMessageAPersonnage(historiquePourGemini, texteUtilisateur, personnageActif, image)

      setEnTrainDecrire(false)
      setEnvoiEnCours(false)

      const messagesAvecReponse = [...nouveauxMessages, {
        id: Date.now() + 1, auteur: 'personnage', texte: reponseTexte,
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]
      setMessages(messagesAvecReponse)
      sauvegarderMessagesPersonnage(personnageActif.id, messagesAvecReponse)

      // ⬅️ NOUVEAU : analyse la relation toutes les 6 messages, en
      // arrière-plan (sans "await" — ne ralentit jamais la conversation)
      if (messagesAvecReponse.length % 6 === 0) {
        analyserRelationPersonnage(personnageActif, messagesAvecReponse.slice(-6)).then((resultat) => {
          if (resultat) {
            const personnagesMaj = mettreAJourRelation(personnageActif.id, resultat)
            setPersonnages(personnagesMaj)
            const persoMaj = personnagesMaj.find((p) => p.id === personnageActif.id)
            if (persoMaj) setPersonnageActif(persoMaj)
          }
        })
      }
    } catch (erreur) {
      // ⬅️ C'est ce bloc qui manquait/n'était pas appliqué — sans lui,
      // une erreur ici laissait "..." affiché pour toujours
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

    try {
      const reponseTexte = await envoyerMessageAPersonnage(
        historiquePourGemini,
        "*reste silencieux, continue la scène toi-même sans attendre de réponse*",
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
    const confirme = window.confirm(`Recommencer l'histoire avec ${personnageActif.nom} depuis le début ? Cette conversation sera effacée.`)
    if (!confirme) return
    const messagesReset = reinitialiserConversationPersonnage(personnageActif)
    setMessages(messagesReset)
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
    if (personnage.origine === 'predefini') {
      alert('Les personnages prédéfinis ne peuvent pas être supprimés — tu peux juste ne pas les utiliser.')
      return
    }
    const confirme = window.confirm(`Supprimer définitivement ${personnage.nom} et sa conversation ?`)
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
    return { background: `color-mix(in srgb, ${personnageActif?.couleur || '#C4688A'} 6%, var(--color-cream))` }
  })()

  if (personnageActif) {
    const saisieVide = !saisie.trim() && !photoEnAttente
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden" style={styleFondConversation}>
        <style>{`
          @keyframes messageEntree { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes popEntree { from { opacity: 0; transform: scale(0.92) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          .anim-message { animation: messageEntree 0.28s ease-out both; }
          .anim-pop { animation: popEntree 0.16s ease-out both; }
        `}</style>

        <input ref={inputPhotoConversationRef} type="file" accept="image/*" onChange={gererSelectionPhotoConversation} className="hidden" />
        <input ref={inputAvatarRapideRef} type="file" accept="image/*" onChange={gererChangementPhotoRapide} className="hidden" />

        <div className="flex items-center gap-3 px-4 md:px-6 py-3.5 md:py-4 bg-white border-b flex-shrink-0" style={{ borderColor: `${personnageActif.couleur}30` }}>
          <button onClick={retourALaGrille} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200 flex-shrink-0">
            <IconRetour style={{ width: '16px', height: '16px' }} className="text-espresso/60" />
          </button>
          <AvatarPersonnage personnage={personnageActif} taille={38} modifiable onModifier={() => demanderChangementPhoto(personnageActif)} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-espresso truncate">{personnageActif.nom}</p>
            <p className="text-[9.5px] text-espresso/45 truncate">
              {calculerNiveauRelation(personnageActif.relation?.confiance ?? 20)} · 💛 {personnageActif.relation?.affection ?? 10}%
            </p>
          </div>
          <button onClick={() => ouvrirCreateur(personnageActif)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200 flex-shrink-0" title="Modifier ce personnage">
            <IconCrayon style={{ width: '14px', height: '14px' }} className="text-espresso/50" />
          </button>
          <button onClick={recommencerHistoire} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200 flex-shrink-0" title="Recommencer l'histoire">
            <IconRefresh style={{ width: '15px', height: '15px' }} className="text-espresso/50" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-suave p-3 sm:p-4 md:p-6 flex flex-col gap-3">
          {messages.map((message) => {
            const estUser = message.auteur === 'user'
            return (
              <div key={message.id} className={`anim-message group flex items-end gap-2 ${estUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {!estUser && <AvatarPersonnage personnage={personnageActif} taille={28} />}
                <div className={`flex flex-col ${estUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Photo envoyée"
                      className={`mb-1 max-w-[220px] max-h-[220px] object-cover rounded-2xl border ${estUser ? 'rounded-br-[6px]' : 'rounded-bl-[6px]'}`}
                      style={{ borderColor: `${personnageActif.couleur}30` }}
                    />
                  )}
                  {message.texte && (
                    <div className={`px-4 py-2.5 text-[12px] leading-relaxed whitespace-pre-line ${
                      estUser ? 'bg-espresso text-peony rounded-[18px] rounded-br-[4px]' : 'bg-white text-espresso border rounded-[18px] rounded-bl-[4px]'
                    }`}
                      style={!estUser ? { borderColor: `${personnageActif.couleur}30`, boxShadow: '0 2px 8px rgba(62,39,35,0.05)' } : undefined}
                    >
                      {message.texte.split(/(\*[^*]+\*)/g).map((morceau, i) =>
                        morceau.startsWith('*') && morceau.endsWith('*') && morceau.length > 1 ? (
                          <em key={i} className={estUser ? 'text-peony/70' : 'text-espresso/50'}>{morceau.slice(1, -1)}</em>
                        ) : (<span key={i}>{morceau}</span>)
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-0.5 px-1">
                    {message.heure && <span className="text-[8px] text-espresso/30">{message.heure}</span>}
                    {estUser && (
                      <button
                        onClick={() => {
                          const nouveauTexte = window.prompt('Modifier ton message :', message.texte)
                          if (nouveauTexte && nouveauTexte.trim() && nouveauTexte !== message.texte) {
                            modifierMessagePersonnage(message.id, nouveauTexte.trim())
                          }
                        }}
                        className="text-[8px] text-espresso/30 hover:text-espresso/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 underline"
                      >
                        modifier
                      </button>
                    )}
                    <button
                      onClick={() => redemarrerApartirDe(message.id)}
                      className="text-[8px] text-espresso/30 hover:text-espresso/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 underline"
                    >
                      redémarrer ici
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {enTrainDecrire && (
            <div className="anim-message flex items-end gap-2">
              <AvatarPersonnage personnage={personnageActif} taille={28} />
              <div className="bg-white border rounded-[18px] rounded-bl-[4px] px-4 py-3 flex gap-1.5" style={{ borderColor: `${personnageActif.couleur}30` }}>
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: personnageActif.couleur, animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: personnageActif.couleur, animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: personnageActif.couleur, animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={basDeListeRef} />
        </div>

        <div className="flex-shrink-0 bg-white border-t" style={{ borderColor: `${personnageActif.couleur}30`, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {photoEnAttente && (
            <div className="anim-pop flex items-center gap-2 px-3 sm:px-4 md:px-6 pt-3">
              <div className="relative">
                <img src={photoEnAttente} alt="À envoyer" className="w-14 h-14 object-cover rounded-xl border" style={{ borderColor: `${personnageActif.couleur}40` }} />
                <button onClick={retirerPhotoEnAttente} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-espresso text-peony flex items-center justify-center shadow">
                  <IconCroix style={{ width: '10px', height: '10px' }} />
                </button>
              </div>
              <span className="text-[10px] text-espresso/40">Photo prête à être envoyée</span>
            </div>
          )}

          {emojiPickerOuvert && (
            <div className="anim-pop mx-3 sm:mx-4 md:mx-6 mt-3 mb-1 bg-cream border rounded-2xl p-2.5 grid grid-cols-8 gap-1" style={{ borderColor: `${personnageActif.couleur}30` }}>
              {EMOJIS_RAPIDES.map((emoji) => (
                <button key={emoji} onClick={() => insererEmoji(emoji)} className="text-[18px] rounded-lg py-1 hover:bg-white transition-colors duration-150">
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-1 sm:gap-2 px-2 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3.5">
            <button onClick={() => inputPhotoConversationRef.current?.click()} title="Envoyer une photo" className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-espresso/45 hover:bg-espresso/5 hover:text-espresso/70 transition-colors duration-200">
              <IconImage style={{ width: '16px', height: '16px' }} />
            </button>
            <button
              onClick={() => setEmojiPickerOuvert((o) => !o)}
              title="Emojis"
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200"
              style={emojiPickerOuvert ? { background: `${personnageActif.couleur}20`, color: personnageActif.couleur } : undefined}
            >
              <IconSmile style={{ width: '16px', height: '16px' }} className={emojiPickerOuvert ? '' : 'text-espresso/45'} />
            </button>
            <button onClick={insererAsterisques} title="Ajouter une action *comme ceci*" className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-espresso/45 hover:bg-espresso/5 hover:text-espresso/70 transition-colors duration-200">
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
              className="flex-1 min-w-0 bg-cream border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-[16px] md:text-[13px] text-espresso placeholder:text-espresso/40 outline-none transition-all duration-200 disabled:opacity-50 resize-none max-h-32 leading-relaxed"
              style={{ borderColor: `${personnageActif.couleur}40`, minHeight: '46px' }}
            />

            {saisieVide ? (
              <button
                onClick={continuerHistoire}
                disabled={envoiEnCours || messages.length === 0}
                title="Rien à dire ? Laisse le personnage continuer la scène"
                className="h-11 px-2.5 sm:px-3.5 rounded-full flex items-center gap-1 sm:gap-1.5 flex-shrink-0 text-[9.5px] sm:text-[10.5px] font-semibold transition-all duration-200 active:scale-90 disabled:opacity-35 whitespace-nowrap"
                style={{ background: `${personnageActif.couleur}18`, color: personnageActif.couleur }}
              >
                <IconEtoiles style={{ width: '13px', height: '13px' }} className="flex-shrink-0" />
                <span className="hidden sm:inline">Continuer</span>
              </button>
            ) : (
              <button
                onClick={envoyerMessage}
                disabled={envoiEnCours}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90 disabled:opacity-35"
                style={{ background: personnageActif.couleur }}
              >
                <IconEnvoi className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          <p className="sm:hidden text-center text-[8.5px] text-espresso/30 pb-1.5 -mt-1">
            {estAppareilTactile ? 'Astuce : entoure ton texte de * pour une action' : 'Entrée pour envoyer'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto scroll-suave bg-cream">
      <input ref={inputAvatarRapideRef} type="file" accept="image/*" onChange={gererChangementPhotoRapide} className="hidden" />
      <div className="px-4 md:px-8 py-5 md:py-7">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-espresso font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px' }}>Personnages</h1>
            <p className="text-[10.5px] text-espresso/45 mt-0.5">{personnages.length} personnage{personnages.length > 1 ? 's' : ''} — discute, crée, vis des histoires</p>
          </div>
          <button onClick={() => ouvrirCreateur()} className="flex items-center gap-1.5 bg-espresso text-peony rounded-full px-4 py-2.5 text-[11.5px] font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95">
            <IconPlus style={{ width: '14px', height: '14px' }} />
            Créer un personnage
          </button>
        </div>

        <input
          type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un personnage..."
          className="w-full bg-white border border-espresso/10 rounded-full px-4 py-2.5 text-[12px] text-espresso placeholder:text-espresso/35 outline-none focus:border-espresso/30 transition-colors duration-200 mb-4"
        />

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setCategoriesFiltre([])}
            className="flex-shrink-0 rounded-full text-[11px] font-medium px-3.5 py-2 transition-all duration-200"
            style={{ background: categoriesFiltre.length === 0 ? 'var(--color-espresso)' : 'white', color: categoriesFiltre.length === 0 ? 'var(--color-peony)' : 'rgba(62,39,35,0.6)', border: categoriesFiltre.length === 0 ? 'none' : '1px solid rgba(62,39,35,0.1)' }}
          >
            Tous
          </button>
          {CATEGORIES_PERSONNAGES.map((cat) => {
            const actif = categoriesFiltre.includes(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggleFiltreCategorie(cat.id)}
                className="flex-shrink-0 flex items-center gap-1 rounded-full text-[11px] font-medium px-3.5 py-2 transition-all duration-200"
                style={{ background: actif ? 'var(--color-espresso)' : 'white', color: actif ? 'var(--color-peony)' : 'rgba(62,39,35,0.6)', border: actif ? 'none' : '1px solid rgba(62,39,35,0.1)' }}
              >
                {actif && <IconCheck style={{ width: '10px', height: '10px' }} />}
                {cat.label}
              </button>
            )
          })}
        </div>

        {personnagesFiltres.length === 0 && (
          <div className="text-center py-16">
            <p className="text-espresso/40 italic text-[12px] mb-3">
              {personnages.length === 0 ? "Tu n'as encore aucun personnage" : "Aucun personnage ne correspond à ta recherche"}
            </p>
            <button onClick={() => ouvrirCreateur()} className="text-[11px] font-semibold text-espresso underline underline-offset-2 hover:text-espresso/70">
              Créer ton premier personnage
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-8">
          {personnagesFiltres.map((personnage) => {
            const categoriesDuPersonnage = obtenirCategories(personnage)
            return (
              <div
                key={personnage.id}
                onClick={() => ouvrirPersonnage(personnage)}
                className="group bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 border border-espresso/8"
                style={{ boxShadow: '0 4px 14px rgba(62,39,35,0.06)' }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 10px 24px ${personnage.couleur}30`)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(62,39,35,0.06)')}
              >
                <BandeauCarte personnage={personnage}>
                  <button onClick={(e) => toggleFavori(e, personnage.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors duration-200">
                    <IconCoeur style={{ width: '13px', height: '13px' }} fill={personnage.favori ? '#fff' : 'none'} stroke="#fff" strokeWidth="2" />
                  </button>
                  {personnage.origine === 'perso' && (
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); ouvrirCreateur(personnage) }} className="w-7 h-7 rounded-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors duration-200" title="Modifier">
                        <IconCrayon style={{ width: '11px', height: '11px' }} className="text-white" />
                      </button>
                      <button onClick={(e) => supprimerPersonnageActuel(e, personnage)} className="w-7 h-7 rounded-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors duration-200" title="Supprimer">
                        <IconTrash style={{ width: '12px', height: '12px' }} className="text-white" />
                      </button>
                    </div>
                  )}
                </BandeauCarte>

                <div className="p-4 -mt-8 relative">
                  <AvatarPersonnage personnage={personnage} taille={56} modifiable onModifier={() => demanderChangementPhoto(personnage)} />
                  <p className="font-semibold text-espresso mt-2.5 text-[14px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{personnage.nom}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {categoriesDuPersonnage.map((catId) => (
                      <span key={catId} className="inline-block text-[8.5px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${personnage.couleur}18`, color: personnage.couleur }}>
                        {libelleCategorie(catId)}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-espresso/55 mt-2 leading-relaxed line-clamp-2">{personnage.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {personnage.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[8px] text-espresso/40 bg-[#F0EEEB] px-1.5 py-0.5 rounded-full">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {afficherCreateur && personnageEnEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-espresso/60" onClick={fermerCreateur}>
          <div className="bg-white rounded-3xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto scroll-suave p-5 md:p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-espresso font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px' }}>
                {modeEdition ? 'Modifier le personnage' : 'Créer un personnage'}
              </h2>
              <button onClick={fermerCreateur} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-espresso/5 transition-colors duration-200">
                <IconCroix style={{ width: '16px', height: '16px' }} className="text-espresso/50" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-[9px] text-espresso/40 uppercase tracking-wide mb-1.5">Aperçu de la carte</p>
              <div className="w-full max-w-[200px] bg-white rounded-2xl overflow-hidden border border-espresso/10" style={{ boxShadow: '0 4px 14px rgba(62,39,35,0.08)' }}>
                <BandeauCarte personnage={personnageEnEdition}><span /></BandeauCarte>
                <div className="p-3 -mt-7 relative">
                  <AvatarPersonnage personnage={personnageEnEdition} taille={44} />
                  <p className="font-semibold text-espresso mt-2 text-[12.5px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
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

            <div className="flex items-center gap-3 mb-5">
              <AvatarPersonnage personnage={personnageEnEdition} taille={60} />
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
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso" />
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
                      className="flex items-center gap-1 rounded-full text-[11.5px] font-medium px-3.5 py-2 transition-all duration-200 border"
                      style={choisie ? { background: 'var(--color-espresso)', color: 'var(--color-peony)', borderColor: 'var(--color-espresso)' } : { background: '#F0EEEB', color: 'rgba(62,39,35,0.6)', borderColor: 'transparent' }}>
                      {choisie && <IconCheck style={{ width: '10px', height: '10px' }} />}
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Traits de caractère (facultatif, mais recommandé pour des réponses plus vivantes)</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {TRAITS_PERSONNAGE.map((trait) => {
                  const choisi = (personnageEnEdition.traits || []).includes(trait.id)
                  return (
                    <button
                      key={trait.id}
                      type="button"
                      onClick={() => toggleTraitEdition(trait.id)}
                      title={trait.description}
                      className="flex items-center gap-1 rounded-full text-[11px] font-medium px-3 py-1.5 transition-all duration-200 border"
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

            <div className="mb-4">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Description courte (affichée sur la carte)</label>
              <input type="text" value={personnageEnEdition.description} onChange={(e) => modifierChampCreation('description', e.target.value)} placeholder="Une phrase qui donne envie de cliquer"
                className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso" />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Âge</label>
                <input type="text" value={personnageEnEdition.age || ''} onChange={(e) => modifierChampCreation('age', e.target.value)} placeholder="Ex : 21 ans"
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso" />
              </div>
              <div>
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Occupation</label>
                <input type="text" value={personnageEnEdition.occupation || ''} onChange={(e) => modifierChampCreation('occupation', e.target.value)} placeholder="Ex : Étudiant"
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Apparence physique</label>
              <input type="text" value={personnageEnEdition.apparence || ''} onChange={(e) => modifierChampCreation('apparence', e.target.value)} placeholder="Ex : Cheveux châtains, sourire chaleureux..."
                className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso" />
            </div>

            <div className="mb-4">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Religion / spiritualité (facultatif)</label>
              <input type="text" value={personnageEnEdition.religion || ''} onChange={(e) => modifierChampCreation('religion', e.target.value)}
                placeholder="Ex : Musulman pratiquant, utilise des expressions religieuses avec pudeur..."
                className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso" />
            </div>

            <div className="mb-4">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Histoire / contexte</label>
              <textarea value={personnageEnEdition.histoire} onChange={(e) => modifierChampCreation('histoire', e.target.value)} placeholder="Le contexte complet de l'histoire, la situation, la relation avec l'utilisateur..." rows={5}
                className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso resize-y leading-relaxed" />
            </div>

            <div className="mb-4">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Personnalité (comment il/elle doit se comporter)</label>
              <textarea value={personnageEnEdition.personnalite} onChange={(e) => modifierChampCreation('personnalite', e.target.value)} placeholder="Ex : Timide au début, drôle une fois en confiance, protecteur..." rows={4}
                className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso resize-y leading-relaxed" />
            </div>

            <div className="mb-4">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Style de communication</label>
              <textarea value={personnageEnEdition.styleCommunication || ''} onChange={(e) => modifierChampCreation('styleCommunication', e.target.value)}
                placeholder="Vocabulaire, expressions habituelles, humour, façon de montrer l'affection/la colère/la tristesse..." rows={3}
                className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso resize-y leading-relaxed" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Ses valeurs</label>
                <textarea value={personnageEnEdition.valeurs || ''} onChange={(e) => modifierChampCreation('valeurs', e.target.value)} rows={2}
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso resize-y" />
              </div>
              <div>
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Ses limites (ce qui le/la blesse)</label>
                <textarea value={personnageEnEdition.limites || ''} onChange={(e) => modifierChampCreation('limites', e.target.value)} rows={2}
                  className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso resize-y" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Ses objectifs personnels</label>
              <textarea value={personnageEnEdition.objectifsPersonnels || ''} onChange={(e) => modifierChampCreation('objectifsPersonnels', e.target.value)}
                placeholder="Ce que le personnage recherche pour lui-même, indépendamment de toi..." rows={2}
                className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-2.5 text-[12.5px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso resize-y" />
            </div>

            <div className="mb-6">
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">Scène d'ouverture *</label>
              <textarea value={personnageEnEdition.sceneOuverture} onChange={(e) => modifierChampCreation('sceneOuverture', e.target.value)} placeholder="Le tout premier message, celui qui lance l'histoire" rows={5}
                className="w-full bg-[#F0EEEB] rounded-xl px-3.5 py-3 text-[13px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso resize-y leading-relaxed" />
            </div>

            <button onClick={validerCreation} className="w-full rounded-xl py-3.5 text-[13px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]">
              {modeEdition ? 'Enregistrer les modifications' : 'Créer le personnage'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonnagesScreen