import { useState } from 'react'
import AIAvatar from './AIAvatar'

// Détecte si un message contient une commande image [IMAGE: ...]
function extraireImage(texte) {
  const regex = /\[IMAGE:\s*([^\]]+)\]/
  const match = texte.match(regex)
  if (!match) return null
  return {
    texteAvant: texte.replace(regex, '').trim(),
    description: match[1].trim(),
  }
}

function formaterDureeAudio(secondes) {
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function MessageBubble({ message, onImageGeneree, onModifierMessage }) {

  const estUser = message.auteur === 'user'

  // Vérifie si c'est un message image envoyée par l'utilisateur
  const estImageUtilisateur = message.texte === '[IMAGE_ENVOYEE]' && message.imageUrl

  // Vérifie si c'est une note vocale envoyée par l'utilisateur
  const estAudioUtilisateur = message.texte === '[NOTE_VOCALE]' && message.audioUrl

  // Vérifie si c'est une image générée par Yuna
  const donneesImage = !estUser && !estImageUtilisateur && !estAudioUtilisateur
    ? extraireImage(message.texte)
    : null

  const urlImageYuna = donneesImage
    ? `https://image.pollinations.ai/prompt/${encodeURIComponent(donneesImage.description)}?width=512&height=512&nologo=true`
    : null

  // Seul un message texte "normal" envoyé par l'utilisateur peut être modifié
  // (pas les images, pas les notes vocales)
  const estModifiable = estUser && !estImageUtilisateur && !estAudioUtilisateur && !!onModifierMessage

  // ============================================================
  // ÉDITION DU MESSAGE
  // ============================================================
  const [enEdition, setEnEdition]       = useState(false)
  const [texteEdition, setTexteEdition] = useState(message.texte)

  const commencerEdition = () => {
    setTexteEdition(message.texte)
    setEnEdition(true)
  }

  const annulerEdition = () => {
    setTexteEdition(message.texte)
    setEnEdition(false)
  }

  const validerEdition = () => {
    const texteNettoye = texteEdition.trim()
    if (!texteNettoye || texteNettoye === message.texte) {
      setEnEdition(false)
      return
    }
    onModifierMessage(message.id, texteNettoye)
    setEnEdition(false)
  }

  const gererToucheEdition = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      validerEdition()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      annulerEdition()
    }
  }

  return (
    <div className={`flex items-end gap-2 ${estUser ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Avatar */}
      {estUser ? (
        <div className="w-8 h-8 rounded-full bg-espresso flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"
            stroke="var(--color-peony)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-peony-light border border-peony flex items-center justify-center flex-shrink-0">
          <AIAvatar size={20} />
        </div>
      )}

      <div className={`flex flex-col max-w-[80%] sm:max-w-[65%] ${estUser ? 'items-end' : 'items-start'}`}>

        <span className="text-[9px] font-semibold text-espresso/50 mb-1 mx-1">
          {estUser ? 'Toi' : 'Yuna'}
        </span>

        {/* ===== IMAGE ENVOYÉE PAR L'UTILISATEUR ===== */}
        {estImageUtilisateur && (
          <div className="rounded-2xl overflow-hidden" style={{ maxWidth: '220px' }}>
            <img
              src={message.imageUrl}
              alt="Image envoyée"
              className="w-full object-cover rounded-2xl"
              style={{ maxHeight: '250px' }}
            />
            <div className="bg-espresso px-3 py-1.5 -mt-1">
              <p className="text-[9px] text-peony/70 italic">Image envoyée à Yuna</p>
            </div>
          </div>
        )}

        {/* ===== NOTE VOCALE ENVOYÉE PAR L'UTILISATEUR ===== */}
        {estAudioUtilisateur && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-[18px] rounded-br-[4px] bg-espresso w-full" style={{ minWidth: '220px', maxWidth: '260px' }}>
            <div className="w-7 h-7 rounded-full bg-peony/20 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="var(--color-peony)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            </div>
            <audio controls src={message.audioUrl} className="flex-1 min-w-0" style={{ height: '32px' }} />
            {typeof message.dureeAudio === 'number' && (
              <span className="text-[9px] text-peony/70 flex-shrink-0 tabular-nums">
                {formaterDureeAudio(message.dureeAudio)}
              </span>
            )}
          </div>
        )}

        {/* ===== MODE ÉDITION D'UN MESSAGE TEXTE ===== */}
        {enEdition && (
          <div className="flex flex-col gap-1.5 w-full" style={{ minWidth: '220px' }}>
            <textarea
              autoFocus
              value={texteEdition}
              onChange={(e) => setTexteEdition(e.target.value)}
              onKeyDown={gererToucheEdition}
              onFocus={(e) => {
                const val = e.target.value
                e.target.value = ''
                e.target.value = val
              }}
              rows={Math.min(6, Math.max(2, texteEdition.split('\n').length))}
              className="px-4 py-2.5 text-[16px] sm:text-[11px] leading-relaxed bg-espresso text-peony rounded-[18px] rounded-br-[4px] outline-none resize-none border-2 border-peony/50 w-full"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={annulerEdition}
                className="text-[10px] font-medium text-espresso/60 px-3 py-1.5 rounded-full hover:bg-peony-light active:scale-95 transition-all duration-150"
              >
                Annuler
              </button>
              <button
                onClick={validerEdition}
                disabled={!texteEdition.trim()}
                className="text-[10px] font-medium text-cream bg-espresso px-3.5 py-1.5 rounded-full hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all duration-150"
              >
                Renvoyer
              </button>
            </div>
          </div>
        )}

        {/* ===== MESSAGE TEXTE NORMAL ===== */}
        {!enEdition && !estImageUtilisateur && !estAudioUtilisateur && (donneesImage ? donneesImage.texteAvant : message.texte) && (
          <div className="group flex items-end gap-1">
            {estModifiable && (
              <button
                onClick={commencerEdition}
                className="flex-shrink-0 w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-espresso/35 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 hover:text-espresso/70 hover:bg-peony-light"
                title="Modifier ce message"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            )}
            <div className={`px-4 py-2.5 text-[11px] leading-relaxed ${
              estUser
                ? 'bg-espresso text-peony rounded-[18px] rounded-br-[4px]'
                : 'bg-white text-espresso border border-peony/30 rounded-[18px] rounded-bl-[4px]'
            }`}>
              {donneesImage ? donneesImage.texteAvant : message.texte}
            </div>
          </div>
        )}

        {/* ===== IMAGE GÉNÉRÉE PAR YUNA ===== */}
        {urlImageYuna && (
          <div className="mt-2 rounded-2xl overflow-hidden border border-peony/30" style={{ maxWidth: '220px' }}>
            <img
              src={urlImageYuna}
              alt={donneesImage.description}
              className="w-full object-cover"
              style={{ borderRadius: '14px 14px 0 0' }}
              onLoad={() => {
                // Sauvegarde dans la galerie quand l'image est chargée
                if (onImageGeneree) {
                  onImageGeneree({
                    id: Date.now().toString(),
                    titre: donneesImage.description,
                    mood: 'Illustration',
                    texte: `"${donneesImage.description}"`,
                    sous: `Yuna · ${new Date().toLocaleDateString('fr-FR')}`,
                    source: 'yuna',
                    favori: false,
                    url: urlImageYuna,
                    date: new Date().toISOString(),
                  })
                }
              }}
              onError={(e) => {
                // Cache l'image si elle ne charge pas
                e.target.parentElement.style.display = 'none'
              }}
            />
            <div className="bg-white px-3 py-1.5 border-t border-peony/20">
              <p className="text-[9px] text-espresso/50 italic truncate">
                {donneesImage.description}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 mt-1 mx-1">
          {message.modifie && !enEdition && (
            <span className="text-[8px] text-espresso/35 italic">modifié ·</span>
          )}
          <span className="text-[8px] text-espresso/35">
            {message.heure}
          </span>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble