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

function MessageBubble({ message, onImageGeneree }) {

  const estUser = message.auteur === 'user'

  // Vérifie si c'est un message image envoyé par l'utilisateur
  const estImageUtilisateur = message.texte === '[IMAGE_ENVOYEE]' && message.imageUrl

  // Vérifie si c'est une image générée par Yuna
  const donneesImage = !estUser && !estImageUtilisateur
    ? extraireImage(message.texte)
    : null

  const urlImageYuna = donneesImage
    ? `https://image.pollinations.ai/prompt/${encodeURIComponent(donneesImage.description)}?width=512&height=512&nologo=true`
    : null

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

      <div className={`flex flex-col max-w-[65%] ${estUser ? 'items-end' : 'items-start'}`}>

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

        {/* ===== MESSAGE TEXTE NORMAL ===== */}
        {!estImageUtilisateur && (donneesImage ? donneesImage.texteAvant : message.texte) && (
          <div className={`px-4 py-2.5 text-[11px] leading-relaxed ${
            estUser
              ? 'bg-espresso text-peony rounded-[18px] rounded-br-[4px]'
              : 'bg-white text-espresso border border-peony/30 rounded-[18px] rounded-bl-[4px]'
          }`}>
            {donneesImage ? donneesImage.texteAvant : message.texte}
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

        <span className="text-[8px] text-espresso/35 mt-1 mx-1">
          {message.heure}
        </span>
      </div>
    </div>
  )
}

export default MessageBubble