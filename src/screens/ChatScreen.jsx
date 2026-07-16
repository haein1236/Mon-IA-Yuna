import { useState, useEffect, useRef } from 'react'
import MessageBubble   from '../components/MessageBubble'
import TypingIndicator from '../components/TypingIndicator'
import { IconSend, IconPaperclip } from '../components/Icons'
import AIAvatar from '../components/AIAvatar'
import { notifierErreur } from '../services/notifications'
import { envoyerMessageAYuna, envoyerNoteVocaleAYuna, verifierMessageSpontane, extraireEtMemoriserFaits } from '../services/gemini'
import { sauvegarderConversation, creerNouvelleConversation } from '../services/conversations'
import { sauvegarderImage, fichierVersBase64 } from '../services/images'
import { chargerParametres, FONDS_CHAT_DISPONIBLES } from '../services/parametres'

function ChatScreen({ conversationActive, onChangerEcran, onNouvelleConversation }) {

  const [messages, setMessages] = useState(
    conversationActive?.messages || [{
      id: 1, auteur: 'yuna',
      texte: "Coucou ! 👋 Je suis Yuna, ta pote IA. Comment tu vas aujourd'hui ?",
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }]
  )
  const [saisie, setSaisie]             = useState('')
  const [yunaEcrit, setYunaEcrit]       = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [fondEcran, setFondEcran]       = useState(() => chargerParametres())

  const [enregistrement, setEnregistrement]           = useState(false)
  const [dureeEnregistrement, setDureeEnregistrement] = useState(0)
  const [erreurMicro, setErreurMicro]                 = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksAudioRef   = useRef([])
  const timerRef         = useRef(null)
  const inputImageRef    = useRef(null)
  const basDeListeRef    = useRef(null)

  // ⬅️ NOUVEAU : compte le nombre de messages déjà pris en compte pour
  // la mémoire, pour savoir quand redéclencher une extraction
  const dernierIndexMemoriseRef = useRef(0)

  useEffect(() => {
    basDeListeRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, yunaEcrit])

  useEffect(() => {
    if (!conversationActive) return
    sauvegarderConversation({
      ...conversationActive,
      messages,
      dateMiseAJour: new Date().toISOString(),
    })
  }, [messages])

  useEffect(() => {
    const verifierEtEnvoyerMessageSpontane = async () => {
      const messageSpontane = await verifierMessageSpontane(conversationActive?.dateMiseAJour)
      if (messageSpontane) {
        setMessages((anciens) => [...anciens, {
          id: Date.now(),
          auteur: 'yuna',
          texte: messageSpontane,
          heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }])
      }
    }
    verifierEtEnvoyerMessageSpontane()
  }, [])

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const handleImageGeneree = (image) => sauvegarderImage(image)

  // ============================================================
  // NOUVEAU : mémoire périodique — appelée après chaque échange,
  // se déclenche seulement si au moins 6 nouveaux messages sont
  // apparus depuis la dernière extraction (évite de spammer l'API
  // à chaque message, tout en garantissant que la mémoire se
  // construise même si l'utilisateur ne clique jamais "Nouvelle").
  // ============================================================
  const memoriserSiNecessaire = (messagesActuels) => {
    if (messagesActuels.length - dernierIndexMemoriseRef.current >= 6) {
      extraireEtMemoriserFaits(messagesActuels.slice(1))
      dernierIndexMemoriseRef.current = messagesActuels.length
    }
  }

  const nouvelleConversation = () => {
    extraireEtMemoriserFaits(messages)
    dernierIndexMemoriseRef.current = 0
    const conv = creerNouvelleConversation()
    if (onNouvelleConversation) onNouvelleConversation(conv)
    setMessages([{
      id: 1, auteur: 'yuna',
      texte: "Coucou ! 👋 C'est reparti pour une nouvelle conversation ! De quoi tu veux qu'on parle ? 😊",
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }])
  }

  const handleEnvoyerImage = async (e) => {
    const fichier = e.target.files[0]
    if (!fichier) return

    const base64 = await fichierVersBase64(fichier)

    const messageImage = {
      id: Date.now(), auteur: 'user', texte: '[IMAGE_ENVOYEE]', imageUrl: base64,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }

    const nouveauxMessages = [...messages, messageImage]
    setMessages(nouveauxMessages)
    setEnvoiEnCours(true)
    setYunaEcrit(true)

    const reponseTexte = await envoyerMessageAYuna(
      nouveauxMessages.slice(1),
      `[L'utilisateur t'a envoyé une image. Réagis de façon naturelle et chaleureuse comme une pote, demande ce que c'est ou commente si tu peux deviner le sujet. Image: ${fichier.name}]`
    )

    setYunaEcrit(false)
    setEnvoiEnCours(false)

    const messagesFinaux = [...nouveauxMessages, {
      id: Date.now() + 1, auteur: 'yuna', texte: reponseTexte,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }]
    setMessages(messagesFinaux)
    memoriserSiNecessaire(messagesFinaux)

  
    e.target.value = ''
  }



// Remplace la fonction envoyerMessage entière par :
const envoyerMessage = async () => {
  if (!saisie.trim() || envoiEnCours) return
  const texteUtilisateur = saisie

  const messageUtilisateur = {
    id: Date.now(), auteur: 'user', texte: texteUtilisateur,
    heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  }

  const nouveauxMessages = [...messages, messageUtilisateur]
  setMessages(nouveauxMessages)
  setSaisie('')
  setEnvoiEnCours(true)
  setYunaEcrit(true)

  try {
    const reponseTexte = await envoyerMessageAYuna(nouveauxMessages.slice(1), texteUtilisateur)
    setYunaEcrit(false)
    setEnvoiEnCours(false)
    const messagesFinaux = [...nouveauxMessages, {
      id: Date.now() + 1, auteur: 'yuna', texte: reponseTexte,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }]
    setMessages(messagesFinaux)
    memoriserSiNecessaire(messagesFinaux)
  } catch (erreur) {
    setYunaEcrit(false)
    setEnvoiEnCours(false)
    notifierErreur(erreur.message || "Yuna n'a pas pu répondre. Réessaie.")
  }
}

  const gererToucheEntree = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      envoyerMessage()
    }
  }

  const modifierMessage = async (idMessage, nouveauTexte) => {
    const index = messages.findIndex((m) => m.id === idMessage)
    if (index === -1) return

    const messagesAvant = messages.slice(0, index)
    const messageModifie = { ...messages[index], texte: nouveauTexte, modifie: true }
    const nouveauxMessages = [...messagesAvant, messageModifie]

    setMessages(nouveauxMessages)
    setEnvoiEnCours(true)
    setYunaEcrit(true)

    const reponseTexte = await envoyerMessageAYuna(nouveauxMessages.slice(1), nouveauTexte)

    setYunaEcrit(false)
    setEnvoiEnCours(false)

    const messagesFinaux = [...nouveauxMessages, {
      id: Date.now(), auteur: 'yuna', texte: reponseTexte,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }]
    setMessages(messagesFinaux)
  }

  const blobVersBase64 = (blob) => new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onloadend = () => resolve(lecteur.result)
    lecteur.onerror = reject
    lecteur.readAsDataURL(blob)
  })

  const formaterDuree = (secondes) => {
    const m = Math.floor(secondes / 60)
    const s = secondes % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const demarrerEnregistrement = async () => {
    if (envoiEnCours) return
    setErreurMicro(false)
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true })
      const typeMime = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '')

      const recorder = typeMime
        ? new MediaRecorder(flux, { mimeType: typeMime })
        : new MediaRecorder(flux)

      mediaRecorderRef.current = recorder
      chunksAudioRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksAudioRef.current.push(e.data)
      }

      recorder.start()
      setEnregistrement(true)
      setDureeEnregistrement(0)
      timerRef.current = setInterval(() => {
        setDureeEnregistrement((d) => d + 1)
      }, 1000)
    } catch (err) {
      console.error("Impossible d'accéder au micro :", err)
      setErreurMicro(true)
      setTimeout(() => setErreurMicro(false), 3000)
    }
  }

  const stopperFlux = (recorder) => {
    recorder?.stream?.getTracks().forEach((track) => track.stop())
  }

  const annulerEnregistrement = () => {
    const recorder = mediaRecorderRef.current
    clearInterval(timerRef.current)
    setEnregistrement(false)
    setDureeEnregistrement(0)
    if (!recorder) return
    recorder.onstop = () => stopperFlux(recorder)
    if (recorder.state !== 'inactive') recorder.stop()
  }

  const arreterEtEnvoyerEnregistrement = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    const dureeFinale = dureeEnregistrement
    clearInterval(timerRef.current)
    setEnregistrement(false)

    recorder.onstop = async () => {
      stopperFlux(recorder)
      if (dureeFinale < 1) {
        chunksAudioRef.current = []
        return
      }
      const blobAudio = new Blob(chunksAudioRef.current, { type: recorder.mimeType || 'audio/webm' })
      const audioBase64 = await blobVersBase64(blobAudio)
      await envoyerMessageVocal(audioBase64, dureeFinale)
    }

    if (recorder.state !== 'inactive') recorder.stop()
  }

  const envoyerMessageVocal = async (audioBase64, duree) => {
    const messageVocal = {
      id: Date.now(), auteur: 'user', texte: '[NOTE_VOCALE]',
      audioUrl: audioBase64, dureeAudio: duree,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }

    const nouveauxMessages = [...messages, messageVocal]
    setMessages(nouveauxMessages)
    setEnvoiEnCours(true)
    setYunaEcrit(true)

    const reponseTexte = await envoyerNoteVocaleAYuna(nouveauxMessages.slice(1), audioBase64)

    setYunaEcrit(false)
    setEnvoiEnCours(false)

    const messagesFinaux = [...nouveauxMessages, {
      id: Date.now() + 1, auteur: 'yuna', texte: reponseTexte,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }]
    setMessages(messagesFinaux)
    memoriserSiNecessaire(messagesFinaux)
  }

  const styleFond = (() => {
    if (fondEcran.fondEcranChat === 'personnalise' && fondEcran.fondEcranChatPerso) {
      return {
        backgroundImage: `linear-gradient(rgba(255,248,245,0.75), rgba(255,248,245,0.75)), url(${fondEcran.fondEcranChatPerso})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    const preset = FONDS_CHAT_DISPONIBLES.find((f) => f.id === fondEcran.fondEcranChat)
    if (preset?.style) return { background: preset.style }
    return { background: 'linear-gradient(180deg, var(--color-cream) 0%, color-mix(in srgb, var(--color-cream), var(--color-peony) 8%) 100%)' }
  })()

  return (
    <div className="h-full min-h-0 flex flex-col bg-cream overflow-hidden">

      <div className="flex items-center gap-3 px-4 md:px-6 py-3.5 md:py-4 bg-white border-b border-peony/30 flex-shrink-0" style={{ boxShadow: '0 1px 0 rgba(62,39,35,0.03)' }}>
        <div
          className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-peony flex items-center justify-center flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--color-peony) 30%, transparent)' }}
        >
          <AIAvatar size={21} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-espresso">Yuna</p>
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full transition-colors duration-300 flex-shrink-0"
              style={{ background: envoiEnCours ? '#C4917A' : '#4ade80' }}
            />
            <p className="text-[9.5px] md:text-[10px] text-espresso/55 truncate">
              {envoiEnCours ? 'En train de réfléchir...' : 'En ligne maintenant'}
            </p>
          </div>
        </div>

        <button
          onClick={nouvelleConversation}
          className="text-[10.5px] font-medium text-cream bg-espresso px-2.5 md:px-3.5 py-2 rounded-full hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center gap-1.5 flex-shrink-0"
          title="Démarrer une nouvelle conversation"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Nouvelle</span>
        </button>

        <button
          onClick={() => onChangerEcran('historique')}
          className="hidden sm:inline-block text-[10.5px] font-medium text-espresso/65 border border-peony/40 px-3.5 py-2 rounded-full hover:bg-peony-light hover:text-espresso transition-colors duration-200 flex-shrink-0"
        >
          Historique
        </button>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-suave p-3 sm:p-4 md:p-6 flex flex-col gap-3 sm:gap-4"
        style={styleFond}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onImageGeneree={handleImageGeneree}
            onModifierMessage={modifierMessage}
          />
        ))}
        {yunaEcrit && <TypingIndicator />}
        <div ref={basDeListeRef} />
      </div>

      <div
        className="flex flex-col flex-shrink-0 bg-white border-t border-peony/30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {erreurMicro && (
          <p className="text-[10.5px] text-center text-red-500 pt-2 px-4">
            Impossible d'accéder au micro. Vérifie les autorisations de l'app.
          </p>
        )}

        {enregistrement ? (
          <div className="flex items-center gap-2 md:gap-3 px-3 sm:px-4 md:px-6 py-2.5 md:py-4">
            <button
              onClick={annulerEnregistrement}
              className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-peony-light flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform duration-150"
              title="Annuler l'enregistrement"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-espresso/70" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flex-1 min-w-0 flex items-center gap-2 bg-cream border border-peony/40 rounded-full px-4 py-3 md:py-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              <span className="text-[13px] text-espresso/70 font-medium tabular-nums">
                {formaterDuree(dureeEnregistrement)}
              </span>
              <span className="text-[11px] text-espresso/45 truncate">Enregistrement en cours...</span>
            </div>

            <button
              onClick={arreterEtEnvoyerEnregistrement}
              className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-espresso flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform duration-150"
              title="Envoyer la note vocale"
            >
              <IconSend className="w-4 h-4 text-peony" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 px-3 sm:px-4 md:px-6 py-2.5 md:py-4">
            <input
              ref={inputImageRef}
              type="file"
              accept="image/*"
              onChange={handleEnvoyerImage}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => inputImageRef.current?.click()}
              disabled={envoiEnCours}
              className="w-11 h-11 sm:w-10 sm:h-10 md:w-9 md:h-9 rounded-full bg-peony-light flex items-center justify-center flex-shrink-0 transition-transform duration-200 active:scale-90 disabled:opacity-40"
              title="Envoyer une image à Yuna"
            >
              <IconPaperclip className="w-4 h-4 text-espresso/65" />
            </button>

            <input
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={gererToucheEntree}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-accent)'
                e.target.style.boxShadow = '0 0 0 4px color-mix(in srgb, var(--color-accent) 15%, transparent)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = ''
                e.target.style.boxShadow = 'none'
              }}
              placeholder="Écris à Yuna..."
              disabled={envoiEnCours}
              className="flex-1 min-w-0 bg-cream border border-peony/40 rounded-full px-4 py-3 md:py-2.5 text-[16px] md:text-[13px] text-espresso placeholder:text-espresso/40 outline-none transition-all duration-200 disabled:opacity-50"
            />

            {saisie.trim() ? (
              <button
                onClick={envoyerMessage}
                disabled={envoiEnCours}
                className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-espresso flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90 disabled:opacity-35 disabled:cursor-not-allowed"
              >
                <IconSend className="w-4 h-4 text-peony" />
              </button>
            ) : (
              <button
                onClick={demarrerEnregistrement}
                disabled={envoiEnCours}
                className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-espresso flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90 disabled:opacity-35 disabled:cursor-not-allowed"
                title="Enregistrer une note vocale"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="var(--color-peony)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatScreen