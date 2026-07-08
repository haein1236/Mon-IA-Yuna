import { useState, useEffect, useRef } from 'react'
import MessageBubble   from '../components/MessageBubble'
import TypingIndicator from '../components/TypingIndicator'
import { IconSend, IconPaperclip } from '../components/Icons'
import AIAvatar from '../components/AIAvatar'
import { envoyerMessageAYuna, verifierMessageSpontane, extraireEtMemoriserFaits } from '../services/gemini'
import { sauvegarderConversation, creerNouvelleConversation } from '../services/conversations'
import { sauvegarderImage, fichierVersBase64 } from '../services/images'

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

  const inputImageRef = useRef(null)
  const basDeListeRef = useRef(null)

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

  // Vérifie si Yuna doit parler en premier à l'ouverture de l'écran
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

  const handleImageGeneree = (image) => {
    sauvegarderImage(image)
  }

  // ============================================================
  // NOUVELLE CONVERSATION
  // AVANT de tout réinitialiser, on demande à gemini.js d'extraire
  // les faits marquants de la conversation qu'on abandonne — pour ne
  // rien perdre de ce qu'on vient d'apprendre sur la personne.
  // Pas de "await" ici volontairement (fire and forget) : ça
  // s'exécute en tâche de fond sans ralentir la création de la
  // nouvelle conversation pour l'utilisateur.
  // ============================================================
  const nouvelleConversation = () => {
    extraireEtMemoriserFaits(messages)

    const conv = creerNouvelleConversation()
    if (onNouvelleConversation) {
      onNouvelleConversation(conv)
    }
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
      id: Date.now(),
      auteur: 'user',
      texte: '[IMAGE_ENVOYEE]',
      imageUrl: base64,
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

    const messageYuna = {
      id: Date.now() + 1, auteur: 'yuna', texte: reponseTexte,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((anciens) => [...anciens, messageYuna])

    e.target.value = ''
  }

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

    const reponseTexte = await envoyerMessageAYuna(
      nouveauxMessages.slice(1), texteUtilisateur
    )

    setYunaEcrit(false)
    setEnvoiEnCours(false)

    const messageYuna = {
      id: Date.now() + 1, auteur: 'yuna', texte: reponseTexte,
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((anciens) => [...anciens, messageYuna])
  }

  const gererToucheEntree = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      envoyerMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-cream overflow-hidden">

      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-peony/30 flex-shrink-0" style={{ boxShadow: '0 1px 0 rgba(62,39,35,0.03)' }}>

        <div
          className="w-10 h-10 rounded-full border border-peony flex items-center justify-center flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--color-peony) 30%, transparent)' }}
        >
          <AIAvatar size={23} />
        </div>

        <div className="flex-1">
          <p className="text-[13px] font-semibold text-espresso">Yuna</p>
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
              style={{ background: envoiEnCours ? '#C4917A' : '#4ade80' }}
            />
            <p className="text-[10px] text-espresso/55">
              {envoiEnCours ? 'En train de réfléchir...' : 'En ligne maintenant'}
            </p>
          </div>
        </div>

        <button
          onClick={nouvelleConversation}
          className="text-[10.5px] font-medium text-cream bg-espresso px-3.5 py-2 rounded-full hover:opacity-90 transition-opacity duration-200 flex items-center gap-1.5"
          title="Démarrer une nouvelle conversation"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouvelle
        </button>

        <button
          onClick={() => onChangerEcran('historique')}
          className="text-[10.5px] font-medium text-espresso/65 border border-peony/40 px-3.5 py-2 rounded-full hover:bg-peony-light hover:text-espresso transition-colors duration-200"
        >
          Historique
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-6 flex flex-col gap-4"
        style={{ background: 'linear-gradient(180deg, var(--color-cream) 0%, color-mix(in srgb, var(--color-cream), var(--color-peony) 8%) 100%)' }}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onImageGeneree={handleImageGeneree}
          />
        ))}
        {yunaEcrit && <TypingIndicator />}
        <div ref={basDeListeRef} />
      </div>

      <div className="flex items-center gap-3 px-6 py-4 bg-white border-t border-peony/30 flex-shrink-0">

        <div className="w-8 h-8 rounded-full bg-espresso flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"
            stroke="var(--color-peony)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </div>

        <input
          ref={inputImageRef}
          type="file"
          accept="image/*"
          onChange={handleEnvoyerImage}
          style={{ display: 'none' }}
        />

        <button
          onClick={() => inputImageRef.current?.click()}
          className="w-9 h-9 rounded-full bg-peony-light flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110"
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
          placeholder="Écris un message à Yuna... ou demande-lui une image !"
          disabled={envoiEnCours}
          className="flex-1 bg-cream border border-peony/40 rounded-full px-4 py-2.5 text-[12px] text-espresso placeholder:text-espresso/40 outline-none transition-all duration-200 disabled:opacity-50"
        />

        <button
          onClick={envoyerMessage}
          disabled={!saisie.trim() || envoiEnCours}
          className="w-10 h-10 rounded-full bg-espresso flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <IconSend className="w-4 h-4 text-peony" />
        </button>
      </div>
    </div>
  )
}

export default ChatScreen